// ============================================================================
//  VIEW: CheckoutView.jsx - the "Confirm Booking" screen
// ============================================================================
//  Where the driver picks:
//    - What date / time they want to start
//    - How long they need (1h to 8h / Full Day)
//    - Whether they want Premium Protection (+£1.50)
//    - Which saved card to pay with
//
//  Guards:
//    - Date picker won't let you pick yesterday (min=todayStr).
//    - Time picker won't let you pick a past time if you've chosen today.
//    - If somehow a past time gets in there anyway, we show a red warning
//      and disable the "Pay & Confirm" button - belt-and-braces.
//
//  The end time is calculated live as start + duration, and handles the
//  midnight rollover case (adds a "+1 day" suffix if it crosses over).
// ============================================================================

import React from 'react';
import { ArrowLeft, ShieldCheck, CreditCard, ChevronRight, XCircle, AlertCircle } from 'lucide-react';

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
  // Turn a number into a two-digit string: 5 -> "05". Used for building time strings.
  const pad = n => String(n).padStart(2, '0');
  // Today's date in YYYY-MM-DD format for the date picker.
  const todayStr = new Date().toISOString().split('T')[0];

  // Default the pickers to right now so the normal case is one tap.
  const [bookingDate, setBookingDate] = React.useState(todayStr);
  const [bookingTime, setBookingTime] = React.useState(() => {
    const now = new Date();
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });

  // Full ISO-ish string we hand back up when Pay & Confirm is pressed.
  const bookingStart = `${bookingDate}T${bookingTime}`;

  // Only set a `min` on the time picker if the user is booking for today;
  // any future date is fair game for any time.
  const nowForMin = new Date();
  const minTime = bookingDate === todayStr
    ? `${pad(nowForMin.getHours())}:${pad(nowForMin.getMinutes())}`
    : undefined;

  // Extra "is this time actually in the past?" check. Done at minute
  // precision - not seconds - so the very first second of the current
  // minute isn't wrongly blocked. e.g. at 14:33:47, picking 14:33 is OK.
  const isPastTime = (() => {
    const selected = new Date(bookingStart);
    const now      = new Date();
    selected.setSeconds(0, 0);
    now.setSeconds(0, 0);
    return selected.getTime() < now.getTime();
  })();

  // When the user picks a date, if they jumped back to today and their
  // current time is now in the past, bump the time forward to now.
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setBookingDate(newDate);
    if (newDate === todayStr) {
      const fresh = new Date();
      const freshStr = `${pad(fresh.getHours())}:${pad(fresh.getMinutes())}`;
      if (bookingTime < freshStr) setBookingTime(freshStr);
    }
  };

  // Show "Today" instead of a date string if it is today.
  const dateLabel = bookingDate === todayStr
    ? 'Today'
    : new Date(`${bookingDate}T12:00`).toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short',
      });

  // Calculate the end time and detect if it rolled past midnight.
  const computeEndStr = (dateStr, timeStr, durationHrs) => {
    const start = new Date(`${dateStr}T${timeStr}`);
    const end   = new Date(start.getTime() + durationHrs * 3600000);
    const nextDay = end.toISOString().split('T')[0] !== dateStr;
    return `${pad(end.getHours())}:${pad(end.getMinutes())}${nextDay ? ' (+1 day)' : ''}`;
  };
  const endStr = computeEndStr(bookingDate, bookingTime, bookingDuration);

  return (
  <div className="screen" style={{overflowY: 'auto'}}>
    {/* Top bar */}
    <div className="checkout-header">
      <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
      <h2 className="checkout-title">Confirm Booking</h2>
    </div>

    {/* The big receipt-style summary card */}
    <div className="receipt-box">
      <h3 style={{marginTop: 0, marginBottom: 15}}>{selectedSpot.address}</h3>

      {/* Date picker row */}
      <div className="receipt-row" style={{alignItems: 'center'}}>
        <span style={{color: '#8E8E93'}}>Date</span>
        <input
          type="date"
          value={bookingDate}
          min={todayStr}
          onChange={handleDateChange}
          style={{border: 'none', background: '#F2F2F7', padding: '6px 12px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', outline: 'none', cursor: 'pointer', color: '#0056D2'}}
        />
      </div>

      {/* Start time picker row */}
      <div className="receipt-row" style={{alignItems: 'center'}}>
        <span style={{color: '#8E8E93'}}>Start Time</span>
        <input
          type="time"
          value={bookingTime}
          min={minTime}
          onChange={(e) => setBookingTime(e.target.value)}
          style={{border: 'none', background: '#F2F2F7', padding: '6px 12px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', outline: 'none', cursor: 'pointer', color: isPastTime ? '#FF3B30' : '#0056D2'}}
        />
      </div>

      {/* Red warning if the picked time is actually in the past */}
      {isPastTime && (
        <div style={{display: 'flex', alignItems: 'center', gap: 6, color: '#FF3B30', fontSize: 13, fontWeight: 500, marginTop: 4, marginBottom: 2}}>
          <AlertCircle size={14} />
          Start time can't be in the past — please pick a future time.
        </div>
      )}

      {/* Computed end time display */}
      <div className="receipt-row">
        <span style={{color: '#8E8E93'}}>End Time</span>
        <span style={{fontWeight: 600}}>{endStr} · {dateLabel}</span>
      </div>

      {/* Duration picker */}
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

      {/* Insurance line only appears when they've toggled it on */}
      {hasInsurance && (
        <div className="receipt-row"><span style={{color: '#34C759', fontWeight: 600}}>Premium Insurance</span><span style={{color: '#34C759', fontWeight: 600}}>£1.50</span></div>
      )}

      {/* Total due - price × duration + optional insurance */}
      <div className="receipt-row total">
        <span>Total Due</span>
        <span>£{((selectedSpot.price * bookingDuration) + (hasInsurance ? 1.50 : 0)).toFixed(2)}</span>
      </div>
    </div>

    {/* Add-ons section: Premium Protection toggle */}
    <h4 style={{marginBottom: 10, color: '#666'}}>Add-ons</h4>
    <div className="payment-method-row" style={{marginBottom: 20}}>
      <ShieldCheck size={28} color={hasInsurance ? "#34C759" : "#8E8E93"} />
      <div style={{flex: 1}}>
        <div style={{fontWeight: 600}}>Premium Protection</div>
        <div style={{fontSize: 13, color: '#8E8E93'}}>Cover up to £1M for your vehicle.</div>
      </div>
      {/* iOS-style toggle switch */}
      <div
        className="toggle-switch"
        style={hasInsurance ? {} : {background: '#E5E5EA'}}
        onClick={() => setHasInsurance(!hasInsurance)}
      >
        <div className="toggle-knob" style={hasInsurance ? {} : {right: 'auto', left: 2}}></div>
      </div>
    </div>

    {/* Payment method row - tap to jump to the Payment Methods screen */}
    <h4 style={{marginBottom: 10, color: '#666'}}>Payment Method</h4>
    <div className="payment-method-row" style={{cursor: 'pointer'}} onClick={onChangePaymentMethod}>
      <CreditCard size={24} color="#0056D2" />
      <div style={{flex: 1}}><div style={{fontWeight: 600}}>Saved Card</div><div style={{fontSize: 13, color: '#8E8E93'}}>Tap to manage cards</div></div>
      <ChevronRight size={20} color="#C7C7CC" />
    </div>

    {/* Main action button. Disabled if loading OR if the time is in the past */}
    <button
      className="apple-pay-btn"
      onClick={() => { if (!isPastTime) onPayment(bookingStart); }}
      disabled={isLoading || isPastTime}
      style={{ opacity: (isLoading || isPastTime) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
    >
      {isLoading ? <><Spinner /> Processing…</> : 'Pay & Confirm'}
    </button>

    {/* Grey cancel link at the bottom */}
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
