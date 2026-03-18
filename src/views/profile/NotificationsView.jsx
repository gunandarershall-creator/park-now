/**
 * VIEW: NotificationsView.jsx
 * Push notification preferences with iOS-style toggles.
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';

const NotificationsView = ({ notifBooking, setNotifBooking, notifPromo, setNotifPromo, onBack }) => (
  <div className="screen" style={{overflowY: 'auto'}}>
    <div className="checkout-header" style={{marginTop: 10}}>
      <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
      <h2 className="checkout-title">Notifications</h2>
    </div>

    <div className="settings-section-title">Push Notifications</div>
    <div className="ios-input-group">
      <div className="payment-method-row" style={{marginBottom: 0, borderBottom: '1px solid #E5E5EA', borderRadius: 0, border: 'none'}}>
        <div style={{flex: 1}}>
          <div style={{fontWeight: 600}}>Booking Updates</div>
          <div style={{fontSize: 13, color: '#8E8E93', marginTop: 2}}>Reminders, expiry warnings, and receipts.</div>
        </div>
        <div
          className="toggle-switch"
          style={notifBooking ? {} : {background: '#E5E5EA'}}
          onClick={() => setNotifBooking(!notifBooking)}
        >
          <div className="toggle-knob" style={notifBooking ? {} : {right: 'auto', left: 2}}></div>
        </div>
      </div>

      <div className="payment-method-row" style={{marginBottom: 0, borderRadius: 0, border: 'none'}}>
        <div style={{flex: 1}}>
          <div style={{fontWeight: 600}}>Promotions & Offers</div>
          <div style={{fontSize: 13, color: '#8E8E93', marginTop: 2}}>Discounts and new features.</div>
        </div>
        <div
          className="toggle-switch"
          style={notifPromo ? {} : {background: '#E5E5EA'}}
          onClick={() => setNotifPromo(!notifPromo)}
        >
          <div className="toggle-knob" style={notifPromo ? {} : {right: 'auto', left: 2}}></div>
        </div>
      </div>
    </div>
  </div>
);

export default NotificationsView;
