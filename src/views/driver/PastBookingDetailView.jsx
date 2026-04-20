// ============================================================================
//  VIEW: PastBookingDetailView.jsx - the receipt screen for a finished booking
// ============================================================================
//  Clicked from the Activity hub (past bookings list). Shows the same kind
//  of breakdown a paper receipt would have - address, booking ID, date,
//  duration, optional insurance line, and the total paid.
//
//  If Premium Insurance was bought, we also show a green "Insurance Active"
//  card with a fake policy number derived from the booking id. Not a real
//  policy number, just for the demo feel.
//
//  "Email Receipt" is placebo - we pop a toast saying it was emailed, but
//  no email is actually sent. Plenty enough for the prototype.
// ============================================================================

import React from 'react';
import { ArrowLeft, ShieldCheck, Flag } from 'lucide-react';

const PastBookingDetailView = ({ viewingReceipt, onBack, onReport, showToast }) => (
  <div className="screen" style={{overflowY: 'auto'}}>
    {/* Top bar */}
    <div className="checkout-header" style={{marginTop: 10}}>
      <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
      <h2 className="checkout-title">Receipt</h2>
    </div>

    {/* Main receipt card */}
    <div className="receipt-box">
      <h3 style={{marginTop: 0, marginBottom: 15}}>{viewingReceipt.address}</h3>
      {/* Last 6 chars of the id turned into a short uppercase reference */}
      <div className="receipt-row"><span style={{color: '#8E8E93'}}>Booking ID</span><span>#{viewingReceipt.id.slice(-6).toUpperCase()}</span></div>
      <div className="receipt-row"><span style={{color: '#8E8E93'}}>Date</span><span>{new Date(viewingReceipt.timestamp).toLocaleDateString()}</span></div>
      <div className="receipt-row"><span style={{color: '#8E8E93'}}>Duration</span><span>{viewingReceipt.duration} Hour{viewingReceipt.duration > 1 ? 's' : ''}</span></div>

      {/* Optional insurance line */}
      {viewingReceipt.hasInsurance && (
        <div className="receipt-row"><span style={{color: '#34C759'}}>Premium Insurance</span><span style={{color: '#34C759'}}>£1.50</span></div>
      )}

      {/* Dashed line above the total to mimic a real till receipt */}
      <div className="receipt-row total" style={{marginTop: 15, borderTop: '2px dashed #E5E5EA', paddingTop: 15}}>
        <span>Total Paid</span>
        <span>£{(viewingReceipt.totalPaid || 0).toFixed(2)}</span>
      </div>
    </div>

    {/* Only show the insurance confirmation card if insurance was taken */}
    {viewingReceipt.hasInsurance && (
      <div className="receipt-box" style={{background: '#E8F8EE', border: '1px solid #34C759'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, color: '#34C759', fontWeight: 600, marginBottom: 8}}>
          <ShieldCheck size={24} /> Insurance Active
        </div>
        <p style={{margin: 0, fontSize: 14, color: '#333'}}>
          {/* Policy number is just the booking id's last 4 chars - fake but feels legit */}
          Policy Number: <b>#INS-{viewingReceipt.id.slice(-4).toUpperCase()}</b><br/>
          This session was fully covered against accidental damage.
        </p>
      </div>
    )}

    {/* Placebo "Email Receipt" - pops a toast but doesn't actually send anything */}
    <button
      className="primary-btn"
      onClick={() => showToast('Receipt has been emailed to you.', 'success')}
      style={{marginTop: 'auto', marginBottom: 10}}
    >
      Email Receipt
    </button>

    {/* Report issue button - goes to the ReportView with this booking's context */}
    <button
      className="secondary-btn"
      style={{color: '#FF3B30', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20}}
      onClick={onReport}
    >
      <Flag size={16} /> Report an Issue with This Booking
    </button>
  </div>
);

export default PastBookingDetailView;
