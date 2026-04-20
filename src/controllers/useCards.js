// ============================================================================
//  CONTROLLER: useCards.js - saved payment cards
// ============================================================================
//  Keeps the user's saved cards in sync with Firestore, and exposes
//  actions to add, remove, and change the default card. If the user
//  deletes their default card, the first remaining one is promoted.
// ============================================================================

import { useState, useEffect } from 'react';
import { saveCard, deleteCard, updateCard, subscribeToCards } from '../models/cardModel';

export const useCards = (user, showToast) => {
  const [cards, setCards] = useState([]);

  // Live sync: any time the card list changes (on any device) we
  // update our local state.
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCards(
      user.uid,
      (docs) => setCards(docs),
      (err) => console.error('Cards sync error:', err),
    );
    return () => unsub();
  }, [user]);


  // ─── Add a card ───────────────────────────────────────────────────────
  // The first card added is marked as default automatically.
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


  // ─── Remove a card ────────────────────────────────────────────────────
  // If the deleted card was the default, promote the first remaining
  // one so the user always has a default.
  const removeCard = async (cardId) => {
    const card = cards.find(c => c.id === cardId);
    try {
      await deleteCard(cardId);
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


  // ─── Change default card ──────────────────────────────────────────────
  // Set isDefault=true on the chosen card, isDefault=false on all others.
  // Done in parallel with Promise.all for a snappier UX.
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
