/**
 * CONTROLLER: useCards.js
 * Manages saved payment cards — syncs from Firestore, supports add / delete / setDefault.
 */

import { useState, useEffect } from 'react';
import { saveCard, deleteCard, updateCard, subscribeToCards } from '../models/cardModel';

export const useCards = (user, showToast) => {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCards(
      user.uid,
      (docs) => setCards(docs),
      (err) => console.error('Cards sync error:', err),
    );
    return () => unsub();
  }, [user]);

  const addCard = async ({ label, last4, expiry }) => {
    if (!user) return false;
    const isFirstCard = cards.length === 0;
    try {
      await saveCard(user.uid, {
        label,
        last4,
        expiry,
        isDefault: isFirstCard,
        createdAt: Date.now(),
      });
      showToast('Card saved securely.', 'success');
      return true;
    } catch (e) {
      console.error('Save card error:', e);
      showToast('Could not save card. Please try again.', 'error');
      return false;
    }
  };

  const removeCard = async (cardId) => {
    const card = cards.find(c => c.id === cardId);
    try {
      await deleteCard(cardId);
      // Promote first remaining card to default if deleted card was default
      if (card?.isDefault) {
        const rest = cards.filter(c => c.id !== cardId);
        if (rest.length > 0) {
          await updateCard(rest[0].id, { isDefault: true }).catch(() => {});
        }
      }
      showToast('Card removed.', 'success');
    } catch (e) {
      console.error('Delete card error:', e);
      showToast('Could not remove card. Please try again.', 'error');
    }
  };

  const setDefaultCard = async (cardId) => {
    try {
      await Promise.all(
        cards.map(c => updateCard(c.id, { isDefault: c.id === cardId })),
      );
      showToast('Default card updated.', 'success');
    } catch (e) {
      console.warn('Could not update default card:', e);
    }
  };

  return { cards, addCard, removeCard, setDefaultCard };
};
