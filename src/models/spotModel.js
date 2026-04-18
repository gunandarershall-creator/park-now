/**
 * MODEL: spotModel.js
 * Pure async functions for Spot Firestore operations.
 * No React state — just data access.
 */

import { setDoc, updateDoc, deleteDoc, onSnapshot, query, where, doc } from "firebase/firestore";
import { getSpotsRef } from "./firebase";

export const subscribeToSpots = (onData, onError) => {
  return onSnapshot(getSpotsRef(), (snap) => {
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onData(docs);
  }, onError);
};

/**
 * Subscribe only to spots owned by a specific host.
 * Returns ALL spots for that host regardless of isActive — the host dashboard
 * must show temporarily-unavailable listings so they can re-activate them.
 * Single-field WHERE clause — no composite Firestore index required.
 */
export const subscribeToHostSpots = (hostId, onData, onError) => {
  const q = query(getSpotsRef(), where('hostId', '==', hostId));
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onData(docs);
  }, onError);
};

export const saveSpot = async (spotData) => {
  const ref = doc(getSpotsRef(), spotData.id);
  await setDoc(ref, spotData);
};

export const updateSpot = async (id, data) => {
  const ref = doc(getSpotsRef(), id);
  await updateDoc(ref, data);
};

export const deleteSpot = async (id) => {
  const ref = doc(getSpotsRef(), id);
  await deleteDoc(ref);
};
