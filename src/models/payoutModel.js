/**
 * MODEL: payoutModel.js
 * Pure async functions for Payout Firestore operations.
 * No React state — just data access.
 */

import { addDoc, collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "./firebase";
import { serverTimestamp } from "firebase/firestore";

const getPayoutsRef = () => collection(db, 'payouts');

export const requestPayout = async (userId, amount) => {
  await addDoc(getPayoutsRef(), {
    userId,
    amount,
    status: 'pending',
    requestedAt: serverTimestamp(),
  });
};

export const subscribeToPayouts = (userId, onData) => {
  const q = query(
    getPayoutsRef(),
    where('userId', '==', userId),
    orderBy('requestedAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onData(docs);
  });
};
