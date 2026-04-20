// ============================================================================
//  VIEW: BookingConfirmationView.jsx - "Booking confirmed!" screen
// ============================================================================
//  Shown right after a successful FUTURE booking (one starting later than
//  right now). For bookings that start immediately, we skip this screen
//  entirely and jump straight into the Active Session.
//
//  Two modes:
//    1. Future booking - shows a countdown to the start time and the
//       primary "Start Parking Session" button is disabled until we get
//       there. At the exact moment the start time hits, the countdown
//       trips onStartSession() automatically.
//
//    2. Ready to start - countdown card is gone, button is active.
//
//  There's a "Done - I'll come back later" escape hatch for future
//  bookings so the user doesn't feel stuck on this screen.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { CheckCircle, MapPin, Clock, ShieldCheck, CreditCard, XCircle, Timer, ArrowLeft } from 'lucide-react';

// Format helpers - "14:30" and "Sat, 20 Apr" respectively.
const fmt = (isoString) => {
  if (!isoString) return '--:--';
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const fmtDate = (isoString) => {
  if (!isoString) return 'Today';
  return new Date(isoString).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
};

const BookingConfirmationView = ({
  selectedSpot,
  activeBooking,
  hasInsurance,
  bookingDuration,
  onStartSession,
  onCancel,
  onBack,
}) => {
  // Cost breakdown for the summary card. Prefer the actual totalPaid we
  // stored on the booking, fall back to recalculating from spot price.
  const parkingCost   = selectedSpot ? +(selectedSpot.price * bookingDuration).toFixed(2) : 0;
  const insuranceCost = hasInsurance ? 1.50 : 0;
  const total         = activeBooking?.totalPaid ?? (parkingCost + insuranceCost);
  // Short reference code for the header.
  const bookingRef    = activeBooking?.id ? activeBooking.id.slice(-8).toUpperCase() : 'PN-000000';

  // canStart = has the start time arrived? Default to true if no start
  // time is set (treat as "starts now").
  const [canStart, setCanStart] = useState(() => {
    if (!activeBooking?.startTime) return true;
    return Date.now() >= new Date(activeBooking.startTime).getTime();
  });
  const [countdown, setCountdown] = useState('');

  // Countdown ticker - runs every second while the start time is still
  // in the future. When the moment hits, we flip canStart and fire off
  // onStartSession so the app advances automatically.
  useEffect(() => {
    if (canStart || !activeBooking?.startTime) return;
    const startMs = new Date(activeBooking.startTime).getTime();

    const tick = () => {
      const diff = startMs - Date.now();
      if (diff <= 0) {
        // Time's up - advance to the active session screen.
        setCanStart(true);
        onStartSession();
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id); // clean up the timer on unmount
  }, [canStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const isFutureBooking = !canStart;

  return (
    <div className="screen" style={{ overflowY: 'auto', paddingBottom: 30 }}>

      {/* Back arrow only shown for future bookings - lets user browse other tabs */}
      {isFutureBooking && onBack && (
        <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', gap: 6, color: '#8E8E93', fontSize: 14, fontWeight: 500 }}
          >
            <ArrowLeft size={18} color="#8E8E93" /> Back to Home
          </button>
        </div>
      )}

      {/* Big green "Booking Confirmed!" success banner */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: `${isFutureBooking ? '20px' : '36px'} 20px 24px`, textAlign: 'center',
      }}>
        <div style={{
          background: '#E8F8EE', borderRadius: '50%',
          width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <CheckCircle size={40} color="#34C759" strokeWidth={2} />
        </div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Booking Confirmed!</h2>
        <p style={{ margin: '6px 0 0', color: '#8E8E93', fontSize: 14 }}>Ref: #{bookingRef}</p>
      </div>

      {/* White card - spot details (address + time window) */}
      <div style={{
        background: 'white', borderRadius: 16, margin: '0 16px 16px',
        padding: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div style={{
            background: '#E6F0FF', borderRadius: 10,
            width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <MapPin size={20} color="#0056D2" />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{selectedSpot?.address}</p>
            <p style={{ margin: '2px 0 0', color: '#8E8E93', fontSize: 13 }}>{selectedSpot?.distance}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: '#F2F2F7', borderRadius: 10,
            width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Clock size={20} color="#8E8E93" />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>
              {fmt(activeBooking?.startTime)} – {fmt(activeBooking?.endTime)}
            </p>
            <p style={{ margin: '2px 0 0', color: '#8E8E93', fontSize: 13 }}>
              {fmtDate(activeBooking?.startTime)} · {bookingDuration} hour{bookingDuration > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* White card - payment breakdown */}
      <div style={{
        background: 'white', borderRadius: 16, margin: '0 16px 16px',
        padding: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      }}>
        <h4 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Payment Summary</h4>

        <div className="receipt-row">
          <span style={{ color: '#8E8E93' }}>Parking ({bookingDuration}h × £{selectedSpot?.price?.toFixed(2)})</span>
          <span>£{parkingCost.toFixed(2)}</span>
        </div>

        {hasInsurance && (
          <div className="receipt-row">
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#34C759', fontWeight: 600 }}>
              <ShieldCheck size={14} /> Premium Protection
            </span>
            <span style={{ color: '#34C759', fontWeight: 600 }}>£1.50</span>
          </div>
        )}

        <div className="receipt-row total" style={{ marginTop: 10 }}>
          <span>Total Paid</span>
          <span>£{total.toFixed(2)}</span>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginTop: 14, paddingTop: 14, borderTop: '1px solid #F2F2F7',
          color: '#8E8E93', fontSize: 13,
        }}>
          <CreditCard size={16} />
          <span>Payment confirmed</span>
        </div>
      </div>

      {/* Buttons at the bottom */}
      <div style={{ padding: '0 16px' }}>
        {/* Yellow countdown card - only shown while waiting for a future booking */}
        {!canStart && (
          <div style={{
            textAlign: 'center', background: '#FFF9EC', border: '1px solid #FFE58F',
            borderRadius: 14, padding: '16px 20px', marginBottom: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#FF9500', marginBottom: 6 }}>
              <Timer size={16} />
              <span style={{ fontWeight: 700, fontSize: 13 }}>Booking scheduled</span>
            </div>
            <p style={{ margin: 0, color: '#8E8E93', fontSize: 13 }}>Your session begins at</p>
            <p style={{ margin: '4px 0 6px', fontWeight: 800, fontSize: 24, color: '#0056D2' }}>
              {fmt(activeBooking?.startTime)}
            </p>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 20, color: '#FF9500', letterSpacing: 2, fontVariantNumeric: 'tabular-nums' }}>
              {countdown}
            </p>
            <p style={{ margin: '6px 0 0', color: '#8E8E93', fontSize: 12 }}>
              You'll be taken to your session automatically
            </p>
          </div>
        )}

        {/* Start Session - disabled while canStart is false */}
        <button
          className="primary-btn"
          onClick={onStartSession}
          disabled={!canStart}
          style={{ opacity: canStart ? 1 : 0.35 }}
        >
          Start Parking Session
        </button>

        {/* Escape hatch - for future bookings, lets the user go back to the dashboard */}
        {!canStart && onBack && (
          <button
            onClick={onBack}
            style={{
              width: '100%', background: 'none', border: 'none',
              color: '#0056D2', fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, marginTop: 14, cursor: 'pointer', padding: '4px 0',
            }}
          >
            Done — I'll come back later
          </button>
        )}

        {/* Red cancel-and-refund link */}
        <button
          onClick={onCancel}
          style={{
            width: '100%', background: 'none', border: 'none',
            color: '#FF3B30', fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, marginTop: 14, cursor: 'pointer', padding: '4px 0',
          }}
        >
          <XCircle size={16} /> Cancel Booking &amp; Request Refund
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmationView;
