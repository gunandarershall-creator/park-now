/**
 * VIEW: PersonalInfoView.jsx
 * Edit personal name and email.
 */

import React from 'react';
import { ArrowLeft, User, Mail } from 'lucide-react';

const PersonalInfoView = ({ regName, setRegName, email, setEmail, onSubmit, onBack }) => (
  <div className="screen" style={{overflowY: 'auto'}}>
    <div className="checkout-header" style={{marginTop: 10}}>
      <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
      <h2 className="checkout-title">Personal Info</h2>
    </div>

    <form onSubmit={onSubmit}>
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
      <button className="primary-btn" type="submit" style={{marginTop: 20}}>Save Changes</button>
    </form>
  </div>
);

export default PersonalInfoView;
