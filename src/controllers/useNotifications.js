// ============================================================================
//  CONTROLLER: useNotifications.js - push notifications + history
// ============================================================================
//  Two things happen here:
//
//    1. When a user signs in, we ask for browser notification permission
//       (only actually prompts once per user, the browser caches the
//       answer). If granted, we register an FCM token so the Cloud
//       Messaging service can push to this device.
//
//    2. We keep a local in-memory history of every notification the app
//       has fired during this session, so the Notifications screen can
//       show a scrollable feed. Not persisted across refreshes - that
//       would be a nice-to-have but not a requirement.
//
//  The three notify* functions wrap the model-layer push helpers AND
//  push into the history array, so the UI is always in step with the
//  actual notifications that fired.
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import {
  requestNotificationPermission,
  notifyBookingConfirmed as fireNotifyBookingConfirmed,
  notifyExpiryWarning as fireNotifyExpiryWarning,
  notifyNewBooking as fireNotifyNewBooking,
} from '../models/notificationModel';

export const useNotifications = (user) => {
  const [notifHistory, setNotifHistory] = useState([]);

  // When a user signs in, request permission and register the FCM token.
  useEffect(() => {
    if (user) requestNotificationPermission(user);
  }, [user]);

  // Prepend a new entry to the history list. Using Date.now()+random
  // for the id because multiple notifications can fire in the same
  // millisecond and we need unique React keys.
  const addToHistory = useCallback((type, title, body) => {
    setNotifHistory(prev => [
      { id: Date.now() + Math.random(), type, title, body, time: new Date() },
      ...prev,
    ]);
  }, []);

  // ─── The three user-facing notification functions ──────────────────────
  // Each one fires the OS notification AND records it in the history.
  const notifyBookingConfirmed = useCallback((address) => {
    fireNotifyBookingConfirmed(address);
    addToHistory('booking', 'Booking Confirmed', `Your booking at ${address} is confirmed.`);
  }, [addToHistory]);

  const notifyExpiryWarning = useCallback((address, minutesLeft) => {
    fireNotifyExpiryWarning(address, minutesLeft);
    addToHistory('expiry', 'Session Expiring Soon', `${minutesLeft} min left at ${address}.`);
  }, [addToHistory]);

  const notifyNewBooking = useCallback((address) => {
    fireNotifyNewBooking(address);
    addToHistory('host', 'New Booking', address ? `Someone booked your spot at ${address}.` : 'You have a new booking.');
  }, [addToHistory]);

  // Clear the history (exposed on the notifications screen as "Clear all").
  const clearHistory = useCallback(() => setNotifHistory([]), []);

  return { notifyBookingConfirmed, notifyExpiryWarning, notifyNewBooking, notifHistory, clearHistory };
};
