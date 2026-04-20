// ============================================================================
//  VIEW: PersonalInfoView.jsx - edit your name and email
// ============================================================================
//  Tiny settings screen with just two fields. When the user hits Save, the
//  parent (useProfile controller) writes the new values to Firestore.
//
//  isLoading flips on during the save so we can show a spinner and grey
//  out the button - stops the user tapping Save twice by accident.
// ============================================================================

import React from 'react';
import { ArrowLeft, User, Mail } from 'lucide-react';

// Little white spinner shown inside the Save button while the write
// is in flight.
const Spinner = () => (
  <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
);

const PersonalInfoView = ({ regName, setRegName, email, setEmail, onSubmit, onBack, isLoading }) => (
  <div className="screen" style={{overflowY: 'auto'}}>
    {/* Top bar with back arrow */}
    <div className="checkout-header" style={{marginTop: 10}}>
      <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
      <h2 className="checkout-title">Personal Info</h2>
    </div>

    <form onSubmit={onSubmit}>
      {/* Name + email inputs grouped into one iOS-style card */}
      <div className="form-section">
        <div className="input-label">Update Details</div>
        <div className="ios-input-group">
          <div className="ios-input-row">
            <User size={20} color="#8E8E93" />
            <input className="ios-input" placeholder="Full Name" value={regName} onChange={(e) => setRegName(e.target.value)} required />
          </div>
          <div className="ios-input-row">
            <Mail size={20} color="#8E8E93" />
            <input className="ios-input" placeholder="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
      </div>

      {/* Save button - disabled and dimmed while saving, with a spinner inside */}
      <button
        className="primary-btn"
        type="submit"
        disabled={isLoading}
        style={{ marginTop: 20, opacity: isLoading ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        {isLoading ? <><Spinner /> Saving…</> : 'Save Changes'}
      </button>
    </form>
  </div>
);

export default PersonalInfoView;
