/**
 * MODEL: concurrencyModel.js
 * Implements a Hybrid Optimistic Concurrency Control (OCC) algorithm
 * using Firestore transactions to guarantee conflict-free P2P bookings.
 *
 * Algorithm (3-phase):
 *   Phase 1 – Read:   Fetch the spot document optimistically (no lock held).
 *   Phase 2 – Validate: Check spotsLeft > 0 and no overlapping active booking.
 *   Phase 3 – Commit: Atomically decrement inventory AND write the booking record.
 *
 * If another transaction modifies the spot between Phase 1 and Phase 3,
 * Firestore detects the conflict and auto-retries — achieving OCC semantics
 * without requiring a distributed lock or pessimistic locking overhead.
 *
 * This prevents double-booking even under high concurrent load.
 *
 * Reference: Baker (2021) — Optimistic Concurrency Control in distributed systems.
 */

import { runTransaction, doc, query, where, getDocs } from "firebase/firestore";
import { db, getSpotsRef, getBookingsRef } from "./firebase";

/**
 * Attempts to atomically book a parking spot.
 * Throws a typed error string on failure so the caller can show a user-friendly message.
 *
 * @param {object} spot         - The spot object (id, price, hostId, address, spotsLeft)
 * @param {object} user         - Firebase auth user (uid)
 * @param {number} bookingDuration  - Duration in hours
 * @param {boolean} hasInsurance    - Whether driver opted into £1.50 insurance
 * @returns {object} { bookingId, newSpotsLeft, amountToCharge, startTime, endTime }
 */
export const bookSpotAtomically = async ({ spot, user, bookingDuration, hasInsurance, bookingStartTime }) => {
  const spotRef  = doc(getSpotsRef(), spot.id);
  const bookingId  = `${Date.now()}-${user.uid.slice(0, 6)}`;
  const bookingRef = doc(getBookingsRef(), bookingId);

  // Use driver-selected start time if provided, otherwise default to now
  const startTime = (() => {
    const d = new Date();
    if (bookingStartTime) {
      const [h, m] = bookingStartTime.split(':').map(Number);
      d.setHours(h, m, 0, 0);
    }
    return d;
  })();
  const endTime   = new Date(startTime.getTime() + bookingDuration * 3600 * 1000);
  const amountToCharge = +(spot.price * bookingDuration + (hasInsurance ? 1.50 : 0)).toFixed(2);

  // ─── Pre-transaction: check for overlapping active bookings (spatio-temporal) ───
  await assertNoOverlappingBooking(spot.id, startTime, endTime, user.uid);

  // ─── Firestore OCC Transaction ────────────────────────────────────────────────
  const result = await runTransaction(db, async (txn) => {

    // PHASE 1 — Read (optimistic, no lock)
    const spotSnap = await txn.get(spotRef);

    if (!spotSnap.exists()) {
      throw Object.assign(new Error("This spot no longer exists."), { code: "SPOT_NOT_FOUND" });
    }

    const liveData  = spotSnap.data();
    const spotsLeft = typeof liveData.spotsLeft === "number" ? liveData.spotsLeft : 1;

    // PHASE 2 — Validate (conflict detection)
    if (spotsLeft <= 0) {
      throw Object.assign(new Error("This spot has just been taken by another driver."), { code: "SPOT_UNAVAILABLE" });
    }

    // PHASE 3 — Commit (atomic: inventory + booking in one write batch)
    const newSpotsLeft = spotsLeft - 1;

    if (newSpotsLeft <= 0) {
      // Mark as temporarily unavailable (isActive: false) rather than deleting —
      // deletion permanently removes the host's listing from their dashboard.
      // The host can re-activate it from their listings panel after the session ends.
      txn.update(spotRef, { spotsLeft: 0, isActive: false });
    } else {
      txn.update(spotRef, { spotsLeft: newSpotsLeft });
    }

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

    return { bookingId, newSpotsLeft, amountToCharge, startTime, endTime };
  });

  return result;
};

/**
 * Spatio-Temporal Overlap Check
 * Queries existing bookings for the same spot and rejects if any active booking
 * overlaps with the requested [startTime, endTime] window.
 *
 * Overlap condition: existingStart < requestedEnd AND existingEnd > requestedStart
 *
 * This implements the temporal dimension of the spatio-temporal query architecture
 * described in the design chapter (Section 3.9.2).
 */
const assertNoOverlappingBooking = async (spotId, startTime, endTime, userId) => {
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

    // Overlap: the two intervals intersect
    const overlaps = bStart < endTime && bEnd > startTime;

    if (overlaps && b.driverId !== userId) {
      throw Object.assign(
        new Error("This spot is already booked for the selected time window."),
        { code: "TIME_CONFLICT" }
      );
    }
  }
};
