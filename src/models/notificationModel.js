import { getToken } from 'firebase/messaging';
import { setDoc } from 'firebase/firestore';
import { messaging } from './firebase';
import { getUserDocRef } from './firebase';

export const requestNotificationPermission = async (user) => {
  if (!messaging || !user?.uid) return;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    const token = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
    });
    if (token) {
      await setDoc(getUserDocRef(user.uid), { fcmToken: token }, { merge: true });
    }
  } catch (e) {
    console.warn('FCM token error:', e);
  }
};

export const sendLocalNotification = (title, body) => {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/logo192.png' });
  }
};

export const notifyBookingConfirmed = (address) =>
  sendLocalNotification('Booking Confirmed', `Your spot at ${address} is booked.`);

export const notifyExpiryWarning = (address, minutesLeft) =>
  sendLocalNotification('Session Expiring Soon', `${minutesLeft} min left at ${address}.`);

export const notifyNewBooking = (address) =>
  sendLocalNotification('New Booking', `Someone booked your spot at ${address}.`);
