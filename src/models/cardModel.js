/**
 * MODEL: cardModel.js
 * Firestore CRUD for saved payment cards.
 * Cards are stored per-user. Only last4 + label + expiry are saved — never CVV.
 */

import {
  addDoc, deleteDoc, updateDoc,
  doc, onSnapshot, query, where,
} from 'firebase/firestore';
import { db, getCardsRef } from './firebase';

export const saveCard = async (userId, cardData) => {
  return addDoc(getCardsRef(), { ...cardData, userId });
};

export const deleteCard = async (cardId) => {
  await deleteDoc(doc(getCardsRef(), cardId));
};

export const updateCard = async (cardId, data) => {
  await updateDoc(doc(getCardsRef(), cardId), data);
};

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
