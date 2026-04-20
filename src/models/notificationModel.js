// ============================================================================
//  MODEL: notificationModel.js - push notifications plumbing
// ============================================================================
//  Park Now can push notifications to the user in two ways:
//
//    1. Foreground notifications (in the OS notification tray) while
//       the tab is open. These are handled by the browser's built-in
//       Notification API, fired by sendLocalNotification() below.
//
//    2. Background notifications through Firebase Cloud Messaging (FCM),
//       which work even when the tab is closed. For those to work I
//       have to ask for permission and then register an FCM token
//       against the user's profile, which is what requestNotificationPermission
//       does. The actual handler lives in public/firebase-messaging-sw.js.
//
//  The three notify* helpers at the bottom are tiny convenience wrappers
//  that format specific messages I use a lot ("Session expiring" etc).
// ============================================================================

import { getToken } from 'firebase/messaging';
import { setDoc } from 'firebase/firestore';
import { messaging } from './firebase';
import { getUserDocRef } from './firebase';

// ─── Ask the browser for permission to send push ────────────────────────────
// Only runs when the user has taken some clear action (e.g. logging in).
// Browsers reject permission prompts that pop up on page load.
export const requestNotificationPermission = async (user) => {
  if (!messaging || !user?.uid) return;
  try {
    // Shows the native browser prompt. User says yes/no.
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // Grab a FCM push token for this device. The vapidKey is a public
    // identifier for my Firebase project's web-push setup.
    const token = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
    });

    // Save the token on the user's profile document so I (or a server
    // function) can look it up later when I want to push to this user.
    // merge: true means I don't overwrite the other fields.
    if (token) {
      await setDoc(getUserDocRef(user.uid), { fcmToken: token }, { merge: true });
    }
  } catch (e) {
    console.warn('FCM token error:', e);
  }
};

// ─── Show a notification right now (foreground) ─────────────────────────────
// Plain browser Notification API. Only fires if permission was granted.
export const sendLocalNotification = (title, body) => {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/logo192.png' });
  }
};

// ─── Canned messages used from the controllers ──────────────────────────────
export const notifyBookingConfirmed = (address) =>
  sendLocalNotification('Booking Confirmed', `Your spot at ${address} is booked.`);

export const notifyExpiryWarning = (address, minutesLeft) =>
  sendLocalNotification('Session Expiring Soon', `${minutesLeft} min left at ${address}.`);

export const notifyNewBooking = (address) =>
  sendLocalNotification('New Booking', `Someone booked your spot at ${address}.`);
