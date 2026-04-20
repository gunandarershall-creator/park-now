// ============================================================================
//  VIEW: ActiveBookingView.jsx - the "you are currently parked" screen
// ============================================================================
//  This is the driver's live ticket. While they're parked they see:
//    - A countdown to the end of their session
//    - The exact time their session ends (in big text)
//    - A QR code placeholder (for the pretend barrier-scanner flow)
//    - Extend time - pick 1-4 extra hours and pay
//    - Navigate - opens Google Maps / Apple Maps to the spot
//    - Message Host - jumps into chat
//    - End Session Early / Cancel / Report buttons at the bottom
//
//  Colour tells the driver what state they're in:
//    - White number   = plenty of time left
//    - Orange number  = warning (last few minutes)
//    - Red number     = session already expired
// ============================================================================

import React from 'react';
import { Timer, QrCode, ShieldCheck, MessageCircle, Navigation, Flag, XCircle } from 'lucide-react';

// Little white spinner for the Extend button while payment is processing.
const Spinner = () => (
  <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
);

// Helper - turns an ISO timestamp into "14:30" style text for display.
const fmtTime = (isoString) => {
  if (!isoString) return null;
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ActiveBookingView = ({
  selectedSpot,
  hasInsurance,
  extensionDuration, setExtensionDuration,
  onExtend,
  isExtendLoading,
  onEndSession,
  onCancel,
  onReturnToMap,
  onMessageHost,
  onReport,
  timeDisplay,
  isWarning,
  isExpired,
  bookingId,
  endTime,
}) => (
  <div className="screen" style={{paddingBottom: 20, overflowY: 'auto'}}>
    {/* Title */}
    <div className="checkout-header" style={{borderBottom: 'none', justifyContent: 'center'}}>
      <h2 className="checkout-title" style={{padding: 0, textAlign: 'center'}}>Active Session</h2>
    </div>

    {/* The big blue "ticket" card */}
    <div className="ticket-card">
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.9}}>
        <Timer size={20} /><span>{isExpired ? 'Session Expired' : 'Time Remaining'}</span>
      </div>
      {/* Big countdown - red if expired, orange if warning, white otherwise */}
      <div
        className="timer-display"
        style={isExpired ? { color: '#FF3B30' } : isWarning ? { color: '#FF9500' } : {}}
      >
        {timeDisplay || '00:00:00'}
      </div>
      {/* "Ends at 14:30" pill */}
      {fmtTime(endTime) && (
        <div style={{
          fontSize: 14, fontWeight: 700, opacity: 0.9,
          background: 'rgba(255,255,255,0.15)', borderRadius: 10,
          padding: '5px 14px', display: 'inline-block', marginTop: 4,
        }}>
          Ends at {fmtTime(endTime)}
        </div>
      )}
      {/* QR code placeholder - purely visual for the demo */}
      <div className="qr-box"><QrCode size={100} color="#0056D2" /></div>
      <p style={{fontSize: 14, opacity: 0.9, margin: 0}}>
        Scan this QR code at the barrier to enter and exit <b>{selectedSpot.address}</b>.
      </p>

      {/* Show the "Protected" badge if they bought insurance */}
      {hasInsurance && (
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#34C759', fontSize: 13, fontWeight: 600, background: 'white', padding: '6px 12px', borderRadius: 12, width: 'fit-content', margin: '15px auto 0'}}>
          <ShieldCheck size={16} /> Protected by ParkNow
        </div>
      )}
    </div>

    {/* Booking reference for customer support conversations */}
    <div style={{marginTop: 20, marginBottom: 20, textAlign: 'center'}}>
      <p style={{color: '#8E8E93', fontSize: 14}}>
        Booking ID: #{bookingId ? bookingId.slice(-8).toUpperCase() : 'PN-000000'}
      </p>
    </div>

    <div style={{marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10}}>

      {/* Extend time card - picker + pay button */}
      <div style={{background: 'white', borderRadius: 14, padding: 15, marginBottom: 5, boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
          <span style={{fontWeight: 600}}>Extend Time</span>
          <select
            value={extensionDuration}
            onChange={(e) => setExtensionDuration(Number(e.target.value))}
            style={{border: 'none', background: '#F2F2F7', padding: '8px 12px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', outline: 'none', cursor: 'pointer', color: '#0056D2'}}
          >
            <option value={1}>+ 1 Hour</option>
            <option value={2}>+ 2 Hours</option>
            <option value={3}>+ 3 Hours</option>
            <option value={4}>+ 4 Hours</option>
          </select>
        </div>
        <button
          className="primary-btn"
          onClick={onExtend}
          disabled={isExtendLoading}
          style={{ opacity: isExtendLoading ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {isExtendLoading
            ? <><Spinner /> Processing…</>
            : `Pay & Extend (£${(selectedSpot.price * extensionDuration).toFixed(2)})`}
        </button>
      </div>

      {/* Navigate - a proper <a href> so the browser picks the user's default maps app */}
      <a
        href={`https://maps.google.com/maps?q=${selectedSpot.lat},${selectedSpot.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="secondary-btn"
        style={{background: '#E6F0FF', color: '#0056D2', fontWeight: 600, padding: '16px', borderRadius: '14px', marginTop: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none'}}
      >
        <Navigation size={20} /> Navigate There
      </a>

      {/* Open a chat with the host */}
      <button
        className="secondary-btn"
        style={{background: '#E6F0FF', color: '#0056D2', fontWeight: 600, padding: '16px', borderRadius: '14px', marginTop: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8}}
        onClick={onMessageHost}
      >
        <MessageCircle size={20} /> Message Host
      </button>

      {/* Black "Done" button - just goes back to map, doesn't end session */}
      <button className="primary-btn" style={{background: '#000'}} onClick={onReturnToMap}>Done (Return to Map)</button>

      {/* End Session Early - confirm dialog so you don't do it by accident */}
      <button className="danger-btn" onClick={() => {
        if (window.confirm('End your parking session early? Your booking will be marked as complete.')) {
          onEndSession();
        }
      }}>End Session Early</button>

      {/* Cancel - more destructive path, returns refund */}
      <button
        onClick={onCancel}
        style={{width: '100%', background: 'none', border: 'none', color: '#FF3B30', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', padding: '4px 0'}}
      >
        <XCircle size={13} /> Cancel Booking & Request Refund
      </button>

      {/* Report a problem */}
      <button
        onClick={onReport}
        style={{background: 'none', border: 'none', color: '#8E8E93', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', padding: '4px 0'}}
      >
        <Flag size={13} /> Report an issue
      </button>
    </div>
  </div>
);

export default ActiveBookingView;
