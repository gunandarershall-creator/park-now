/**
 * VIEW: TermsPrivacyView.jsx
 * Terms of Service and Privacy Policy document.
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';

const TermsPrivacyView = ({ onBack }) => (
  <div className="screen" style={{overflowY: 'auto', background: '#fff'}}>
    <div className="checkout-header" style={{marginTop: 10, background: '#fff', position: 'sticky', top: 0, zIndex: 10, paddingBottom: 15}}>
      <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
      <h2 className="checkout-title">Terms & Privacy</h2>
    </div>

    <div style={{color: '#333', fontSize: 14, lineHeight: 1.6, paddingBottom: 40}}>
      <h3 style={{fontSize: 18, color: '#000'}}>1. Acceptance of Terms</h3>
      <p>By accessing or using the Park Now application, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services.</p>

      <h3 style={{fontSize: 18, color: '#000', marginTop: 24}}>2. User Responsibilities (Drivers)</h3>
      <p>As a driver, you agree to park only in the designated areas outlined by the Host. You must strictly adhere to the booking times. Overstaying may result in additional penalty fees or your vehicle being towed at your own expense.</p>

      <h3 style={{fontSize: 18, color: '#000', marginTop: 24}}>3. Host Responsibilities</h3>
      <p>As a host, you guarantee that you have the legal right to rent out the driveway or parking space listed. The space must be accurately represented in photos and descriptions, and be reasonably accessible during the booking period.</p>

      <h3 style={{fontSize: 18, color: '#000', marginTop: 24}}>4. Privacy & Data Collection</h3>
      <p>We collect location data (GPS) to provide you with accurate nearby parking spots. Your payment information is securely encrypted and processed by a third-party gateway. We do not sell your personal data to advertisers.</p>

      <h3 style={{fontSize: 18, color: '#000', marginTop: 24}}>5. Cancellations & Refunds</h3>
      <p>Bookings can be cancelled up to 1 hour before the scheduled start time for a full refund. Cancellations made within 1 hour are not eligible for refunds. Host-initiated cancellations will result in a 100% refund to the driver.</p>

      <h3 style={{fontSize: 18, color: '#000', marginTop: 24}}>6. Insurance Policy</h3>
      <p>Every booking includes a standard public liability protection for both the host and the driver. This is included in the service fee. Damage must be reported within 24 hours of the session end time.</p>

      <h3 style={{fontSize: 18, color: '#000', marginTop: 24}}>7. Community Safety</h3>
      <p>We maintain a strict code of conduct. All drivers must be respectful and park within the designated lines of the host's property. Any reports of inappropriate behaviour will result in an immediate account review.</p>

      <p style={{color: '#8E8E93', marginTop: 30, fontSize: 12, textAlign: 'center'}}>Last updated: April 2026</p>
    </div>
  </div>
);

export default TermsPrivacyView;
