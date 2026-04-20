// ============================================================================
//  CONTROLLER: useAuth.js - everything about signing in and signing out
// ============================================================================
//  This hook owns the "is anyone signed in right now?" question for the
//  whole app. It also exposes the action functions for login, register,
//  Google sign-in, password reset, and logout.
//
//  Firebase Auth keeps track of the session for us. When the page loads,
//  it checks (from a local cached token) whether there's a valid session,
//  and fires the onAuthStateChanged listener with either a user object
//  or null. While that check is happening, authLoading = true so the
//  app can show a splash screen.
// ============================================================================

import { useState, useEffect } from 'react';
import {
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, updateProfile, signInWithPopup, signInWithRedirect, getRedirectResult, sendPasswordResetEmail
} from "firebase/auth";
import { auth, googleProvider } from '../models/firebase';
import { saveUser } from '../models/userModel';

export const useAuth = (showToast) => {
  // user will be the Firebase user object, or null if not signed in.
  const [user, setUser] = useState(null);
  // Start in "loading" state until Firebase tells us what's what.
  const [authLoading, setAuthLoading] = useState(true);
  // Form field state for the login/register/forgot-password forms.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ─── Set up listeners when the hook first mounts ──────────────────────
  useEffect(() => {
    if (!auth) { setAuthLoading(false); return; }

    // Google sign-in via redirect: when the user comes back from Google's
    // page, the result lands here. We grab it and save their profile to
    // Firestore with merge so we don't clobber anything that already
    // exists (e.g. a plate number they set previously).
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        try {
          await saveUser(result.user.uid, {
            name: result.user.displayName || 'Google User',
            email: result.user.email,
            role: 'driver',
            plate: '',
            createdAt: new Date().toISOString()
          }, true);
        } catch (err) {
          console.warn("Could not merge Google Auth details into Firestore.", err);
        }
      }
    }).catch((err) => {
      console.warn("Redirect result error:", err);
    });

    // The main sign-in listener. Fires once on load, then again every
    // time the user signs in or signs out, passing either the user or
    // null. Returns an unsubscribe function which we use for cleanup.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);


  // ─── Login with email + password ──────────────────────────────────────
  // Returns true on success, false on failure. App.js uses that boolean
  // to decide whether to navigate to the map screen.
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { showToast('Please enter an email and password', 'error'); return false; }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      // Map Firebase error codes to user-friendly messages. Using one
      // generic "incorrect email or password" for the three common bad-
      // credentials codes stops us telling attackers whether the email
      // exists in the system.
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        showToast('Incorrect email or password. Please try again.', 'error');
      } else {
        showToast('Login failed: ' + error.message, 'error');
      }
      return false;
    }
  };


  // ─── Register a new account ──────────────────────────────────────────
  const handleRegister = async (e, regName, regPlate) => {
    e.preventDefault();
    if (!email || !password || !regName || !regPlate) { showToast('Please fill out all fields to register.', 'error'); return false; }
    try {
      // Firebase creates the auth account and returns a user credential.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Attach the name to the Firebase auth profile (shows up in some
      // Google-side UI, and it's nice to have).
      try {
        await updateProfile(userCredential.user, { displayName: regName });
      } catch (err) {
        console.warn("Could not attach display name to auth profile.", err);
      }

      // Create a Firestore /users document with the extra details we
      // need for the app (plate number, role etc).
      try {
        await saveUser(userCredential.user.uid, {
          name: regName,
          email: email,
          plate: regPlate.toUpperCase(),
          role: 'driver',
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Could not save user details to Firestore.", err);
      }
      showToast(`Account created successfully for ${regName}!`, 'success');
      return true;
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        showToast('This email is already registered. Please try logging in instead.', 'error');
      } else if (error.code === 'auth/weak-password') {
        showToast('Your password is too weak. Please use at least 6 characters.', 'error');
      } else {
        showToast('Registration failed: ' + error.message, 'error');
      }
      return false;
    }
  };


  // ─── Google sign-in ──────────────────────────────────────────────────
  // Two flows: popup (desktop) and redirect (PWA standalone mode, where
  // popups are blocked by the OS). We detect standalone mode and pick
  // the right flow automatically.
  const handleGoogleSignIn = async () => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches
               || window.navigator.standalone === true;
    try {
      if (isPWA) {
        // Redirect flow. The page reloads, user picks an account on
        // Google's domain, then comes back. getRedirectResult in the
        // useEffect above handles the return.
        await signInWithRedirect(auth, googleProvider);
        return true;
      }

      // Popup flow. Resolves as soon as the user finishes signing in.
      const result = await signInWithPopup(auth, googleProvider);

      // Save / merge their profile.
      if (result?.user) {
        try {
          await saveUser(result.user.uid, {
            name: result.user.displayName || 'Google User',
            email: result.user.email,
            role: 'driver',
            plate: '',
            createdAt: new Date().toISOString(),
          }, true);
        } catch (err) {
          console.warn('Could not save Google user to Firestore:', err);
        }
      }
      return true;

    } catch (error) {
      if (error.code === 'auth/popup-blocked') {
        // Browser blocked the popup. Fall back to redirect.
        try { await signInWithRedirect(auth, googleProvider); return true; } catch (e2) { /* ignore */ }
      }
      if (error.code === 'auth/unauthorized-domain') {
        showToast('This domain is not authorised. Add it to Firebase > Authentication > Authorized Domains.', 'error');
      } else if (error.code === 'auth/operation-not-allowed') {
        showToast('Google Sign-In is not enabled. Turn it on in Firebase > Authentication > Sign-in method.', 'error');
      } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        // User just closed the popup - that's not really an error, so
        // don't toast anything.
      } else {
        showToast('Google Sign-In failed: ' + error.message, 'error');
      }
      return false;
    }
  };


  // ─── Password reset ──────────────────────────────────────────────────
  // Firebase emails the user a reset link. We don't handle the actual
  // reset UI - that's a Firebase-hosted page.
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) { showToast('Please enter your email address to receive a reset link.', 'error'); return false; }
    try {
      await sendPasswordResetEmail(auth, email);
      showToast(`Password reset link sent to ${email}`, 'success');
      return true;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        showToast('No account found with this email address.', 'error');
      } else {
        showToast('Failed to send reset link: ' + error.message, 'error');
      }
      return false;
    }
  };


  // ─── Logout ───────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      if (auth) await signOut(auth);
      // Clear the form fields so the next user starts fresh.
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };


  return {
    user,
    authLoading,
    email, setEmail,
    password, setPassword,
    handleLogin,
    handleRegister,
    handleGoogleSignIn,
    handleResetPassword,
    handleLogout,
  };
};
