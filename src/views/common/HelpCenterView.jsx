/**
 * VIEW: HelpCenterView.jsx
 * FAQ screen with a live support chat link.
 */

import React from 'react';
import { ArrowLeft, HelpCircle, ChevronRight } from 'lucide-react';

const FAQS = [
  { q: 'How do I book a parking spot?', a: 'Tap a price marker on the map, review the spot details, and tap "Book Now" to proceed to checkout.' },
  { q: 'How do I list my driveway?', a: 'Go to your profile, tap "Switch to Host Dashboard", then tap the + icon to add your spot.' },
  { q: 'Can I extend my booking?', a: 'Yes — from the Active Session screen, use the duration dropdown and tap "Extend & Pay".' },
  { q: 'What if someone is in my spot?', a: 'Use the "Contact Host" button on your active ticket to resolve it directly, or contact support for a full refund.' },
  { q: 'How do host payouts work?', a: 'Payouts are processed automatically to your default payment method at the end of each month.' },
];

const HelpCenterView = ({ onBack, onContactSupport, showToast }) => (
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
      {FAQS.map(({ q, a }) => (
        <div key={q} className="settings-row" onClick={() => showToast(a, 'info')}>
          <span style={{fontWeight: 500}}>{q}</span>
          <ChevronRight size={20} color="#C7C7CC" />
        </div>
      ))}
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
