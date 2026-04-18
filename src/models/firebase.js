/**
 * MODEL: firebase.js
 * Firebase initialization and collection reference helpers.
 * This is the single source of truth for all Firebase instances.
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = typeof window !== 'undefined' && window.__firebase_config
  ? JSON.parse(window.__firebase_config)
  : {
      apiKey:            process.env.REACT_APP_FIREBASE_API_KEY            || "AIzaSyA7iaKO86Pbx02BJeA0SulWqpAfB1qs7NU",
      authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN        || "fyp-backend-parknow.firebaseapp.com",
      projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID         || "fyp-backend-parknow",
      storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET     || "fyp-backend-parknow.firebasestorage.app",
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "762323405309",
      appId:             process.env.REACT_APP_FIREBASE_APP_ID             || "1:762323405309:web:cca5363efc85606b807194",
    };

export const rawAppId = typeof window !== 'undefined' && window.__app_id
  ? window.__app_id
  : 'default-app-id';

let app, db, auth, messaging;
export const googleProvider = new GoogleAuthProvider();

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  messaging = getMessaging(app);
} catch (e) {
  console.warn("Firebase initialization bypassed.");
}

export { db, auth, messaging };

// Collection reference helpers — resolves correct path based on environment
export const getSpotsRef = () =>
  typeof window !== 'undefined' && window.__app_id
    ? collection(db, 'artifacts', rawAppId, 'public', 'data', 'spots')
    : collection(db, 'spots');

export const getBookingsRef = () =>
  typeof window !== 'undefined' && window.__app_id
    ? collection(db, 'artifacts', rawAppId, 'public', 'data', 'bookings')
    : collection(db, 'bookings');

export const getUserDocRef = (uid) =>
  typeof window !== 'undefined' && window.__app_id
    ? doc(db, 'artifacts', rawAppId, 'users', uid)
    : doc(db, 'users', uid);
