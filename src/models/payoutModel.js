/**
 * MODEL: payoutModel.js
 * Pure async functions for Payout Firestore operations.
 * No React state — just data access.
 */

import { addDoc, updateDoc, onSnapshot, query, where, serverTimestamp, doc } from 'firebase/firestore';
import { getPayoutsRef } from './firebase';

export const requestPayout = async (userId, amount) => {
  await addDoc(getPayoutsRef(), {
    userId,
    amount,
    status: 'pending',
    requestedAt: serverTimestamp(),
  });
};

export const completePayout = async (payoutId) => {
  await updateDoc(doc(getPayoutsRef(), payoutId), {
    status: 'completed',
    completedAt: serverTimestamp(),
  });
};

/**
 * Subscribe to all payouts for a user.
 * Sorting is done in JS to avoid needing a Firestore composite index
 * on (userId, requestedAt).
 */
export const subscribeToPayouts = (userId, onData, onError) => {
  const q = query(getPayoutsRef(), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const toMs = (ts) =>
            ts?.toDate ? ts.toDate().getTime() : ts ? new Date(ts).getTime() : 0;
          return toMs(b.requestedAt) - toMs(a.requestedAt); // newest first
        });
      onData(docs);
    },
    onError,
  );
};
