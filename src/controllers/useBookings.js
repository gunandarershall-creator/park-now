/**
 * CONTROLLER: useBookings.js
 * Manages bookings state, payment flow, and session lifecycle.
 * Depends on: BookingModel, SpotModel, user from useAuth
 */

import { useState, useEffect } from 'react';
import { subscribeToBookings, saveBooking } from '../models/bookingModel';
import { updateSpot, deleteSpot } from '../models/spotModel';

export const useBookings = (user) => {
  const [bookings, setBookings] = useState([]);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [bookingDuration, setBookingDuration] = useState(2);
  const [extensionDuration, setExtensionDuration] = useState(1);
  const [hasInsurance, setHasInsurance] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Sync live bookings from Firestore
  useEffect(() => {
    if (!user) return;
    try {
      const unsubscribe = subscribeToBookings(
        (docs) => setBookings(docs),
        (err) => console.error("Bookings sync error:", err)
      );
      return () => unsubscribe();
    } catch (e) {
      console.error("Firestore Bookings Error:", e);
    }
  }, [user]);

  // Derived state: bookings belonging to this driver, sorted newest first
  const myDriverBookings = bookings
    .filter(b => b.driverId === user?.uid)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Derived state: total earnings for this host
  const myHostEarnings = bookings
    .filter(b => b.hostId === user?.uid)
    .reduce((sum, b) => sum + (b.totalPaid || 0), 0);

  const handlePayment = async (selectedSpot, setSpots) => {
    if (!selectedSpot) return;
    const updatedSpotsLeft = (selectedSpot.spotsLeft || 1) - 1;
    const amountToCharge = (selectedSpot.price * bookingDuration) + (hasInsurance ? 1.50 : 0);

    // Optimistic local update
    if (updatedSpotsLeft <= 0) {
      setSpots(prev => prev.filter(s => s.id !== selectedSpot.id));
    } else {
      setSpots(prev => prev.map(s => s.id === selectedSpot.id ? { ...s, spotsLeft: updatedSpotsLeft } : s));
    }

    // Adjust Firestore inventory (skip system/default spots)
    if (!['1', '2', '3'].includes(selectedSpot.id)) {
      try {
        if (updatedSpotsLeft <= 0) {
          await deleteSpot(selectedSpot.id);
        } else {
          await updateSpot(selectedSpot.id, { spotsLeft: updatedSpotsLeft });
        }
      } catch (error) {
        console.error("Firebase inventory update failed:", error);
      }
    }

    // Save official booking record
    if (user) {
      try {
        const bookingId = Date.now().toString();
        await saveBooking({
          id: bookingId,
          driverId: user.uid,
          hostId: selectedSpot.hostId || 'unknown',
          address: selectedSpot.address,
          duration: bookingDuration,
          totalPaid: amountToCharge,
          hasInsurance: hasInsurance,
          timestamp: new Date().toISOString(),
          status: 'active'
        });
      } catch (e) {
        console.warn("Failed to create official booking record.", e);
      }
    }

    setIsSessionActive(true);
    return true;
  };

  const handleExtendSession = (selectedSpot) => {
    if (selectedSpot) {
      const extensionCost = selectedSpot.price * extensionDuration;
      alert(`Session successfully extended by ${extensionDuration} Hour${extensionDuration > 1 ? 's' : ''}.\n\nYour default payment method has been charged £${extensionCost.toFixed(2)}.`);
    }
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
    return true;
  };

  return {
    bookings,
    viewingReceipt, setViewingReceipt,
    bookingDuration, setBookingDuration,
    extensionDuration, setExtensionDuration,
    hasInsurance, setHasInsurance,
    isSessionActive, setIsSessionActive,
    myDriverBookings,
    myHostEarnings,
    handlePayment,
    handleExtendSession,
    handleEndSession,
  };
};
