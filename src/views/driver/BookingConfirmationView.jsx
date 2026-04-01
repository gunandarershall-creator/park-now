/**
 * VIEW: BookingConfirmationView.jsx
 * Shown immediately after a successful payment.
 * Displays a full receipt breakdown before entering the active session.
 */

import React from 'react';
import { CheckCircle, MapPin, Clock, ShieldCheck, CreditCard, XCircle } from 'lucide-react';

const fmt = (isoString) => {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
}) => {
  const parkingCost  = selectedSpot ? +(selectedSpot.price * bookingDuration).toFixed(2) : 0;
  const insuranceCost = hasInsurance ? 1.50 : 0;
  const total        = activeBooking?.totalPaid ?? (parkingCost + insuranceCost);
  const bookingRef   = activeBooking?.id ? activeBooking.id.slice(-8).toUpperCase() : 'PN-000000';

  return (
    <div className="screen" style={{ overflowY: 'auto', paddingBottom: 30 }}>

      {/* Success header */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '36px 20px 24px', textAlign: 'center',
      }}>
        <div style={{
          background: '#E8F8EE', borderRadius: '50%',
          width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <CheckCircle size={40} color="#34C759" strokeWidth={2} />
        </div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Booking Confirmed!</h2>
        <p style={{ margin: '6px 0 0', color: '#8E8E93', fontSize: 14 }}>
          Ref: #{bookingRef}
        </p>
      </div>

      {/* Spot details */}
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

      {/* Cost breakdown */}
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
          <span>Charged to Visa ending in 4242</span>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '0 16px' }}>
        <button className="primary-btn" onClick={onStartSession}>
          Start Parking Session
        </button>
        <button
          onClick={onCancel}
          style={{
            width: '100%', background: 'none', border: 'none',
            color: '#FF3B30', fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, marginTop: 14, cursor: 'pointer', padding: '4px 0',
          }}
        >
          <XCircle size={16} /> Cancel Booking & Request Refund
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmationView;
