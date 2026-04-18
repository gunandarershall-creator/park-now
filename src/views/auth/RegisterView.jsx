/**
 * VIEW: RegisterView.jsx
 * Registration screen — full name, email, password, and license plate.
 */

import React from 'react';
import { ArrowLeft, User, Mail, Lock, Car } from 'lucide-react';

const Spinner = () => (
  <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
);

const RegisterView = ({ email, setEmail, password, setPassword, regName, setRegName, regPlate, setRegPlate, onRegister, onBack, isLoading }) => (
  <div className="screen" style={{overflowY: 'auto'}}>
    <div className="checkout-header" style={{marginTop: 10}}>
      <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
      <h2 className="checkout-title">Create Account</h2>
    </div>

    <p style={{color: '#8E8E93', marginBottom: 25, fontSize: 15, textAlign: 'center'}}>
      Join Park Now to find and list driveways instantly.
    </p>

    <form onSubmit={(e) => onRegister(e, regName, regPlate)}>
      <div className="form-section">
        <div className="input-label">Personal Details</div>
        <div className="ios-input-group">
          <div className="ios-input-row"><User size={20} color="#8E8E93" /><input className="ios-input" placeholder="Full Name" value={regName} onChange={(e) => setRegName(e.target.value)} required /></div>
          <div className="ios-input-row"><Mail size={20} color="#8E8E93" /><input className="ios-input" placeholder="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="ios-input-row">
            <Lock size={20} color="#8E8E93" />
            <input className="ios-input" placeholder="Create Password (Min. 6 chars)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" />
          </div>
          <p style={{fontSize: 12, color: '#8E8E93', marginTop: 5, marginBottom: 10, marginLeft: 15}}>Password must be at least 6 characters long.</p>
        </div>
      </div>

      <div className="form-section">
        <div className="input-label">Vehicle Details</div>
        <div className="ios-input-group">
          <div className="ios-input-row"><Car size={20} color="#8E8E93" /><input className="ios-input" placeholder="License Plate (e.g. AB12 CDE)" value={regPlate} onChange={(e) => setRegPlate(e.target.value)} required style={{textTransform: 'uppercase'}} /></div>
        </div>
      </div>

      <button className="primary-btn" type="submit" disabled={isLoading} style={{ marginTop: 20, opacity: isLoading ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {isLoading ? <><Spinner /> Creating account…</> : 'Register & Continue'}
      </button>
    </form>
  </div>
);

export default RegisterView;
