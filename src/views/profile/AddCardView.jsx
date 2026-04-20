// ============================================================================
//  VIEW: AddCardView.jsx - add a new payment card
// ============================================================================
//  Card entry form. IMPORTANT: we never store the full card number or the
//  CVV - only the last 4 digits and the expiry get saved to Firestore.
//  That's a PCI compliance rule (you need a real payment processor like
//  Stripe to handle full card details). For this uni project we just
//  simulate the "vault" with last4 + expiry + a label like "John · Visa".
//
//  The card network (Visa / Mastercard / Amex / Discover) is detected
//  from the very first digits of the number using small regex patterns.
// ============================================================================

import React, { useState } from 'react';
import { ArrowLeft, User, CreditCard } from 'lucide-react';

// Guess the card network from the first digits. These rules are based on
// the official "IIN" (Issuer Identification Number) ranges.
const detectNetwork = (num) => {
  const n = num.replace(/\s/g, '');                       // strip any spaces
  if (/^4/.test(n))            return 'Visa';             // Visa always starts with 4
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'Mastercard'; // 51-55 or 2221-2720
  if (/^3[47]/.test(n))        return 'Amex';             // Amex starts with 34 or 37
  if (/^6/.test(n))            return 'Discover';         // Discover starts with 6
  return 'Card';                                          // unknown fallback
};

// Format a card number with spaces every 4 digits so it looks like
// "4242 4242 4242 4242" while the user is typing.
const formatCardNum = (val) => {
  const digits = val.replace(/\D/g, '').slice(0, 16);     // strip non-digits, cap at 16
  return digits.replace(/(.{4})/g, '$1 ').trim();         // space every 4, trim trailing
};

const AddCardView = ({ onBack, onSave }) => {
  // Local form state - we don't lift this up because the parent only
  // cares about the final saved values.
  const [name,   setName]   = useState('');
  const [num,    setNum]    = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv,    setCvv]    = useState('');
  const [saving, setSaving] = useState(false);

  // Auto-insert the "/" in the expiry field once the user types 3+ digits.
  // "1225" becomes "12/25" - one less thing for them to type.
  const handleExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      setExpiry(digits.slice(0, 2) + '/' + digits.slice(2));
    } else {
      setExpiry(digits);
    }
  };

  // Submit - build the safe subset of fields and hand off to the parent.
  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawDigits = num.replace(/\s/g, '');             // strip formatting spaces
    if (rawDigits.length < 13) return;                    // minimum for a real card
    const last4   = rawDigits.slice(-4);                  // only keep last 4
    const network = detectNetwork(rawDigits);
    // Label shown in lists, e.g. "John Smith · Visa"
    const label   = `${name.trim() ? name.trim() + ' · ' : ''}${network}`;

    setSaving(true);
    const ok = await onSave({ label, last4, expiry });    // parent writes to Firestore
    setSaving(false);
    if (ok) onBack();                                     // pop back on success
  };

  return (
    <div className="screen" style={{ overflowY: 'auto' }}>
      {/* Top bar */}
      <div className="checkout-header" style={{ marginTop: 10 }}>
        <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
        <h2 className="checkout-title">Add Card</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="input-label">Card Information</div>
          <div className="ios-input-group">
            {/* Cardholder name */}
            <div className="ios-input-row">
              <User size={20} color="#8E8E93" />
              <input
                className="ios-input"
                placeholder="Cardholder Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            {/* Card number - formatted on every keystroke, capped at 19 chars
                (16 digits + 3 spaces) */}
            <div className="ios-input-row">
              <CreditCard size={20} color="#8E8E93" />
              <input
                className="ios-input"
                placeholder="Card Number"
                type="text"
                inputMode="numeric"                        // mobile shows number pad
                value={num}
                onChange={e => setNum(formatCardNum(e.target.value))}
                maxLength={19}
                required
              />
            </div>

            {/* Expiry + CVV sit side-by-side on one row with a divider between */}
            <div style={{ display: 'flex' }}>
              <div className="ios-input-row" style={{ flex: 1, borderRight: '1px solid #E5E5EA' }}>
                <input
                  className="ios-input"
                  placeholder="MM/YY"
                  inputMode="numeric"
                  value={expiry}
                  onChange={e => handleExpiry(e.target.value)}
                  maxLength={5}                            // "MM/YY" is 5 chars
                  required
                  style={{ marginLeft: 0, textAlign: 'center' }}
                />
              </div>
              <div className="ios-input-row" style={{ flex: 1 }}>
                {/* CVV uses type=password to dot-mask the input, and we never
                    save this value anywhere */}
                <input
                  className="ios-input"
                  placeholder="CVV"
                  type="password"
                  inputMode="numeric"
                  value={cvv}
                  onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  required
                  style={{ marginLeft: 0, textAlign: 'center' }}
                />
              </div>
            </div>
          </div>

          {/* Reassurance text so the user knows we're not secretly hoarding their card */}
          <p style={{ fontSize: 12, color: '#8E8E93', padding: '6px 4px' }}>
            Your CVV is never stored — only the last 4 digits are saved.
          </p>
        </div>

        {/* Save button - dimmed + disabled while writing to Firestore */}
        <button
          className="primary-btn"
          type="submit"
          style={{ marginTop: 12, opacity: saving ? 0.7 : 1 }}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save Card'}
        </button>
      </form>
    </div>
  );
};

export default AddCardView;
