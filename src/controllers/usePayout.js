/**
 * CONTROLLER: usePayout.js
 * Manages payout requests and history for the current host user.
 * Depends on: payoutModel, user from useAuth
 */

import { useState, useEffect } from 'react';
import { subscribeToPayouts, requestPayout, completePayout } from '../models/payoutModel';

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

export const usePayout = (user, earnings) => {
  const [payouts, setPayouts]           = useState([]);
  const [isRequesting, setIsRequesting] = useState(false);

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

  // Auto-complete any pending payouts older than 5 days
  useEffect(() => {
    if (!user || payouts.length === 0) return;
    payouts.forEach((p) => {
      if (p.status !== 'pending') return;
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

  // Available balance = gross earnings minus all amounts already paid out
  const totalPaidOut     = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
  const availableBalance = Math.max(0, (earnings || 0) - totalPaidOut);

  const handleRequestPayout = async (showToast) => {
    if (!user || availableBalance <= 0) return;
    setIsRequesting(true);
    try {
      await requestPayout(user.uid, availableBalance);
      showToast('Payout requested! Funds arrive in 3–5 business days.', 'success');
    } catch (e) {
      console.error('Payout request error:', e);
      showToast('Failed to request payout. Please try again.', 'error');
    } finally {
      setIsRequesting(false);
    }
  };

  return { payouts, isRequesting, handleRequestPayout, availableBalance };
};
