// ============================================================================
//  MODEL: concurrencyModel.js - the heart of the booking system
// ============================================================================
//  This file is the most important piece of code in the whole project.
//  Everything that prevents double-booking lives here.
//
//  The problem (again):
//    Two drivers tap "Book Now" on the same spot at the same time. If I
//    naively read the counter, subtract 1, and write it back, both
//    writes think they decremented from 1 to 0, and two bookings get
//    saved for a spot that only exists once. Host arrives, chaos.
//
//  The fix: Optimistic Concurrency Control using Firestore transactions.
//  Three phases:
//    Phase 1 READ:     Read the spot (no lock, "optimistic" = assume
//                      nobody else is meddling and deal with it later).
//    Phase 2 VALIDATE: Check spotsLeft > 0. Check no other booking
//                      overlaps our time window.
//    Phase 3 COMMIT:   Decrement the counter AND save the booking in
//                      one atomic write batch.
//
//  If another transaction commits between our read and our write,
//  Firestore detects the conflict and automatically replays our whole
//  function. So we never apply stale writes. No distributed locks
//  needed, no manual retry logic in the caller.
//
//  There's also a BEFORE-transaction check for time-window overlap,
//  because two bookings at different times on the same spot shouldn't
//  conflict on the counter but should still be rejected.
//
//  Reference: Baker (2021), Optimistic Concurrency Control in
//  distributed systems.
// ============================================================================

import { runTransaction, doc, query, where, getDocs } from "firebase/firestore";
import { db, getSpotsRef, getBookingsRef } from "./firebase";

/**
 * Try to book a parking spot atomically. Either the whole thing succeeds
 * and a booking row lands in Firestore with the counter decremented, or
 * NOTHING happens and an error is thrown with a specific code the UI
 * can match on.
 *
 * Possible error codes:
 *   SPOT_NOT_FOUND   - the spot was deleted between listing and booking
 *   SPOT_UNAVAILABLE - somebody else grabbed the last place
 *   TIME_CONFLICT    - this time window clashes with an existing booking
 */
export const bookSpotAtomically = async ({ spot, user, bookingDuration, hasInsurance, bookingStartTime }) => {
  // Handles to the two documents we're about to read/write.
  const spotRef  = doc(getSpotsRef(), spot.id);
  const bookingId  = `${Date.now()}-${user.uid.slice(0, 6)}`;
  const bookingRef = doc(getBookingsRef(), bookingId);

  // ─── Work out start/end times ─────────────────────────────────────────
  // bookingStartTime can come in as:
  //   - undefined/null             => book starting right now
  //   - "YYYY-MM-DDTHH:MM"         => the new ISO format from the picker
  //   - "HH:MM" (legacy)           => assume today
  //
  // Special case: if the driver picked the CURRENT MINUTE (very common
  // because the picker only has minute precision), snap to the precise
  // Date.now() including seconds and ms. That way the countdown timer
  // starts with exactly N hours visible instead of 1:59:XX.
  const startTime = (() => {
    let d;
    if (!bookingStartTime) return new Date();
    if (bookingStartTime.includes('-')) {
      // New ISO format
      d = new Date(bookingStartTime);
      if (isNaN(d.getTime())) d = new Date();
    } else {
      // Legacy HH:MM - assume today
      d = new Date();
      const [h, m] = bookingStartTime.split(':').map(Number);
      d.setHours(h, m, 0, 0);
    }
    // Did the user pick the current wall-clock minute?
    const now = new Date();
    if (d.getFullYear() === now.getFullYear() &&
        d.getMonth()    === now.getMonth()    &&
        d.getDate()     === now.getDate()     &&
        d.getHours()    === now.getHours()    &&
        d.getMinutes()  === now.getMinutes()) {
      // Yes - snap to right-now-including-seconds.
      return now;
    }
    return d;
  })();
  const endTime   = new Date(startTime.getTime() + bookingDuration * 3600 * 1000);

  // Price calc: hourly rate × hours + optional insurance.
  // The +(x.toFixed(2)) trick rounds to 2 decimal places AND converts
  // back to a number (toFixed returns a string on its own).
  const amountToCharge = +(spot.price * bookingDuration + (hasInsurance ? 1.50 : 0)).toFixed(2);


  // ─── Pre-transaction: temporal overlap check ─────────────────────────
  // This runs OUTSIDE the transaction because time-window conflicts are
  // a separate concern from the inventory counter. If the window clashes
  // with an existing booking, bail before we even open a transaction.
  await assertNoOverlappingBooking(spot.id, startTime, endTime, user.uid);


  // ─── The transaction itself ──────────────────────────────────────────
  const result = await runTransaction(db, async (txn) => {

    // PHASE 1 - READ (no lock, optimistic)
    const spotSnap = await txn.get(spotRef);
    if (!spotSnap.exists()) {
      // Spot was deleted between the driver seeing it and pressing Pay.
      throw Object.assign(new Error("This spot no longer exists."), { code: "SPOT_NOT_FOUND" });
    }

    const liveData  = spotSnap.data();
    // Default to 1 if the field is missing (defensive for older docs).
    const spotsLeft = typeof liveData.spotsLeft === "number" ? liveData.spotsLeft : 1;

    // PHASE 2 - VALIDATE (conflict detection)
    if (spotsLeft <= 0) {
      // Someone beat us to the last place. This is the losing branch
      // of the concurrency race.
      throw Object.assign(new Error("This spot has just been taken by another driver."), { code: "SPOT_UNAVAILABLE" });
    }

    // PHASE 3 - COMMIT (atomic: both writes land together or neither does)
    const newSpotsLeft = spotsLeft - 1;

    if (newSpotsLeft <= 0) {
      // Counter hit zero. Flip isActive to false so the listing
      // disappears from the map, but DON'T delete the doc - the host
      // may re-open the spot after the session ends.
      txn.update(spotRef, { spotsLeft: 0, isActive: false });
    } else {
      // Still have places left, just decrement.
      txn.update(spotRef, { spotsLeft: newSpotsLeft });
    }

    // Write the booking document in the same transaction.
    txn.set(bookingRef, {
      id:          bookingId,
      driverId:    user.uid,
      hostId:      spot.hostId || "unknown",
      spotId:      spot.id,
      address:     spot.address,
      duration:    bookingDuration,
      totalPaid:   amountToCharge,
      hasInsurance,
      timestamp:   startTime.toISOString(),
      startTime:   startTime.toISOString(),
      endTime:     endTime.toISOString(),
      status:      "confirmed",
    });

    // Return value from the transaction, received by the caller.
    return { bookingId, newSpotsLeft, amountToCharge, startTime, endTime };
  });

  return result;
};


// ============================================================================
//  Spatio-temporal overlap check
// ============================================================================
//  Two bookings overlap in time if:
//     existingStart < requestedEnd   AND   existingEnd > requestedStart
//
//  This one-liner catches every overlap pattern (contained, partial,
//  encompassing) without needing separate cases.
//
//  Runs BEFORE the OCC transaction because it's a different kind of
//  conflict than the inventory counter.
// ============================================================================
const assertNoOverlappingBooking = async (spotId, startTime, endTime, userId) => {
  // Get every confirmed booking for this spot. I filter further in JS
  // rather than in the query, because Firestore doesn't support range
  // queries on two fields at the same time without a composite index.
  const q = query(
    getBookingsRef(),
    where("spotId", "==", spotId),
    where("status",  "==", "confirmed")
  );

  const snap = await getDocs(q);

  for (const docSnap of snap.docs) {
    const b = docSnap.data();
    const bStart = new Date(b.startTime);
    const bEnd   = new Date(b.endTime);

    // The classic interval-overlap formula.
    const overlaps = bStart < endTime && bEnd > startTime;

    // Ignore the driver's own bookings - they're allowed to re-book
    // or view their own slot without triggering a conflict.
    if (overlaps && b.driverId !== userId) {
      throw Object.assign(
        new Error("This spot is already booked for the selected time window."),
        { code: "TIME_CONFLICT" }
      );
    }
  }
};
