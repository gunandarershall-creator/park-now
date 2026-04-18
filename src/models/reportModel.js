/**
 * MODEL: reportModel.js
 * Saves user-submitted reports to Firestore.
 */

import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';

/**
 * Submits a report to the 'reports' collection.
 * hostId identifies which host's listing was reported so they can see it in their dashboard.
 */
export async function submitReport({ userId, userType, category, description, relatedId = null, relatedAddress = null, hostId = null }) {
  await addDoc(collection(db, 'reports'), {
    userId,
    userType,
    category,
    description: description.trim(),
    relatedId,
    relatedAddress,
    hostId,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

/**
 * Live subscription to reports filed against a specific host's listings.
 */
export const subscribeToReportsForHost = (hostId, onData, onError) => {
  const q = query(collection(db, 'reports'), where('hostId', '==', hostId));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, onError);
};
