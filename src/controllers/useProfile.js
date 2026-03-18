/**
 * CONTROLLER: useProfile.js
 * Manages user profile state: syncs from Firestore, exposes update actions.
 * Depends on: UserModel, user from useAuth
 */

import { useState, useEffect } from 'react';
import { subscribeToUser, saveUser } from '../models/userModel';

export const useProfile = (user) => {
  const [regName, setRegName] = useState('');
  const [regPlate, setRegPlate] = useState('');
  const [userMode, setUserMode] = useState('driver');

  // Sync user profile from Firestore in real-time
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUser(
      user.uid,
      (data) => {
        setRegName(data.name || '');
        setRegPlate(data.plate || '');
        if (data.role) setUserMode(data.role);
      },
      (err) => console.warn("Failed to fetch user profile:", err)
    );
    return () => unsubscribe();
  }, [user]);

  const handleUpdateProfile = async (e, emailValue) => {
    e.preventDefault();
    if (!user) return alert("Must be logged in to update profile.");
    try {
      await saveUser(user.uid, { name: regName, email: emailValue }, true);
      alert('Information saved successfully to Firebase!');
      return true;
    } catch (err) {
      alert("Failed to save changes: " + err.message);
      return false;
    }
  };

  const handleUpdateVehicle = async (e) => {
    e.preventDefault();
    if (!user) return alert("Must be logged in to update vehicle.");
    try {
      await saveUser(user.uid, { plate: regPlate.toUpperCase() }, true);
      alert('Vehicle successfully saved to Firebase!');
      return true;
    } catch (err) {
      alert("Failed to update vehicle: " + err.message);
      return false;
    }
  };

  const handleSwitchMode = async (newMode) => {
    setUserMode(newMode);
    if (user) {
      try {
        await saveUser(user.uid, { role: newMode }, true);
      } catch (e) {
        console.warn("Could not save mode preference", e);
      }
    }
    return newMode;
  };

  return {
    regName, setRegName,
    regPlate, setRegPlate,
    userMode, setUserMode,
    handleUpdateProfile,
    handleUpdateVehicle,
    handleSwitchMode,
  };
};
