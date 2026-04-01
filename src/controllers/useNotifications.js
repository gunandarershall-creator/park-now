import { useEffect } from 'react';
import {
  requestNotificationPermission,
  notifyBookingConfirmed,
  notifyExpiryWarning,
  notifyNewBooking,
} from '../models/notificationModel';

export const useNotifications = (user) => {
  useEffect(() => {
    if (user) requestNotificationPermission(user);
  }, [user]);

  return { notifyBookingConfirmed, notifyExpiryWarning, notifyNewBooking };
};
