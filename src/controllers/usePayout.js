/**
 * CONTROLLER: usePayout.js
 * Manages payout requests and history for the current host user.
 * Depends on: payoutModel, user from useAuth
 */

import { useState, useEffect } from 'react';
import { subscribeToPayouts, requestPayout } from '../models/payoutModel';

export const usePayout = (user, earnings) => {
  const [payouts, setPayouts]       = useState([]);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!user) return;
    try {
      const unsubscribe = subscribeToPayouts(user.uid, (docs) => setPayouts(docs));
      return () => unsubscribe();
    } catch (e) {
      console.error('Payout sync error:', e);
    }
  }, [user]);

  // Available balance = gross earnings minus any amounts already paid out
  const totalPaidOut       = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
  const availableBalance   = Math.max(0, (earnings || 0) - totalPaidOut);

  const handleRequestPayout = async (showToast) => {
    if (!user || availableBalance <= 0) return;
    setIsRequesting(true);
    try {
      await requestPayout(user.uid, availableBalance);
      showToast('Payout requested! Funds will arrive in 3–5 business days.', 'success');
    } catch (e) {
      console.error('Payout request error:', e);
      showToast('Failed to request payout. Please try again.', 'error');
    } finally {
      setIsRequesting(false);
    }
  };

  return { payouts, isRequesting, handleRequestPayout, availableBalance };
};
