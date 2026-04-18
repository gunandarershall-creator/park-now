/**
 * VIEW: LoginView.jsx
 * Login screen — email/password.
 */

import React from 'react';
import { MapPin, Mail, Lock } from 'lucide-react';

const Spinner = ({ light }) => (
  <div style={{ width: 18, height: 18, border: `2.5px solid ${light ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.15)'}`, borderTopColor: light ? '#fff' : '#1C1C1E', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
);

const LoginView = ({ email, setEmail, password, setPassword, onLogin, onForgotPassword, onRegister, isLoading }) => (
  <div className="screen">
    <div className="login-header">
      <div className="app-logo"><MapPin size={40} color="white" /></div>
      <h1 style={{fontSize: 32, fontWeight: 800, margin: '5px 0'}}>Park Now</h1>
      <p style={{color: '#8E8E93', margin: 0}}>Find a spot in 30 seconds.</p>
    </div>

    <form onSubmit={onLogin}>
      <div className="ios-input-group">
        <div className="ios-input-row">
          <Mail size={20} color="#8E8E93" />
          <input className="ios-input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="ios-input-row">
          <Lock size={20} color="#8E8E93" />
          <input className="ios-input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
      </div>

      <button className="primary-btn" type="submit" disabled={isLoading} style={{ opacity: isLoading ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {isLoading ? <><Spinner light /> Signing in…</> : 'Sign In'}
      </button>
      <button type="button" className="secondary-btn" onClick={onForgotPassword}>Forgot Password?</button>
    </form>

    <div className="signup-area">
      New to Park Now?
      <button type="button" className="signup-link" onClick={onRegister}>Create Account</button>
    </div>
  </div>
);

export default LoginView;
