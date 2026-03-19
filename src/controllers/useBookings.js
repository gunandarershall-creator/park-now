/**
 * CONTROLLER: useBookings.js
 * Manages bookings state, payment flow, and session lifecycle.
 * Depends on: BookingModel, SpotModel, user from useAuth
 */

import { useState, useEffect } from 'react';
import { subscribeToBookings, saveBooking } from '../models/bookingModel';
import { bookSpotAtomically } from '../models/concurrencyModel';

export const useBookings = (user) => {
  const [bookings, setBookings] = useState([]);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [bookingDuration, setBookingDuration] = useState(2);
  const [extensionDuration, setExtensionDuration] = useState(1);
  const [hasInsurance, setHasInsurance] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);

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

    const isDemoSpot = ['1', '2', '3'].includes(selectedSpot.id);

    if (isDemoSpot) {
      // ── Demo spots: simple optimistic update (not in Firestore) ──────────────
      const updatedSpotsLeft = (selectedSpot.spotsLeft || 1) - 1;
      const amountToCharge = +(selectedSpot.price * bookingDuration + (hasInsurance ? 1.50 : 0)).toFixed(2);
      const bookingId = Date.now().toString();
      const startTime = new Date().toISOString();
      const endTime   = new Date(Date.now() + bookingDuration * 3600000).toISOString();

      setSpots(prev =>
        updatedSpotsLeft <= 0
          ? prev.filter(s => s.id !== selectedSpot.id)
          : prev.map(s => s.id === selectedSpot.id ? { ...s, spotsLeft: updatedSpotsLeft } : s)
      );

      if (user) {
        await saveBooking({
          id: bookingId,
          driverId:    user.uid,
          hostId:      selectedSpot.hostId || 'unknown',
          spotId:      selectedSpot.id,
          address:     selectedSpot.address,
          duration:    bookingDuration,
          totalPaid:   amountToCharge,
          hasInsurance,
          timestamp:   startTime,
          startTime,
          endTime,
          status:      'confirmed',
        });
      }

      setActiveBooking({ id: bookingId, endTime, totalPaid: amountToCharge });
    } else {
      // ── Real spots: Hybrid OCC transaction (concurrency-safe) ────────────────
      try {
        const { bookingId, newSpotsLeft, amountToCharge, endTime } = await bookSpotAtomically({
          spot: selectedSpot,
          user,
          bookingDuration,
          hasInsurance,
        });

        // Mirror confirmed server state into local UI
        setSpots(prev =>
          newSpotsLeft <= 0
            ? prev.filter(s => s.id !== selectedSpot.id)
            : prev.map(s => s.id === selectedSpot.id ? { ...s, spotsLeft: newSpotsLeft } : s)
        );

        setActiveBooking({ id: bookingId, endTime: endTime.toISOString(), totalPaid: amountToCharge });
      } catch (err) {
        const msg =
          err.code === 'SPOT_NOT_FOUND'   ? "This spot no longer exists — it may have been removed by the host." :
          err.code === 'SPOT_UNAVAILABLE' ? "This spot was just taken by another driver. Please choose another." :
          err.code === 'TIME_CONFLICT'    ? "This spot is already booked for that time window. Please adjust your duration." :
                                           "Booking failed. Please try again.";
        alert(msg);
        return false;
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
    activeBooking, setActiveBooking,
    myDriverBookings,
    myHostEarnings,
    handlePayment,
    handleExtendSession,
    handleEndSession,
  };
};
