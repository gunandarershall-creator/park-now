// ============================================================================
//  MODEL: bookingModel.js - everything that touches bookings in Firestore
// ============================================================================
//  A "model" file in my MVC setup is a thin wrapper around Firebase. It
//  holds no React state, no UI logic. Just plain async functions that
//  read and write the database. Controllers (hooks) call into these.
//
//  What lives here:
//    subscribeToBookings  - live-feed of every booking doc
//    saveBooking          - create a new booking
//    updateBooking        - change fields on an existing booking
// ============================================================================

import { setDoc, updateDoc, onSnapshot, query, doc } from "firebase/firestore";
import { getBookingsRef } from "./firebase";

// ─── Live subscription to the whole bookings collection ─────────────────────
// onSnapshot opens a live pipe to Firestore: any time a booking is added,
// changed, or removed, `onData` gets called with the fresh list. Returns
// an unsubscribe function so the caller can detach when the component
// unmounts.
export const subscribeToBookings = (onData, onError) => {
  const q = query(getBookingsRef());
  return onSnapshot(q, (snap) => {
    // Each "snap.docs" entry is a Firestore doc. Pull the id and merge
    // it with the rest of the data so downstream code has everything.
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onData(docs);
  }, onError);
};

// ─── Create a booking ───────────────────────────────────────────────────────
// setDoc with an explicit id (rather than addDoc which auto-generates one)
// because I build my own id server-side to make it easier to reference.
export const saveBooking = async (bookingData) => {
  const ref = doc(getBookingsRef(), bookingData.id);
  await setDoc(ref, bookingData);
};

// ─── Update a booking ───────────────────────────────────────────────────────
// Used for things like flipping status to "cancelled", writing a review,
// extending end time. Only the fields passed in are changed, everything
// else stays as it was.
export const updateBooking = async (id, fields) => {
  const ref = doc(getBookingsRef(), id);
  await updateDoc(ref, fields);
};
