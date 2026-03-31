/**
 * MODEL: reportModel.js
 * Saves user-submitted reports to Firestore.
 */

import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Submits a report to the 'reports' collection.
 */
export async function submitReport({ userId, userType, category, description, relatedId = null, relatedAddress = null }) {
  await addDoc(collection(db, 'reports'), {
    userId,
    userType,
    category,
    description: description.trim(),
    relatedId,
    relatedAddress,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}
