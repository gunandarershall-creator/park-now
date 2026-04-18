/**
 * CONTROLLER: useBookings.js
 * Manages bookings state, payment flow, and session lifecycle.
 * Depends on: BookingModel, SpotModel, user from useAuth
 */

import { useState, useEffect } from 'react';
import { subscribeToBookings, saveBooking, updateBooking } from '../models/bookingModel';
import { bookSpotAtomically } from '../models/concurrencyModel';

export const useBookings = (user, showToast) => {
  const [bookings, setBookings] = useState([]);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [bookingDuration, setBookingDuration] = useState(2);
  const [extensionDuration, setExtensionDuration] = useState(1);
  const [hasInsurance, setHasInsurance] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);

  // Tick every 60 s so myHostEarnings recalculates when a booking's endTime passes
  // even if no Firestore event fires at that exact moment.
  const [, setEarningsTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setEarningsTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

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

  /**
   * Restore session state from Firestore on load / page refresh.
   *
   * Two cases:
   *  1. Active now   — startTime ≤ now AND endTime > now → isSessionActive = true
   *  2. Upcoming     — startTime > now AND endTime > now → isSessionActive = false
   *                    (App.js timer will flip it to true when startTime arrives)
   */
  useEffect(() => {
    if (!user || bookings.length === 0) return;
    // Already have a truly active session in state — don't overwrite
    if (isSessionActive && activeBooking) return;

    const now = new Date();

    // ── Case 1: session already started ──────────────────────────────────────
    const activeNow = bookings.find(b =>
      b.driverId === user.uid &&
      b.status === 'confirmed' &&
      b.startTime && b.endTime &&
      new Date(b.startTime) <= now &&
      new Date(b.endTime) > now
    );

    if (activeNow) {
      setActiveBooking({
        id: activeNow.id,
        startTime: activeNow.startTime,
        endTime:   activeNow.endTime,
        totalPaid: activeNow.totalPaid,
      });
      setIsSessionActive(true);
      return;
    }

    // ── Case 2: session scheduled for the future ──────────────────────────────
    // Only restore if we don't already have this booking tracked
    if (!activeBooking) {
      const upcoming = bookings.find(b =>
        b.driverId === user.uid &&
        b.status === 'confirmed' &&
        b.startTime && b.endTime &&
        new Date(b.startTime) > now &&
        new Date(b.endTime) > now
      );

      if (upcoming) {
        setActiveBooking({
          id: upcoming.id,
          startTime: upcoming.startTime,
          endTime:   upcoming.endTime,
          totalPaid: upcoming.totalPaid,
        });
        // isSessionActive stays false — timer in App.js will trigger when start arrives
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, user]);

  // Derived state: bookings belonging to this driver, sorted newest first
  // Exclude demo/seed spot bookings (hostId: 'demo' or 'system') made during testing
  const myDriverBookings = bookings
    .filter(b => b.driverId === user?.uid && b.hostId !== 'demo' && b.hostId !== 'system')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Derived state: total earnings for this host.
  // A booking counts as earned when EITHER:
  //   • Its endTime has passed (session expired naturally), OR
  //   • The driver submitted a review / status was marked completed
  //     (driver ended early — status update via Firestore triggers this immediately).
  const myHostEarnings = bookings
    .filter(b =>
      b.hostId === user?.uid &&
      b.status !== 'cancelled' &&
      b.endTime && (
        new Date(b.endTime) <= new Date() ||
        b.status === 'reviewed'            ||
        b.status === 'completed'
      )
    )
    .reduce((sum, b) => sum + (b.totalPaid || 0), 0);

  const handlePayment = async (selectedSpot, setSpots, bookingStartTime) => {
    if (!selectedSpot) return;

    // Parse user-selected start time (HH:MM) → actual Date for today
    const parseStartTime = (timeStr) => {
      const d = new Date();
      if (timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        d.setHours(h, m, 0, 0);
      }
      return d;
    };

    // Booking is "immediate" if start time is now or within a 2-minute grace window
    const parsedStart = parseStartTime(bookingStartTime);
    const isImmediate = Date.now() >= parsedStart.getTime() - 120000;

    const isDemoSpot = ['1', '2', '3', '4', '5'].includes(selectedSpot.id);

    if (isDemoSpot) {
      // ── Demo spots: simple optimistic update (not in Firestore) ──────────────
      const updatedSpotsLeft = (selectedSpot.spotsLeft || 1) - 1;
      const amountToCharge = +(selectedSpot.price * bookingDuration + (hasInsurance ? 1.50 : 0)).toFixed(2);
      const bookingId = Date.now().toString();
      const startTime = parsedStart.toISOString();
      const endTime   = new Date(parsedStart.getTime() + bookingDuration * 3600000).toISOString();

      setSpots(prev =>
        updatedSpotsLeft <= 0
          ? prev.filter(s => s.id !== selectedSpot.id)
          : prev.map(s => s.id === selectedSpot.id ? { ...s, spotsLeft: updatedSpotsLeft } : s)
      );

      if (user) {
        saveBooking({
          id: bookingId,
          driverId:    user.uid,
          hostId:      selectedSpot.hostId === 'system' ? 'demo' : (selectedSpot.hostId || 'unknown'),
          spotId:      selectedSpot.id,
          address:     selectedSpot.address,
          duration:    bookingDuration,
          totalPaid:   amountToCharge,
          hasInsurance,
          timestamp:   startTime,
          startTime,
          endTime,
          status:      'confirmed',
        }).catch(err => console.warn('Could not persist booking to Firestore:', err));
      }

      setActiveBooking({ id: bookingId, startTime, endTime, totalPaid: amountToCharge });
    } else {
      // ── Real spots: Hybrid OCC transaction (concurrency-safe) ────────────────
      try {
        const { bookingId, newSpotsLeft, amountToCharge, startTime, endTime } = await bookSpotAtomically({
          spot: selectedSpot,
          user,
          bookingDuration,
          hasInsurance,
          bookingStartTime,
        });

        setSpots(prev =>
          newSpotsLeft <= 0
            ? prev.filter(s => s.id !== selectedSpot.id)
            : prev.map(s => s.id === selectedSpot.id ? { ...s, spotsLeft: newSpotsLeft } : s)
        );

        setActiveBooking({
          id: bookingId,
          startTime: startTime.toISOString(),
          endTime:   endTime.toISOString(),
          totalPaid: amountToCharge,
        });
      } catch (err) {
        const msg =
          err.code === 'SPOT_NOT_FOUND'   ? "This spot no longer exists — it may have been removed by the host." :
          err.code === 'SPOT_UNAVAILABLE' ? "This spot was just taken by another driver. Please choose another." :
          err.code === 'TIME_CONFLICT'    ? "This spot is already booked for that time window. Please adjust your duration." :
                                           "Booking failed. Please try again.";
        showToast(msg, 'error');
        return false;
      }
    }

    // Only mark the session as active if the booking starts right now.
    // Future bookings stay as isSessionActive=false until the start time arrives.
    setIsSessionActive(isImmediate);
    return true;
  };

  const handleExtendSession = async (selectedSpot) => {
    if (!selectedSpot || !activeBooking) return;

    const extensionCost = +(selectedSpot.price * extensionDuration).toFixed(2);
    const currentEnd = new Date(activeBooking.endTime);
    const newEnd = new Date(currentEnd.getTime() + extensionDuration * 3600000);
    const newEndIso = newEnd.toISOString();

    setActiveBooking(prev => ({ ...prev, endTime: newEndIso }));

    const isDemoBooking = ['1', '2', '3', '4', '5'].includes(selectedSpot.id);
    if (!isDemoBooking) {
      try {
        await updateBooking(activeBooking.id, { endTime: newEndIso });
      } catch (e) {
        console.warn("Could not persist extension to Firestore:", e);
      }
    }

    showToast(`Session extended by ${extensionDuration} hour${extensionDuration > 1 ? 's' : ''}. £${extensionCost.toFixed(2)} charged.`, 'success');
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
