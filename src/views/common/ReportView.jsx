/**
 * VIEW: ReportView.jsx
 * Report issue form — used by both drivers and hosts.
 */

import React, { useState } from 'react';
import { ArrowLeft, Flag } from 'lucide-react';

const DRIVER_CATEGORIES = [
  'Someone is in my spot',
  'Spot is inaccessible',
  'Spot does not match listing',
  'Payment issue',
  'Host not responding',
  'Other',
];

const HOST_CATEGORIES = [
  'Unauthorised vehicle in my spot',
  'Driver causing damage',
  'Driver not responding',
  'Payment / payout issue',
  'Fraudulent booking',
  'Other',
];

const ReportView = ({ reportContext, userId, onSubmit, onBack }) => {
  const categories = reportContext.userType === 'host' ? HOST_CATEGORIES : DRIVER_CATEGORIES;
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    await onSubmit({ category, description });
    setSubmitting(false);
  };

  return (
    <div className="screen" style={{ overflowY: 'auto' }}>
      <div className="checkout-header" style={{ marginTop: 10 }}>
        <button className="close-btn" onClick={onBack}>
          <ArrowLeft size={20} color="#000" />
        </button>
        <h2 className="checkout-title">Report Issue</h2>
      </div>

      {reportContext.relatedAddress && (
        <div style={{ background: '#FFF3CD', borderRadius: 12, padding: '12px 15px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Flag size={18} color="#856404" />
          <span style={{ fontSize: 14, color: '#856404', fontWeight: 500 }}>
            Reporting about: <strong>{reportContext.relatedAddress}</strong>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="settings-section-title">What's the issue?</div>
        <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', marginBottom: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          {categories.map((cat) => (
            <div
              key={cat}
              className="settings-row"
              onClick={() => setCategory(cat)}
              style={{ gap: 12 }}
            >
              <span style={{ flex: 1, fontWeight: category === cat ? 600 : 400 }}>{cat}</span>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                border: `2px solid ${category === cat ? '#0056D2' : '#C7C7CC'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: category === cat ? '#0056D2' : 'transparent',
                flexShrink: 0,
              }}>
                {category === cat && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
              </div>
            </div>
          ))}
        </div>

        <div className="settings-section-title">Additional details</div>
        <textarea
          className="review-textarea"
          placeholder="Describe what happened…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          style={{ marginBottom: 24 }}
        />

        <button
          type="submit"
          className="primary-btn"
          disabled={submitting || !description.trim()}
          style={{ background: submitting ? '#8E8E93' : '#FF3B30', marginBottom: 12 }}
        >
          {submitting ? 'Submitting…' : 'Submit Report'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#8E8E93', margin: 0 }}>
          Our team will review your report within 24 hours.
        </p>
      </form>
    </div>
  );
};

export default ReportView;
