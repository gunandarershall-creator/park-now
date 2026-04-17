import { useState, useCallback, useEffect } from 'react';
import {
  requestNotificationPermission,
  notifyBookingConfirmed as fireNotifyBookingConfirmed,
  notifyExpiryWarning as fireNotifyExpiryWarning,
  notifyNewBooking as fireNotifyNewBooking,
} from '../models/notificationModel';

export const useNotifications = (user) => {
  const [notifHistory, setNotifHistory] = useState([]);

  useEffect(() => {
    if (user) requestNotificationPermission(user);
  }, [user]);

  const addToHistory = useCallback((type, title, body) => {
    setNotifHistory(prev => [
      { id: Date.now() + Math.random(), type, title, body, time: new Date() },
      ...prev,
    ]);
  }, []);

  const notifyBookingConfirmed = useCallback((address) => {
    fireNotifyBookingConfirmed(address);
    addToHistory('booking', 'Booking Confirmed', `Your spot at ${address} is booked.`);
  }, [addToHistory]);

  const notifyExpiryWarning = useCallback((address, minutesLeft) => {
    fireNotifyExpiryWarning(address, minutesLeft);
    addToHistory('expiry', 'Session Expiring Soon', `${minutesLeft} min left at ${address}.`);
  }, [addToHistory]);

  const notifyNewBooking = useCallback((address) => {
    fireNotifyNewBooking(address);
    addToHistory('host', 'New Booking', address ? `Someone booked your spot at ${address}.` : 'You have a new booking.');
  }, [addToHistory]);

  const clearHistory = useCallback(() => setNotifHistory([]), []);

  return { notifyBookingConfirmed, notifyExpiryWarning, notifyNewBooking, notifHistory, clearHistory };
};
