/**
 * CONTROLLER: useAuth.js
 * Manages authentication state and all auth-related actions.
 * Depends on: UserModel, Firebase Auth
 */

import { useState, useEffect } from 'react';
import {
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, updateProfile, signInWithPopup, signInWithRedirect, getRedirectResult, sendPasswordResetEmail
} from "firebase/auth";
import { auth, googleProvider } from '../models/firebase';
import { saveUser } from '../models/userModel';

export const useAuth = (showToast) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!auth) { setAuthLoading(false); return; }

    // Handle redirect result when user returns from Google sign-in
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

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { showToast('Please enter an email and password', 'error'); return false; }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        showToast('Incorrect email or password. Please try again.', 'error');
      } else {
        showToast('Login failed: ' + error.message, 'error');
      }
      return false;
    }
  };

  const handleRegister = async (e, regName, regPlate) => {
    e.preventDefault();
    if (!email || !password || !regName || !regPlate) { showToast('Please fill out all fields to register.', 'error'); return false; }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      try {
        await updateProfile(userCredential.user, { displayName: regName });
      } catch (err) {
        console.warn("Could not attach display name to auth profile.", err);
      }
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

  const handleGoogleSignIn = async () => {
    // Use redirect only in PWA standalone mode (popups are blocked there).
    const isPWA = window.matchMedia('(display-mode: standalone)').matches
               || window.navigator.standalone === true;
    try {
      if (isPWA) {
        await signInWithRedirect(auth, googleProvider);
        return true;
      }

      // Popup flow — resolves immediately when user finishes signing in
      const result = await signInWithPopup(auth, googleProvider);

      // Save / merge user profile into Firestore
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
        // Browser blocked popup — fall back to redirect
        try { await signInWithRedirect(auth, googleProvider); return true; } catch (e2) { /* ignore */ }
      }
      if (error.code === 'auth/unauthorized-domain') {
        showToast('This domain is not authorised. Add it to Firebase → Authentication → Authorized Domains.', 'error');
      } else if (error.code === 'auth/operation-not-allowed') {
        showToast('Google Sign-In is not enabled. Turn it on in Firebase → Authentication → Sign-in method.', 'error');
      } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        // User closed the popup — not an error
      } else {
        showToast('Google Sign-In failed: ' + error.message, 'error');
      }
      return false;
    }
  };

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

  const handleLogout = async () => {
    try {
      if (auth) await signOut(auth);
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
