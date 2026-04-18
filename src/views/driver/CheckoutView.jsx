/**
 * VIEW: CheckoutView.jsx
 * Booking confirmation screen with duration selector, add-ons, and payment.
 */

import React from 'react';
import { ArrowLeft, ShieldCheck, CreditCard, ChevronRight, XCircle } from 'lucide-react';

const Spinner = () => (
  <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
);

const CheckoutView = ({
  selectedSpot,
  bookingDuration, setBookingDuration,
  hasInsurance, setHasInsurance,
  onBack,
  onPayment,
  onChangePaymentMethod,
  isLoading,
}) => {
  const pad = n => String(n).padStart(2, '0');
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Date + time pickers — default to right now
  const [bookingDate, setBookingDate] = React.useState(todayStr);
  const [bookingTime, setBookingTime] = React.useState(() => {
    const now = new Date();
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });

  // Combined ISO datetime string passed to onPayment
  const bookingStart = `${bookingDate}T${bookingTime}`;

  // Human-readable date label
  const dateLabel = bookingDate === todayStr
    ? 'Today'
    : new Date(`${bookingDate}T12:00`).toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short',
      });

  // Compute end time — handles midnight roll-overs
  const computeEndStr = (dateStr, timeStr, durationHrs) => {
    const start = new Date(`${dateStr}T${timeStr}`);
    const end   = new Date(start.getTime() + durationHrs * 3600000);
    const nextDay = end.toISOString().split('T')[0] !== dateStr;
    return `${pad(end.getHours())}:${pad(end.getMinutes())}${nextDay ? ' (+1 day)' : ''}`;
  };
  const endStr = computeEndStr(bookingDate, bookingTime, bookingDuration);

  return (
  <div className="screen" style={{overflowY: 'auto'}}>
    <div className="checkout-header">
      <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
      <h2 className="checkout-title">Confirm Booking</h2>
    </div>

    <div className="receipt-box">
      <h3 style={{marginTop: 0, marginBottom: 15}}>{selectedSpot.address}</h3>
      {/* Date picker */}
      <div className="receipt-row" style={{alignItems: 'center'}}>
        <span style={{color: '#8E8E93'}}>Date</span>
        <input
          type="date"
          value={bookingDate}
          min={todayStr}
          onChange={(e) => setBookingDate(e.target.value)}
          style={{border: 'none', background: '#F2F2F7', padding: '6px 12px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', outline: 'none', cursor: 'pointer', color: '#0056D2'}}
        />
      </div>

      {/* Start time picker */}
      <div className="receipt-row" style={{alignItems: 'center'}}>
        <span style={{color: '#8E8E93'}}>Start Time</span>
        <input
          type="time"
          value={bookingTime}
          onChange={(e) => setBookingTime(e.target.value)}
          style={{border: 'none', background: '#F2F2F7', padding: '6px 12px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', outline: 'none', cursor: 'pointer', color: '#0056D2'}}
        />
      </div>
      <div className="receipt-row">
        <span style={{color: '#8E8E93'}}>End Time</span>
        <span style={{fontWeight: 600}}>{endStr} · {dateLabel}</span>
      </div>

      <div className="receipt-row" style={{alignItems: 'center'}}>
        <span style={{color: '#8E8E93'}}>Duration</span>
        <select
          value={bookingDuration}
          onChange={(e) => setBookingDuration(Number(e.target.value))}
          style={{border: 'none', background: '#F2F2F7', padding: '6px 12px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', outline: 'none', cursor: 'pointer', color: '#0056D2'}}
        >
          <option value={1}>1 Hour</option>
          <option value={2}>2 Hours</option>
          <option value={3}>3 Hours</option>
          <option value={4}>4 Hours</option>
          <option value={5}>5 Hours</option>
          <option value={8}>8 Hours (Full Day)</option>
        </select>
      </div>

      <div className="receipt-row"><span style={{color: '#8E8E93'}}>Rate</span><span>£{selectedSpot.price.toFixed(2)} / hr</span></div>

      {hasInsurance && (
        <div className="receipt-row"><span style={{color: '#34C759', fontWeight: 600}}>Premium Insurance</span><span style={{color: '#34C759', fontWeight: 600}}>£1.50</span></div>
      )}

      <div className="receipt-row total">
        <span>Total Due</span>
        <span>£{((selectedSpot.price * bookingDuration) + (hasInsurance ? 1.50 : 0)).toFixed(2)}</span>
      </div>
    </div>

    <h4 style={{marginBottom: 10, color: '#666'}}>Add-ons</h4>
    <div className="payment-method-row" style={{marginBottom: 20}}>
      <ShieldCheck size={28} color={hasInsurance ? "#34C759" : "#8E8E93"} />
      <div style={{flex: 1}}>
        <div style={{fontWeight: 600}}>Premium Protection</div>
        <div style={{fontSize: 13, color: '#8E8E93'}}>Cover up to £1M for your vehicle.</div>
      </div>
      <div
        className="toggle-switch"
        style={hasInsurance ? {} : {background: '#E5E5EA'}}
        onClick={() => setHasInsurance(!hasInsurance)}
      >
        <div className="toggle-knob" style={hasInsurance ? {} : {right: 'auto', left: 2}}></div>
      </div>
    </div>

    <h4 style={{marginBottom: 10, color: '#666'}}>Payment Method</h4>
    <div className="payment-method-row" style={{cursor: 'pointer'}} onClick={onChangePaymentMethod}>
      <CreditCard size={24} color="#0056D2" />
      <div style={{flex: 1}}><div style={{fontWeight: 600}}>Saved Card</div><div style={{fontSize: 13, color: '#8E8E93'}}>Tap to manage cards</div></div>
      <ChevronRight size={20} color="#C7C7CC" />
    </div>

    <button className="apple-pay-btn" onClick={() => onPayment(bookingStart)} disabled={isLoading} style={{ opacity: isLoading ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {isLoading ? <><Spinner /> Processing…</> : 'Pay & Confirm'}
    </button>

    <button
      onClick={onBack}
      disabled={isLoading}
      style={{ width: '100%', background: 'none', border: 'none', color: '#8E8E93', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 12, cursor: 'pointer', padding: '4px 0' }}
    >
      <XCircle size={14} /> Cancel
    </button>
  </div>
  );
};

export default CheckoutView;
