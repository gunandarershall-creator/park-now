// ============================================================================
//  CONCURRENCY STRESS TEST - Park Now
// ============================================================================
//  What is this file and why does it exist?
//  ----------------------------------------
//  One of the hardest problems in this project is what I call the "last spot
//  race". Imagine a parking space that has only ONE booking slot left. Two
//  drivers, on opposite sides of London, both tap "Book Now" at exactly the
//  same millisecond. Without protection, both of them would read "1 spot
//  available", both would write "0 spots available", and the database would
//  now contain TWO confirmed bookings for the same physical parking space.
//  The host turns up and there's a fight. Very bad.
//
//  The fix is called Optimistic Concurrency Control (OCC). Firebase gives
//  me a tool called `runTransaction` that does this:
//      1. READ the current spotsLeft value, and remember a "version number"
//      2. VALIDATE the value (is it greater than zero?)
//      3. COMMIT the write, BUT only if the version hasn't changed in the
//         meantime. If it has, the whole thing is thrown out and retried.
//
//  The claim I make in the dissertation is that, under heavy concurrent
//  load, exactly ONE booking always wins and the rest are cleanly rejected.
//  This file is how I prove it.
//
//  What this test actually does:
//  -----------------------------
//  Instead of firing 100 real bookings at Firebase (which would pollute my
//  production data and also get rate-limited), I wrote a tiny in-memory
//  database that behaves EXACTLY like Firestore's transaction engine. Same
//  read-then-commit-with-version-check dance. Then I fire 100 fake drivers
//  at a single spot that only has 1 place left, and check that only 1 of
//  them wins.
//
//  If my code has a race condition bug, this test would catch it, because
//  the in-memory model behaves the same way as the real thing on the bits
//  I care about.
//
//  HOW TO RUN:
//    node tests/concurrency-stress.js         (default: 100 drivers)
//    node tests/concurrency-stress.js 500     (override: 500 drivers)
//
//  WHAT YOU SEE IN THE OUTPUT:
//    Per-trial results showing how many won, how many lost, how many
//    retries happened, and a PASS/FAIL for three correctness checks.
// ============================================================================

'use strict';

// ─── CONFIGURATION ──────────────────────────────────────────────────────────
// These numbers control the size of the experiment. If you pass a different
// number on the command line it will use that instead (see process.argv).

// How many fake drivers try to book at once? Default 100.
const N_CONCURRENT = parseInt(process.argv[2], 10) || 100;

// How many spots are available at the start? This is the interesting case:
// with only 1 spot, we should see a fight over it, and exactly 1 winner.
const INITIAL_SPOTS_LEFT = 1;

// I repeat the whole experiment this many times, because timing can vary
// between runs. If any single trial fails an invariant the whole test fails.
const TRIALS = 5;


// ============================================================================
//  THE MOCK DATABASE
// ============================================================================
//  This class pretends to be Firestore. It stores documents in a plain
//  object and, crucially, gives each document a hidden "version number"
//  that bumps every time the document is written. That version number is
//  how we detect conflicts: if you read version 3 and then try to write,
//  but by the time you get to committing the version is already 4 (because
//  somebody else beat you to it), your write is thrown out and you retry.
// ============================================================================
class MockFirestore {
  constructor(docs = {}) {
    // This is where all documents live. Each entry looks like:
    //   { data: {...the actual fields...}, version: 0 }
    this._docs = {};

    // A counter that tracks how many times a transaction had to retry
    // because of a conflict. Useful to report at the end.
    this._retries = 0;

    // Seed the store with whatever documents the caller passed in.
    for (const [id, data] of Object.entries(docs)) {
      this._docs[id] = { data: { ...data }, version: 0 };
    }
  }

  // ── runTransaction ─────────────────────────────────────────────────────
  // This is the whole OCC algorithm. The caller hands me a function that
  // does their read/write logic, and I run it inside a safe box.
  //
  // I give them a `txn` object with .get(), .update(), .set() methods. But
  // here's the trick: their .update() and .set() don't actually write to
  // the database straight away. I buffer the writes in a local Map. Only
  // AFTER their function returns do I check whether any document they read
  // has changed underneath them. If nothing has changed, I apply the
  // buffered writes. If something HAS changed, I throw their work away and
  // run the whole thing again from scratch. Up to 5 attempts total.
  async runTransaction(updateFn) {
    const MAX_ATTEMPTS = 5;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {

      // Everything we read during this attempt, and the version we saw.
      // At commit time we re-check every version is still the same.
      const reads = new Map();

      // Everything we want to write. Buffered, not applied yet.
      const writes = new Map();

      // The txn object we hand to the caller's function.
      const txn = {
        // Read a document. Remember what version we saw, so we can
        // detect conflicts at commit time.
        get: (id) => {
          const doc = this._docs[id];
          if (!doc) return { exists: () => false, data: () => null };
          reads.set(id, doc.version);
          return {
            exists: () => true,
            data:   () => ({ ...doc.data }),
          };
        },

        // Queue up a partial update (merge with existing fields).
        update: (id, patch) => {
          const current = writes.get(id) || { ...this._docs[id].data };
          writes.set(id, { ...current, ...patch });
        },

        // Queue up a full replacement / new document.
        set: (id, data) => {
          writes.set(id, { ...data });
        },
      };

      // Run the caller's logic. If their code throws a business error like
      // "spot unavailable", I want that to bubble straight up to them, not
      // get swallowed and retried. Retries only happen for version
      // conflicts, same as real Firestore.
      let result;
      try {
        result = await updateFn(txn);
      } catch (err) {
        throw err;
      }

      // ── COMMIT PHASE ───────────────────────────────────────────────
      // Before applying any writes, re-check every document we read.
      // If any version has moved, somebody else beat us. Bail and retry.
      let conflict = false;
      for (const [id, readVersion] of reads) {
        if (this._docs[id] && this._docs[id].version !== readVersion) {
          conflict = true;
          break;
        }
      }

      if (conflict) {
        this._retries++;
        // setImmediate gives other pending transactions a chance to run
        // before we try again. Real Firestore would also add exponential
        // backoff here.
        await new Promise((r) => setImmediate(r));
        continue;
      }

      // No conflict. Apply all the buffered writes and bump versions.
      for (const [id, data] of writes) {
        const existing = this._docs[id];
        this._docs[id] = {
          data,
          version: existing ? existing.version + 1 : 0,
        };
      }
      return result;
    }

    // If we hit 5 retries without a clean commit, give up. Real Firestore
    // behaves the same way, it just eventually throws.
    throw new Error('OCC_MAX_RETRIES_EXCEEDED');
  }

  // Helpers for inspecting the store after a test finishes.
  getDoc(id) { return this._docs[id] ? { ...this._docs[id].data } : null; }
  countDocs(predicate = () => true) {
    return Object.values(this._docs).filter((d) => predicate(d.data)).length;
  }
  retries() { return this._retries; }
}


// ============================================================================
//  THE BOOKING TRANSACTION (copy of the real app's logic)
// ============================================================================
//  This function mirrors what my real booking code does inside
//  src/models/concurrencyModel.js. If I change the real file, I should
//  change this one too, because the whole point of the test is to exercise
//  the same logic.
//
//  The three phases of OCC are clearly marked below.
// ============================================================================
async function bookSpotAtomically(store, spotId, driverId, duration) {
  // Make a unique id for this booking. Combination of timestamp + random
  // chars + a slice of the driver id. Collision probability is essentially
  // zero for our purposes.
  const bookingId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${driverId.slice(0, 4)}`;

  return store.runTransaction(async (txn) => {
    // PHASE 1 - READ
    // Fetch the spot document. If it doesn't exist (maybe host deleted
    // it in the last second), throw straight away.
    const spotSnap = txn.get(spotId);
    if (!spotSnap.exists()) {
      const e = new Error('SPOT_NOT_FOUND'); e.code = 'SPOT_NOT_FOUND'; throw e;
    }
    const { spotsLeft } = spotSnap.data();

    // PHASE 2 - VALIDATE
    // If someone beat us and the inventory is already zero, reject
    // this attempt. This is what produces the "losers" in the race.
    if (spotsLeft <= 0) {
      const e = new Error('SPOT_UNAVAILABLE'); e.code = 'SPOT_UNAVAILABLE'; throw e;
    }

    // PHASE 3 - COMMIT
    // Decrement the counter and create the booking document. These two
    // writes happen atomically: either both succeed or neither does.
    const newSpotsLeft = spotsLeft - 1;
    txn.update(spotId, { spotsLeft: newSpotsLeft });
    txn.set(`booking_${bookingId}`, {
      bookingId, driverId, spotId, duration, status: 'confirmed',
    });

    return { bookingId, newSpotsLeft };
  });
}


// ============================================================================
//  ONE TRIAL
// ============================================================================
//  Fire N drivers at the same spot at once, then look at the damage.
// ============================================================================
async function runTrial(trialNumber) {
  // Fresh database for each trial, so trials don't interfere with each
  // other. Start with exactly 1 spot available.
  const store = new MockFirestore({
    'spot-42': { spotsLeft: INITIAL_SPOTS_LEFT, price: 2.5 },
  });

  // Build an array of N booking attempts. Each one either resolves with
  // { ok: true, ... } on success or { ok: false, code } on failure. We
  // don't await them one at a time - we kick them all off and then
  // Promise.all waits for all of them to finish, which is what creates
  // the race condition.
  const attempts = Array.from({ length: N_CONCURRENT }, (_, i) =>
    bookSpotAtomically(store, 'spot-42', `driver-${String(i).padStart(4, '0')}`, 2)
      .then((r) => ({ ok: true,  ...r }))
      .catch((e) => ({ ok: false, code: e.code || 'UNKNOWN', message: e.message }))
  );

  const results = await Promise.all(attempts);

  // Categorise the results.
  const successes = results.filter((r) => r.ok);
  const failures  = results.filter((r) => !r.ok);
  const unavailable = failures.filter((r) => r.code === 'SPOT_UNAVAILABLE').length;
  const otherFails  = failures.filter((r) => r.code !== 'SPOT_UNAVAILABLE').length;

  // Post-trial inspection: what does the database actually look like now?
  const finalSpots  = store.getDoc('spot-42').spotsLeft;
  const bookingsWritten = store.countDocs((d) => d.status === 'confirmed');

  return {
    trial: trialNumber,
    successes: successes.length,
    unavailable,
    otherFails,
    finalSpots,
    bookingsWritten,
    retries: store.retries(),
  };
}


// ============================================================================
//  THE THREE INVARIANTS
// ============================================================================
//  An invariant is a fact that must ALWAYS hold true. If any of these is
//  false in any trial, OCC has failed and the test fails.
//
//  INV-1: Exactly one transaction commits. Not zero (deadlock) and not
//         more than one (double-booking).
//  INV-2: The counter lands on zero and stops. Never goes negative,
//         never gets stuck at 1.
//  INV-3: The number of actual booking documents in the database
//         matches the number of successful commits. In other words,
//         there are no "ghost" successes where the counter decremented
//         but no booking was recorded.
// ============================================================================
function checkInvariants(trials) {
  const inv1 = trials.every((t) => t.successes === INITIAL_SPOTS_LEFT);
  const inv2 = trials.every((t) => t.finalSpots === 0);
  const inv3 = trials.every((t) => t.bookingsWritten === INITIAL_SPOTS_LEFT);
  return {
    'INV-1: Exactly one transaction commits (no double-booking)':        inv1,
    'INV-2: Inventory decrements to zero and stops':                     inv2,
    'INV-3: Booking-document count equals successful-commit count':      inv3,
  };
}


// ============================================================================
//  MAIN - runs when you do `node tests/concurrency-stress.js`
// ============================================================================
(async () => {
  // Print the banner and parameters. The funny characters are box-drawing
  // Unicode - they look nice in a terminal.
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  PARK NOW - Concurrency Stress Test (OCC)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  N_CONCURRENT  : ${N_CONCURRENT}`);
  console.log(`  INITIAL_SPOTS : ${INITIAL_SPOTS_LEFT}`);
  console.log(`  TRIALS        : ${TRIALS}`);
  console.log('───────────────────────────────────────────────────────────────');

  // Run the trials sequentially and print a line for each.
  const trials = [];
  for (let i = 1; i <= TRIALS; i++) {
    const t = await runTrial(i);
    trials.push(t);
    console.log(
      `  Trial ${String(i).padStart(2)} │ ` +
      `success=${t.successes}  unavailable=${t.unavailable}  ` +
      `otherFail=${t.otherFails}  finalSpots=${t.finalSpots}  ` +
      `bookingsWritten=${t.bookingsWritten}  retries=${t.retries}`
    );
  }

  console.log('───────────────────────────────────────────────────────────────');

  // Summary stats across all trials.
  const avgRetries = (trials.reduce((s, t) => s + t.retries, 0) / TRIALS).toFixed(1);
  const totalFailures = trials.reduce((s, t) => s + t.unavailable, 0);
  console.log(`  Avg retries per trial : ${avgRetries}`);
  console.log(`  Total losers (across all trials, correctly rejected) : ${totalFailures}`);

  console.log('───────────────────────────────────────────────────────────────');
  console.log('  CORRECTNESS INVARIANTS');
  console.log('───────────────────────────────────────────────────────────────');

  // Run the invariant checks and print PASS/FAIL for each.
  const checks = checkInvariants(trials);
  let allPass = true;
  for (const [desc, ok] of Object.entries(checks)) {
    console.log(`  [${ok ? ' PASS ' : ' FAIL '}]  ${desc}`);
    if (!ok) allPass = false;
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  VERDICT: ${allPass ? 'PASS - OCC guarantees hold under load.' : 'FAIL - OCC violated!'}`);
  console.log('═══════════════════════════════════════════════════════════════');

  // Exit code 0 means success, 1 means failure. This lets CI pipelines
  // (or a shell script) tell whether the test passed without parsing the
  // text output.
  process.exit(allPass ? 0 : 1);
})();
