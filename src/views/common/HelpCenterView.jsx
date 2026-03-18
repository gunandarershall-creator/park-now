/**
 * VIEW: HelpCenterView.jsx
 * FAQ screen with a live support chat link.
 */

import React from 'react';
import { ArrowLeft, HelpCircle, ChevronRight } from 'lucide-react';

const HelpCenterView = ({ onBack, onContactSupport }) => (
  <div className="screen" style={{overflowY: 'auto'}}>
    <div className="checkout-header" style={{marginTop: 10}}>
      <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
      <h2 className="checkout-title">Help Center</h2>
    </div>

    <div className="ios-input-group" style={{background: '#E5E5EA', padding: '12px 15px', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10}}>
      <HelpCircle size={18} color="#8E8E93"/>
      <input style={{border: 'none', background: 'transparent', outline: 'none', fontSize: 16, flex: 1}} placeholder="Search for help..." />
    </div>

    <div className="settings-section-title">Frequently Asked Questions</div>
    <div className="ios-input-group">
      <div className="settings-row" onClick={() => alert('To book a spot, simply tap a pin on the map and proceed to checkout!')}>
        <span style={{fontWeight: 500}}>How do I book a parking spot?</span>
        <ChevronRight size={20} color="#C7C7CC" />
      </div>
      <div className="settings-row" onClick={() => alert('Go to your profile, tap "Switch to Host Dashboard", and click the + icon.')}>
        <span style={{fontWeight: 500}}>How do I list my driveway?</span>
        <ChevronRight size={20} color="#C7C7CC" />
      </div>
      <div className="settings-row" onClick={() => alert('You can extend your time directly from the Active Session ticket using the dropdown.')}>
        <span style={{fontWeight: 500}}>Can I extend my booking?</span>
        <ChevronRight size={20} color="#C7C7CC" />
      </div>
      <div className="settings-row" onClick={() => alert('Use the Contact Host button on your active ticket to resolve the issue directly, or contact support for a full refund.')}>
        <span style={{fontWeight: 500}}>What if someone is in my spot?</span>
        <ChevronRight size={20} color="#C7C7CC" />
      </div>
      <div className="settings-row" onClick={() => alert('Payouts are processed automatically to your default payment method at the end of each month.')}>
        <span style={{fontWeight: 500}}>How do host payouts work?</span>
        <ChevronRight size={20} color="#C7C7CC" />
      </div>
    </div>

    <button
      className="secondary-btn"
      style={{background: '#E6F0FF', color: '#0056D2', fontWeight: 600, padding: '16px', borderRadius: '14px', marginTop: 'auto'}}
      onClick={onContactSupport}
    >
      Contact Live Support
    </button>
  </div>
);

export default HelpCenterView;
