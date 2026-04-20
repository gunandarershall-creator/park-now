// ============================================================================
//  firebase-messaging-sw.js - the service worker for push notifications
// ============================================================================
//  A "service worker" is a little script that the browser keeps running in
//  the background, separate from any tab. Its job here is to catch push
//  notifications that arrive from Firebase Cloud Messaging even when the
//  Park Now tab is closed (or the phone is locked), and display a native
//  notification banner.
//
//  Because this file runs in a service-worker context (no window, no DOM,
//  no bundler), it can't use normal ES imports. Instead it pulls Firebase
//  in through the `importScripts` mechanism, which is the old-school way
//  service workers load code.
//
//  This file lives in /public rather than /src on purpose: Create React App
//  copies /public verbatim to the build output without running it through
//  webpack, which is exactly what a service worker needs.
// ============================================================================

// Load the two Firebase libraries we need. "compat" means the classic v8-
// style API, which is required for service workers because the modular v9
// SDK isn't built to run in this environment.
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase configuration. Same project ID as the main app, obviously.
// These values are safe to ship to the client, they only identify which
// Firebase project the messages are for. The actual security is enforced
// by Firestore rules and FCM server-side.
firebase.initializeApp({
  apiKey: "AIzaSyA7iaKO86Pbx02BJeA0SulWqpAfB1qs7NU",
  authDomain: "fyp-backend-parknow.firebaseapp.com",
  projectId: "fyp-backend-parknow",
  storageBucket: "fyp-backend-parknow.firebasestorage.app",
  messagingSenderId: "762323405309",
  appId: "1:762323405309:web:cca5363efc85606b807194"
});

// Grab a handle to the messaging service so we can register a callback.
const messaging = firebase.messaging();

// This runs whenever a push message arrives while the app is NOT open in
// the foreground. I pull the title, body, and icon out of the payload
// (with sensible fallbacks), then tell the browser to show a notification.
// The user then sees the familiar system notification banner and can tap
// to open the app.
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {};
  self.registration.showNotification(title ?? 'Park Now', {
    body: body ?? '',
    icon: icon ?? '/logo192.png',
  });
});
