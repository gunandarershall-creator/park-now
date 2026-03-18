/**
 * MODEL: userModel.js
 * Pure async functions for User Firestore operations.
 * No React state — just data access.
 */

import { setDoc, onSnapshot } from "firebase/firestore";
import { getUserDocRef } from "./firebase";

export const saveUser = async (uid, data, merge = false) => {
  const ref = getUserDocRef(uid);
  await setDoc(ref, data, merge ? { merge: true } : undefined);
};

export const subscribeToUser = (uid, onData, onError) => {
  const ref = getUserDocRef(uid);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) onData(snap.data());
  }, onError);
};
