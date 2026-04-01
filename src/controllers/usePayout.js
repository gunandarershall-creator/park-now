/**
 * CONTROLLER: usePayout.js
 * Manages payout requests and history for the current host user.
 * Depends on: payoutModel, user from useAuth
 */

import { useState, useEffect } from 'react';
import { subscribeToPayouts, requestPayout } from '../models/payoutModel';

export const usePayout = (user, earnings) => {
  const [payouts, setPayouts] = useState([]);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!user) return;
    try {
      const unsubscribe = subscribeToPayouts(user.uid, (docs) => setPayouts(docs));
      return () => unsubscribe();
    } catch (e) {
      console.error("Payout sync error:", e);
    }
  }, [user]);

  const handleRequestPayout = async (showToast) => {
    if (!user || earnings <= 0) return;
    setIsRequesting(true);
    try {
      await requestPayout(user.uid, earnings);
      showToast('Payout requested successfully!');
    } catch (e) {
      console.error("Payout request error:", e);
      showToast('Failed to request payout. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  return { payouts, isRequesting, handleRequestPayout };
};
