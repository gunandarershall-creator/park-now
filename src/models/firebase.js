// ============================================================================
//  MODEL: firebase.js - the Firebase setup and collection helpers
// ============================================================================
//  This is the single file in the whole project where I actually INIT
//  Firebase. Every other file that needs the database, auth, or messaging
//  imports what they need from here. Doing it this way means there is
//  exactly one "source of truth" for the connection, so I can't
//  accidentally end up with two versions of it running side by side.
//
//  Three core Firebase services get wired up:
//    - Firestore (the NoSQL database, for spots/bookings/users/etc)
//    - Auth      (for signing users in)
//    - Messaging (for push notifications)
//
//  And I export a handful of helper functions like getSpotsRef() that
//  wrap the boilerplate of `collection(db, 'spots')` so the rest of the
//  code doesn't have to think about it.
// ============================================================================

// Firebase core + the specific modules I use. Modular v9 SDK means each
// import is tree-shakable, so only the bits I use end up in the final
// bundle. That keeps the JS payload small.
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getMessaging } from "firebase/messaging";


// ─── CONFIGURATION ─────────────────────────────────────────────────────────
// The config values below identify which Firebase project to connect to.
// They're technically "public" in that every client gets them, but the
// Firestore security rules are what actually protect the data.
//
// The weird ternary is a compatibility layer for the university's marking
// environment (which injects a window.__firebase_config global at runtime).
// In normal operation it falls through to reading environment variables,
// and failing that, the hardcoded defaults for my dev project.
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

// Some deployments assign their own app id. Same pattern as above: prefer
// the injected one if there is one, else fall back to a default.
export const rawAppId = typeof window !== 'undefined' && window.__app_id
  ? window.__app_id
  : 'default-app-id';


// ─── INITIALISATION ────────────────────────────────────────────────────────
// These will hold the three Firebase service handles once initialised.
let app, db, auth, messaging;

// Google sign-in provider (used by the "Continue with Google" button).
export const googleProvider = new GoogleAuthProvider();

// Wrap initialisation in a try/catch so that a misconfigured environment
// doesn't crash the entire app at load time. If something goes wrong I
// log a warning and let the consuming modules handle the undefined handles.
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  messaging = getMessaging(app);
} catch (e) {
  console.warn("Firebase initialization bypassed.");
}

// Expose the three service handles so other modules can import them.
export { db, auth, messaging };


// ─── COLLECTION HELPERS ────────────────────────────────────────────────────
// Tiny wrapper functions so I don't have to repeat `collection(db, 'spots')`
// in twenty different controller files. If I ever want to change a
// collection name, I only have to change it here.

export const getSpotsRef    = () => collection(db, 'spots');
export const getBookingsRef = () => collection(db, 'bookings');
export const getPayoutsRef  = () => collection(db, 'payouts');
export const getCardsRef    = () => collection(db, 'cards');
export const getReportsRef  = () => collection(db, 'reports');

// A single-document reference for a specific user's profile.
export const getUserDocRef  = (uid) => doc(db, 'users', uid);

// Chats use a nested structure: /chats/{chatId}/messages/{messageId}.
// The chatId itself is a composite of driverId + hostId so both
// participants can derive the same id without needing to look it up.
export const getChatMessagesRef = (chatId) =>
  collection(db, 'chats', chatId, 'messages');
