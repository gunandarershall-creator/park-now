// ============================================================================
//  MODEL: reportModel.js - user-submitted reports (complaints, abuse, bugs)
// ============================================================================
//  Anyone signed in can file a report. The submitted document records:
//    - who reported (userId + userType)
//    - what category (from a predefined list on the report form)
//    - free-text description
//    - optional relatedId/address pointing at a specific booking or spot
//    - optional hostId if the report is about a host (lets the host see
//      complaints against their listings on their dashboard)
//
//  The security rules lock read access down so only the reporter or the
//  hostId target can see each report.
// ============================================================================

import { getReportsRef } from './firebase';
import { addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';

// ─── File a new report ──────────────────────────────────────────────────────
// Trimmed description so trailing whitespace doesn't make the text look
// weird when it's displayed back later.
export async function submitReport({ userId, userType, category, description, relatedId = null, relatedAddress = null, hostId = null }) {
  await addDoc(getReportsRef(), {
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

// ─── Host-side live subscription ────────────────────────────────────────────
// Streams any reports filed against this specific host's listings so
// they see them on their dashboard.
export const subscribeToReportsForHost = (hostId, onData, onError) => {
  const q = query(getReportsRef(), where('hostId', '==', hostId));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, onError);
};
