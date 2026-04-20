// ============================================================================
//  MODEL: spotModel.js - parking spot listings in Firestore
// ============================================================================
//  Spots are the heart of the marketplace. Each document has an address,
//  price, host id, gps coords, availability windows, and the all-
//  important spotsLeft counter that the OCC booking transaction
//  manipulates.
//
//  Two subscription helpers:
//    subscribeToSpots      - every spot in the system (driver map view)
//    subscribeToHostSpots  - only the signed-in host's listings
// ============================================================================

import { setDoc, updateDoc, deleteDoc, onSnapshot, query, where, doc } from "firebase/firestore";
import { getSpotsRef } from "./firebase";

// ─── Live subscription to the whole spots collection ────────────────────────
// Used by the driver map so new listings show up in real time as hosts
// publish them. Also keeps the list in sync when a booking decrements
// the counter somewhere.
export const subscribeToSpots = (onData, onError) => {
  return onSnapshot(getSpotsRef(), (snap) => {
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onData(docs);
  }, onError);
};

// ─── Live subscription to one host's own listings ───────────────────────────
// On the host dashboard I show ALL their spots regardless of isActive,
// because they need to see and re-activate temporarily-closed ones.
// Single-field where() means no composite index is needed in Firestore.
export const subscribeToHostSpots = (hostId, onData, onError) => {
  const q = query(getSpotsRef(), where('hostId', '==', hostId));
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onData(docs);
  }, onError);
};

// ─── CRUD ───────────────────────────────────────────────────────────────────
// Plain wrappers, nothing clever. Using setDoc with an explicit id so
// I control the id format (makes debugging easier).
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
