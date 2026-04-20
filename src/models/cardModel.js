// ============================================================================
//  MODEL: cardModel.js - Firestore CRUD for saved payment cards
// ============================================================================
//  IMPORTANT: I only ever store the last 4 digits, a label (like "Visa"),
//  and the expiry month/year. The full card number and the CVV NEVER
//  touch my database. Real payment processing would go through Stripe or
//  similar, which returns a token, and the token is what you'd actually
//  save. This prototype stores a display placeholder only.
//
//  Each card document has a userId field so the Firestore security rules
//  can enforce "only the owner can read/write their own cards".
// ============================================================================

import {
  addDoc, deleteDoc, updateDoc,
  doc, onSnapshot, query, where,
} from 'firebase/firestore';
import { getCardsRef } from './firebase';

// ─── Save a new card ────────────────────────────────────────────────────────
// addDoc (as opposed to setDoc) lets Firestore auto-generate a unique
// document id for us. We spread the card data and tack on the userId so
// we know who it belongs to.
export const saveCard = async (userId, cardData) => {
  return addDoc(getCardsRef(), { ...cardData, userId });
};

// ─── Remove a card ──────────────────────────────────────────────────────────
export const deleteCard = async (cardId) => {
  await deleteDoc(doc(getCardsRef(), cardId));
};

// ─── Update a card ──────────────────────────────────────────────────────────
// Currently only used for toggling the "is default" flag.
export const updateCard = async (cardId, data) => {
  await updateDoc(doc(getCardsRef(), cardId), data);
};

// ─── Live subscription to a user's cards ────────────────────────────────────
// Queries only the cards whose userId matches the signed-in user, then
// sorts them by creation time (oldest first so the default card history
// stays stable as new ones are added).
export const subscribeToCards = (userId, onData, onError) => {
  const q = query(getCardsRef(), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      onData(docs);
    },
    onError,
  );
};
