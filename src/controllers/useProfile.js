// ============================================================================
//  CONTROLLER: useProfile.js - user profile state and edit actions
// ============================================================================
//  Keeps the driver's name, licence plate, user mode (driver vs host),
//  notification preferences and profile photo in sync with their
//  Firestore /users/{uid} document. Exposes actions for editing each of
//  those things.
//
//  Every edit goes through saveUser(..., { merge: true }) so we never
//  accidentally wipe out fields we weren't trying to touch.
// ============================================================================

import { useState, useEffect } from 'react';
import { subscribeToUser, saveUser } from '../models/userModel';

export const useProfile = (user, showToast) => {
  // Local state mirrors the fields from Firestore.
  const [regName, setRegName] = useState('');
  const [regPlate, setRegPlate] = useState('');
  const [userMode, setUserMode] = useState('driver');
  const [notifBooking, setNotifBooking] = useState(true);
  const [notifPromo, setNotifPromo] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);

  // ─── Live sync from Firestore ──────────────────────────────────────
  // Whenever the profile doc changes server-side, update our local
  // state. Handles multi-device sync (user edits on phone, desktop
  // tab updates automatically).
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUser(
      user.uid,
      (data) => {
        setRegName(data.name || '');
        setRegPlate(data.plate || '');
        if (data.role) setUserMode(data.role);
        if (data.notifBooking !== undefined) setNotifBooking(data.notifBooking);
        if (data.notifPromo !== undefined) setNotifPromo(data.notifPromo);
        if (data.photoUrl !== undefined) setPhotoUrl(data.photoUrl);
      },
      (err) => console.warn("Failed to fetch user profile:", err)
    );
    return () => unsubscribe();
  }, [user]);


  // ─── Save edited personal info (name + email) ──────────────────────
  const handleUpdateProfile = async (e, emailValue) => {
    e.preventDefault();
    if (!user) { showToast('Must be logged in to update profile.', 'error'); return false; }
    try {
      await saveUser(user.uid, { name: regName, email: emailValue }, true);
      showToast('Profile saved successfully!', 'success');
      return true;
    } catch (err) {
      showToast('Failed to save changes: ' + err.message, 'error');
      return false;
    }
  };


  // ─── Save edited vehicle ──────────────────────────────────────────
  // Force plate to uppercase for display consistency (UK plates are
  // always shown in caps).
  const handleUpdateVehicle = async (e) => {
    e.preventDefault();
    if (!user) { showToast('Must be logged in to update vehicle.', 'error'); return false; }
    try {
      await saveUser(user.uid, { plate: regPlate.toUpperCase() }, true);
      showToast('Vehicle saved successfully!', 'success');
      return true;
    } catch (err) {
      showToast('Failed to update vehicle: ' + err.message, 'error');
      return false;
    }
  };


  // ─── Upload and process profile photo ──────────────────────────────
  // Big files slow the app down. So when the user picks a photo I:
  //   1. Load it into an Image element
  //   2. Crop the middle square out of it
  //   3. Resize down to 150x150 (plenty for an avatar)
  //   4. Encode as JPEG at 80% quality, base64
  //   5. Save the base64 string straight into Firestore
  //
  // Saving directly to Firestore avoids needing Firebase Storage and
  // the extra admin that comes with it. Downside: the profile doc gets
  // a bit bigger. 150x150 JPEG at 80% is typically under 15kb which is
  // fine inside a Firestore document's 1MB limit.
  const handleUpdatePhoto = async (file) => {
    if (!file || !user) return;
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 150; canvas.height = 150;
      const ctx = canvas.getContext('2d');
      // Centre-crop to a square.
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 150, 150);
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      // Free the object URL now we've drawn from it.
      URL.revokeObjectURL(objectUrl);
      setPhotoUrl(base64);
      try {
        await saveUser(user.uid, { photoUrl: base64 }, true);
      } catch (err) {
        console.warn('Could not save photo:', err);
      }
    };
    img.src = objectUrl;
  };


  // ─── Toggle a notification preference ──────────────────────────────
  // Update local state immediately (optimistic UI) then fire-and-
  // forget the Firestore write. .catch(() => {}) swallows errors
  // because the UI already reflects the new state.
  const handleToggleNotif = async (key, value) => {
    if (key === 'booking') {
      setNotifBooking(value);
      if (user) await saveUser(user.uid, { notifBooking: value }, true).catch(() => {});
    } else if (key === 'promo') {
      setNotifPromo(value);
      if (user) await saveUser(user.uid, { notifPromo: value }, true).catch(() => {});
    }
  };


  // ─── Flip between driver and host mode ─────────────────────────────
  // Returns the new mode so App.js can navigate to the right home screen.
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
    notifBooking,
    notifPromo,
    photoUrl,
    handleToggleNotif,
    handleUpdateProfile,
    handleUpdateVehicle,
    handleUpdatePhoto,
    handleSwitchMode,
  };
};
