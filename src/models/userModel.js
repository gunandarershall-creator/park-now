// ============================================================================
//  MODEL: userModel.js - reading and writing user profile documents
// ============================================================================
//  Every signed-in user gets a document at /users/{uid} containing their
//  display name, email, licence plate, profile photo URL, host/driver
//  mode, notification preferences, and FCM token.
//
//  Just two functions: save (with optional merge) and a live subscription.
// ============================================================================

import { setDoc, onSnapshot } from "firebase/firestore";
import { getUserDocRef } from "./firebase";

// ─── Save / update a user profile ───────────────────────────────────────────
// If merge is true, only the fields passed in are written and everything
// else is left alone. If merge is false (default), the whole document
// is replaced. Merge is what I want in almost every case.
export const saveUser = async (uid, data, merge = false) => {
  const ref = getUserDocRef(uid);
  await setDoc(ref, data, merge ? { merge: true } : undefined);
};

// ─── Live subscription to a user profile ────────────────────────────────────
// onData is only fired if the document actually exists (new sign-ups
// briefly don't have one until the saveUser call lands).
export const subscribeToUser = (uid, onData, onError) => {
  const ref = getUserDocRef(uid);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) onData(snap.data());
  }, onError);
};
