/**
 * MODEL: bookingModel.js
 * Pure async functions for Booking Firestore operations.
 * No React state — just data access.
 */

import { setDoc, onSnapshot, query, doc } from "firebase/firestore";
import { getBookingsRef } from "./firebase";

export const subscribeToBookings = (onData, onError) => {
  const q = query(getBookingsRef());
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map(d => d.data());
    onData(docs);
  }, onError);
};

export const saveBooking = async (bookingData) => {
  const ref = doc(getBookingsRef(), bookingData.id);
  await setDoc(ref, bookingData);
};
