/**
 * VIEW: AddCardView.jsx
 * Manual card entry form — saves label, last4 and expiry to Firebase via onSave.
 * CVV is never stored (PCI compliance).
 */

import React, { useState } from 'react';
import { ArrowLeft, User, CreditCard } from 'lucide-react';

/** Detect card network from first digits */
const detectNetwork = (num) => {
  const n = num.replace(/\s/g, '');
  if (/^4/.test(n))            return 'Visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n))        return 'Amex';
  if (/^6/.test(n))            return 'Discover';
  return 'Card';
};

/** Format card number with spaces: 4242 4242 4242 4242 */
const formatCardNum = (val) => {
  const digits = val.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

const AddCardView = ({ onBack, onSave }) => {
  const [name,   setName]   = useState('');
  const [num,    setNum]    = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv,    setCvv]    = useState('');
  const [saving, setSaving] = useState(false);

  const handleExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      setExpiry(digits.slice(0, 2) + '/' + digits.slice(2));
    } else {
      setExpiry(digits);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawDigits = num.replace(/\s/g, '');
    if (rawDigits.length < 13) return;
    const last4   = rawDigits.slice(-4);
    const network = detectNetwork(rawDigits);
    const label   = `${name.trim() ? name.trim() + ' · ' : ''}${network}`;

    setSaving(true);
    const ok = await onSave({ label, last4, expiry });
    setSaving(false);
    if (ok) onBack();
  };

  return (
    <div className="screen" style={{ overflowY: 'auto' }}>
      <div className="checkout-header" style={{ marginTop: 10 }}>
        <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
        <h2 className="checkout-title">Add Card</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="input-label">Card Information</div>
          <div className="ios-input-group">
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
            <div className="ios-input-row">
              <CreditCard size={20} color="#8E8E93" />
              <input
                className="ios-input"
                placeholder="Card Number"
                type="text"
                inputMode="numeric"
                value={num}
                onChange={e => setNum(formatCardNum(e.target.value))}
                maxLength={19}
                required
              />
            </div>
            <div style={{ display: 'flex' }}>
              <div className="ios-input-row" style={{ flex: 1, borderRight: '1px solid #E5E5EA' }}>
                <input
                  className="ios-input"
                  placeholder="MM/YY"
                  inputMode="numeric"
                  value={expiry}
                  onChange={e => handleExpiry(e.target.value)}
                  maxLength={5}
                  required
                  style={{ marginLeft: 0, textAlign: 'center' }}
                />
              </div>
              <div className="ios-input-row" style={{ flex: 1 }}>
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
          <p style={{ fontSize: 12, color: '#8E8E93', padding: '6px 4px' }}>
            Your CVV is never stored — only the last 4 digits are saved.
          </p>
        </div>

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
