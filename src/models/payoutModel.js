// ============================================================================
//  MODEL: payoutModel.js - hosts cashing out their earnings
// ============================================================================
//  When a host earns money from bookings, it accumulates as an "available
//  balance". When they press "Withdraw", I create a payout document with
//  status "pending". In a real product a server job or Stripe Connect
//  webhook would actually move money and then flip the status to
//  "completed". In this prototype, I just flip it manually for the demo.
// ============================================================================

import { addDoc, updateDoc, onSnapshot, query, where, serverTimestamp, doc } from 'firebase/firestore';
import { getPayoutsRef } from './firebase';

// ─── Create a new payout request ────────────────────────────────────────────
// serverTimestamp() gets replaced with the actual server clock time
// when the write lands, which keeps times consistent between devices.
export const requestPayout = async (userId, amount) => {
  await addDoc(getPayoutsRef(), {
    userId,
    amount,
    status: 'pending',
    requestedAt: serverTimestamp(),
  });
};

// ─── Mark a payout as completed ─────────────────────────────────────────────
// (Used in demo mode. Real version would be called by a backend after
// the funds have actually moved.)
export const completePayout = async (payoutId) => {
  await updateDoc(doc(getPayoutsRef(), payoutId), {
    status: 'completed',
    completedAt: serverTimestamp(),
  });
};

// ─── Live subscription to a user's payouts ──────────────────────────────────
// I sort client-side instead of adding an orderBy clause to the query,
// because adding orderBy on top of a where() requires a composite
// Firestore index. Saves me the admin overhead of creating one.
export const subscribeToPayouts = (userId, onData, onError) => {
  const q = query(getPayoutsRef(), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          // serverTimestamp returns a Firestore Timestamp object with a
          // toDate() method. Fall back to a regular parse if it's
          // already been serialised.
          const toMs = (ts) =>
            ts?.toDate ? ts.toDate().getTime() : ts ? new Date(ts).getTime() : 0;
          return toMs(b.requestedAt) - toMs(a.requestedAt); // newest first
        });
      onData(docs);
    },
    onError,
  );
};
