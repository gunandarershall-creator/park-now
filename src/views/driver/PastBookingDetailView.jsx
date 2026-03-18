/**
 * VIEW: PastBookingDetailView.jsx
 * Receipt screen for a past booking — shows booking details and insurance info.
 */

import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const PastBookingDetailView = ({ viewingReceipt, onBack }) => (
  <div className="screen" style={{overflowY: 'auto'}}>
    <div className="checkout-header" style={{marginTop: 10}}>
      <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
      <h2 className="checkout-title">Receipt</h2>
    </div>

    <div className="receipt-box">
      <h3 style={{marginTop: 0, marginBottom: 15}}>{viewingReceipt.address}</h3>
      <div className="receipt-row"><span style={{color: '#8E8E93'}}>Booking ID</span><span>#{viewingReceipt.id.slice(-6).toUpperCase()}</span></div>
      <div className="receipt-row"><span style={{color: '#8E8E93'}}>Date</span><span>{new Date(viewingReceipt.timestamp).toLocaleDateString()}</span></div>
      <div className="receipt-row"><span style={{color: '#8E8E93'}}>Duration</span><span>{viewingReceipt.duration} Hour{viewingReceipt.duration > 1 ? 's' : ''}</span></div>

      {viewingReceipt.hasInsurance && (
        <div className="receipt-row"><span style={{color: '#34C759'}}>Premium Insurance</span><span style={{color: '#34C759'}}>£1.50</span></div>
      )}

      <div className="receipt-row total" style={{marginTop: 15, borderTop: '2px dashed #E5E5EA', paddingTop: 15}}>
        <span>Total Paid</span>
        <span>£{(viewingReceipt.totalPaid || 0).toFixed(2)}</span>
      </div>
    </div>

    {viewingReceipt.hasInsurance && (
      <div className="receipt-box" style={{background: '#E8F8EE', border: '1px solid #34C759'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, color: '#34C759', fontWeight: 600, marginBottom: 8}}>
          <ShieldCheck size={24} /> Insurance Active
        </div>
        <p style={{margin: 0, fontSize: 14, color: '#333'}}>
          Policy Number: <b>#INS-{viewingReceipt.id.slice(-4).toUpperCase()}</b><br/>
          This session was fully covered against accidental damage.
        </p>
      </div>
    )}

    <button
      className="primary-btn"
      onClick={() => alert('Receipt has been emailed to you.')}
      style={{marginTop: 'auto', marginBottom: 10}}
    >
      Email Receipt
    </button>
  </div>
);

export default PastBookingDetailView;
