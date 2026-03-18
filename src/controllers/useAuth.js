/**
 * CONTROLLER: useAuth.js
 * Manages authentication state and all auth-related actions.
 * Depends on: UserModel, Firebase Auth
 */

import { useState, useEffect } from 'react';
import {
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, updateProfile, signInWithPopup, sendPasswordResetEmail
} from "firebase/auth";
import { auth, googleProvider } from '../models/firebase';
import { saveUser } from '../models/userModel';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert('Please enter an email and password');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        alert("Incorrect email or password. Please try again.");
      } else {
        alert("Login failed: " + error.message);
      }
      return false;
    }
  };

  const handleRegister = async (e, regName, regPlate) => {
    e.preventDefault();
    if (!email || !password || !regName || !regPlate) return alert('Please fill out all fields to register.');
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
      alert(`Account created successfully for ${regName}!`);
      return true;
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        alert('This email is already registered. Please try logging in instead.');
      } else if (error.code === 'auth/weak-password') {
        alert('Your password is too weak. Please use at least 6 characters.');
      } else {
        alert("Registration failed: " + error.message);
      }
      return false;
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      try {
        await saveUser(result.user.uid, {
          name: result.user.displayName || 'Google User',
          email: result.user.email,
          role: 'driver',
          plate: 'PENDING',
          createdAt: new Date().toISOString()
        }, true);
      } catch (err) {
        console.warn("Could not merge Google Auth details into Firestore.", err);
      }
      return true;
    } catch (error) {
      alert("Google Sign-In failed: " + error.message);
      return false;
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) return alert('Please enter your email address to receive a reset link.');
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`A password reset link has been sent to ${email}`);
      return true;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        alert("No account found with this email address.");
      } else {
        alert("Failed to send reset link: " + error.message);
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
    email, setEmail,
    password, setPassword,
    handleLogin,
    handleRegister,
    handleGoogleSignIn,
    handleResetPassword,
    handleLogout,
  };
};
