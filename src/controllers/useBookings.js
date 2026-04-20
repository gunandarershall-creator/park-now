// ============================================================================
//  CONTROLLER: useBookings.js - booking state and payment flow
// ============================================================================
//  This is one of the meatier hooks in the app. It handles:
//
//    - Live subscription to all bookings in Firestore
//    - Restoring an active session on page refresh / return-to-app
//    - The payment handler that kicks off the OCC transaction
//    - Session extension
//    - End-session handler
//    - Derived state: host earnings, pending earnings, driver's own
//      past bookings
//
//  Two paths through handlePayment:
//    1. Demo spots (ids '1'-'5')  - simulated in-memory booking so the
//                                    examiner can play with the app
//                                    without touching real Firestore data
//    2. Real spots                - full OCC transaction via
//                                    bookSpotAtomically()
// ============================================================================

import { useState, useEffect } from 'react';
import { subscribeToBookings, saveBooking, updateBooking } from '../models/bookingModel';
import { bookSpotAtomically } from '../models/concurrencyModel';

export const useBookings = (user, showToast) => {
  const [bookings, setBookings] = useState([]);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [bookingDuration, setBookingDuration] = useState(2);       // default 2 hours
  const [extensionDuration, setExtensionDuration] = useState(1);    // default +1 hour
  const [hasInsurance, setHasInsurance] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);


  // ─── One-minute heartbeat ──────────────────────────────────────────────
  // myHostEarnings is a derived value that depends on the CURRENT time
  // (bookings count as earned once their endTime passes). If the user
  // just stares at the dashboard, no Firestore event fires when time
  // passes, so the computed total looks frozen. This interval forces a
  // rerender every 60 seconds to refresh the maths.
  const [, setEarningsTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setEarningsTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);


  // ─── Live sync of all bookings ────────────────────────────────────────
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


  // ─── Session restoration on page load ─────────────────────────────────
  // Two cases:
  //   Case 1: There's a booking that started in the past and hasn't
  //           ended yet. Restore it AND mark the session as active so
  //           the user lands back on the countdown screen.
  //   Case 2: There's a booking that hasn't started yet. Restore it but
  //           keep isSessionActive=false; App.js has a timer that will
  //           flip it when the start time arrives.
  useEffect(() => {
    if (!user || bookings.length === 0) return;
    // Don't clobber an already-active in-memory session.
    if (isSessionActive && activeBooking) return;

    const now = new Date();

    // Case 1: active right now
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

    // Case 2: upcoming. Only set if we don't already have one tracked.
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
        // isSessionActive stays false - App.js will flip it on time.
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, user]);


  // ─── Derived: this driver's own past bookings ─────────────────────────
  // Filter out demo/system bookings so the user's history doesn't show
  // noise from the seeded demo listings.
  const myDriverBookings = bookings
    .filter(b => b.driverId === user?.uid && b.hostId !== 'demo' && b.hostId !== 'system')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // ─── Derived: total "earned" money for the signed-in host ─────────────
  // A booking counts as earned when either its endTime has passed, OR
  // the driver reviewed it / status was marked completed (driver ended
  // early triggers that, and we should credit straight away).
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

  // ─── Derived: money on its way ────────────────────────────────────────
  // Confirmed future bookings whose endTime hasn't passed yet. Shown
  // separately on the dashboard as "pending".
  const myPendingEarnings = bookings
    .filter(b =>
      b.hostId === user?.uid &&
      b.status === 'confirmed' &&
      b.endTime &&
      new Date(b.endTime) > new Date()
    )
    .reduce((sum, b) => sum + (b.totalPaid || 0), 0);


  // ─── Payment handler ─────────────────────────────────────────────────
  // This is where the user's "Pay & Book" tap actually does the work.
  // Demo spots short-circuit the OCC transaction; real spots go through
  // bookSpotAtomically which enforces concurrency safety.
  const handlePayment = async (selectedSpot, setSpots, bookingStartTime) => {
    if (!selectedSpot) return;

    // Parse whatever format the start-time input gave us. Same logic
    // as in concurrencyModel but we need it here too because we apply
    // it before entering the transaction.
    const parseStartTime = (startStr) => {
      let d;
      if (!startStr) return new Date();
      if (startStr.includes('-')) {
        // New ISO format "YYYY-MM-DDTHH:MM"
        d = new Date(startStr);
        if (isNaN(d.getTime())) d = new Date();
      } else {
        // Legacy "HH:MM" - assume today
        d = new Date();
        const [h, m] = startStr.split(':').map(Number);
        d.setHours(h, m, 0, 0);
      }
      // If user picked the current wall-clock minute, snap to full
      // now-with-seconds so the countdown displays the full duration.
      const now = new Date();
      if (d.getFullYear() === now.getFullYear() &&
          d.getMonth()    === now.getMonth()    &&
          d.getDate()     === now.getDate()     &&
          d.getHours()    === now.getHours()    &&
          d.getMinutes()  === now.getMinutes()) {
        return now;
      }
      return d;
    };

    // Is the booking starting now-ish? Grace window of 2 minutes.
    const parsedStart = parseStartTime(bookingStartTime);
    const isImmediate = Date.now() >= parsedStart.getTime() - 120000;

    // Demo seed spots (ids '1' through '5') skip Firestore OCC.
    const isDemoSpot = ['1', '2', '3', '4', '5'].includes(selectedSpot.id);

    if (isDemoSpot) {
      // ── DEMO PATH: optimistic in-memory booking ──────────────────
      const updatedSpotsLeft = (selectedSpot.spotsLeft || 1) - 1;
      const amountToCharge = +(selectedSpot.price * bookingDuration + (hasInsurance ? 1.50 : 0)).toFixed(2);
      const bookingId = Date.now().toString();
      const startTime = parsedStart.toISOString();
      const endTime   = new Date(parsedStart.getTime() + bookingDuration * 3600000).toISOString();

      // Remove from list if last place taken, otherwise decrement.
      setSpots(prev =>
        updatedSpotsLeft <= 0
          ? prev.filter(s => s.id !== selectedSpot.id)
          : prev.map(s => s.id === selectedSpot.id ? { ...s, spotsLeft: updatedSpotsLeft } : s)
      );

      // Still save to Firestore for history, but mark as demo.
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
      // ── REAL PATH: OCC transaction ───────────────────────────────
      try {
        const { bookingId, newSpotsLeft, amountToCharge, startTime, endTime } = await bookSpotAtomically({
          spot: selectedSpot,
          user,
          bookingDuration,
          hasInsurance,
          bookingStartTime,
        });

        // Optimistically update the map. Firestore onSnapshot will
        // confirm the real value a moment later anyway.
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
        // Map OCC error codes to user-friendly messages.
        const msg =
          err.code === 'SPOT_NOT_FOUND'   ? "This spot no longer exists - it may have been removed by the host." :
          err.code === 'SPOT_UNAVAILABLE' ? "This spot was just taken by another driver. Please choose another." :
          err.code === 'TIME_CONFLICT'    ? "This spot is already booked for that time window. Please adjust your duration." :
                                           "Booking failed. Please try again.";
        showToast(msg, 'error');
        return false;
      }
    }

    // Only flag as "actively in session" if booking starts right now.
    // Future bookings wait for their start time.
    setIsSessionActive(isImmediate);
    return true;
  };


  // ─── Extend an active session ────────────────────────────────────────
  // Bumps the activeBooking's endTime by `extensionDuration` hours and
  // charges for the extra time. Optimistic local update first, then
  // Firestore write.
  const handleExtendSession = async (selectedSpot) => {
    if (!selectedSpot || !activeBooking) return;

    const extensionCost = +(selectedSpot.price * extensionDuration).toFixed(2);
    const currentEnd = new Date(activeBooking.endTime);
    const newEnd = new Date(currentEnd.getTime() + extensionDuration * 3600000);
    const newEndIso = newEnd.toISOString();

    // Update local state immediately so the timer flips from red back
    // to normal without waiting on the network round trip.
    setActiveBooking(prev => ({ ...prev, endTime: newEndIso }));

    // Demo bookings don't touch Firestore.
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


  // ─── End the session ─────────────────────────────────────────────────
  // Just flips the local flag. App.js catches the transition and
  // navigates to the review screen, which is where the status update
  // actually happens.
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
    myPendingEarnings,
    handlePayment,
    handleExtendSession,
    handleEndSession,
  };
};
