// ============================================================================
//  VIEW: ForgotPasswordView.jsx - the "I forgot my password" screen
// ============================================================================
//  User types in their email, we fire a password reset link off to them via
//  Firebase Auth. Super minimal on purpose - one input, one button, done.
//
//  All the actual logic (sending the email, showing toasts, navigating back)
//  lives in the parent component. This file is just the pretty shell.
// ============================================================================

import React from 'react';
import { ArrowLeft, Mail } from 'lucide-react';

const ForgotPasswordView = ({ email, setEmail, onSubmit, onBack }) => (
  <div className="screen">
    {/* Top bar: back arrow + title */}
    <div className="checkout-header" style={{marginTop: 10}}>
      <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
      <h2 className="checkout-title">Reset Password</h2>
    </div>

    {/* A little explainer so the user isn't left guessing what happens next */}
    <p style={{color: '#8E8E93', marginBottom: 25, fontSize: 15, textAlign: 'center'}}>
      Enter the email address associated with your account, and we'll send you a link to reset your password.
    </p>

    {/* The form itself - one email field, one submit button */}
    <form onSubmit={onSubmit}>
      <div className="ios-input-group">
        <div className="ios-input-row">
          <Mail size={20} color="#8E8E93" />
          <input
            className="ios-input"
            placeholder="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>
      <button className="primary-btn" type="submit" style={{marginTop: 10}}>Send Reset Link</button>
    </form>
  </div>
);

export default ForgotPasswordView;
