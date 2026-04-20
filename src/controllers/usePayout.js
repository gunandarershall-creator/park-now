// ============================================================================
//  CONTROLLER: usePayout.js - hosts cashing out earnings
// ============================================================================
//  Watches the current host's payout history and computes their available
//  balance (total earnings minus everything already paid out).
//
//  There's also a demo-friendly auto-completion: any payout older than 5
//  days that's still "pending" flips to "completed". In a real product
//  Stripe Connect would handle that via webhook. Here it's simulated so
//  the dashboard doesn't look frozen when the examiner looks at it days
//  after a demo.
// ============================================================================

import { useState, useEffect } from 'react';
import { subscribeToPayouts, requestPayout, completePayout } from '../models/payoutModel';

// 5 days in milliseconds. Used for the auto-completion threshold.
const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

export const usePayout = (user, earnings) => {
  const [payouts, setPayouts]           = useState([]);
  const [isRequesting, setIsRequesting] = useState(false);

  // ─── Live sync of payout history ───────────────────────────────────
  useEffect(() => {
    if (!user) return;
    try {
      const unsubscribe = subscribeToPayouts(
        user.uid,
        (docs) => setPayouts(docs),
        (err) => console.error('Payout listener error:', err),
      );
      return () => unsubscribe();
    } catch (e) {
      console.error('Payout sync error:', e);
    }
  }, [user]);


  // ─── Demo auto-completion ──────────────────────────────────────────
  // For any pending payout more than 5 days old, flip it to completed.
  // Fires every time the payouts list changes, including on first load.
  useEffect(() => {
    if (!user || payouts.length === 0) return;
    payouts.forEach((p) => {
      if (p.status !== 'pending') return;
      // Firestore serverTimestamps arrive as Timestamp objects with a
      // .toDate() method. Handle both that case and the already-
      // serialised string case.
      const requestedTime = p.requestedAt?.toDate
        ? p.requestedAt.toDate()
        : p.requestedAt ? new Date(p.requestedAt) : null;
      if (!requestedTime) return;
      if (Date.now() - requestedTime.getTime() >= FIVE_DAYS_MS) {
        completePayout(p.id).catch((e) =>
          console.warn('Auto-complete payout failed:', e),
        );
      }
    });
  }, [payouts]); // eslint-disable-line react-hooks/exhaustive-deps


  // ─── Derived values ───────────────────────────────────────────────
  // Total paid out across the full history (pending + completed both
  // count - requesting a payout reserves that amount).
  const totalPaidOut     = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
  // Available balance can't go negative, hence Math.max(0, ...).
  const availableBalance = Math.max(0, (earnings || 0) - totalPaidOut);


  // ─── Request a payout ─────────────────────────────────────────────
  // Locks with isRequesting so the button can't be spammed.
  const handleRequestPayout = async (showToast) => {
    if (!user || availableBalance <= 0) return;
    setIsRequesting(true);
    try {
      await requestPayout(user.uid, availableBalance);
      showToast('Payout requested! Funds arrive in 3-5 business days.', 'success');
    } catch (e) {
      console.error('Payout request error:', e);
      showToast('Failed to request payout. Please try again.', 'error');
    } finally {
      setIsRequesting(false);
    }
  };

  return { payouts, isRequesting, handleRequestPayout, availableBalance };
};
