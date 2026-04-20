// ============================================================================
//  VIEW: ReportView.jsx - the "Report an issue" form
// ============================================================================
//  Used by BOTH drivers and hosts to flag a problem. We show a different
//  list of categories depending on which side is reporting:
//
//    Driver side: "Someone is in my spot", "Spot inaccessible", etc.
//    Host side:   "Unauthorised vehicle", "Driver causing damage", etc.
//
//  When they submit we do two things:
//    1. Save the report to Firestore via onSubmit (parent handles that).
//    2. Open the user's email client pre-filled with the report - that
//       way support gets a real inbox copy alongside the Firestore doc.
//
//  A yellow context banner at the top reminds the user what they're
//  reporting about (address or name) so it's impossible to send a report
//  about the wrong booking by accident.
// ============================================================================

import React, { useState } from 'react';
import { ArrowLeft, Flag } from 'lucide-react';

// Categories shown when a driver is doing the reporting.
const DRIVER_CATEGORIES = [
  'Someone is in my spot',
  'Spot is inaccessible',
  'Spot does not match listing',
  'Payment issue',
  'Host not responding',
  'Other',
];

// Categories shown when a host is doing the reporting.
const HOST_CATEGORIES = [
  'Unauthorised vehicle in my spot',
  'Driver causing damage',
  'Driver not responding',
  'Payment / payout issue',
  'Fraudulent booking',
  'Other',
];

const ReportView = ({ reportContext, userId, onSubmit, onBack }) => {
  // Pick the right list based on who's reporting.
  const categories = reportContext.userType === 'host' ? HOST_CATEGORIES : DRIVER_CATEGORIES;
  // Default-select the first category so there's always one picked.
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Require a description - category alone isn't enough detail.
    if (!description.trim()) return;
    setSubmitting(true);
    // 1. Save to Firestore via the parent.
    await onSubmit({ category, description });
    // 2. Also fire off an email so support gets a real inbox copy.
    const subject = encodeURIComponent(`Park Now Report: ${category}`);
    const body = encodeURIComponent(
      `Category: ${category}\n\nLocation: ${reportContext.relatedAddress || 'N/A'}\n\nDescription:\n${description}`
    );
    window.open(`mailto:k2339894@kingston.ac.uk?subject=${subject}&body=${body}`);
    setSubmitting(false);
  };

  return (
    <div className="screen" style={{ overflowY: 'auto' }}>
      {/* Top bar */}
      <div className="checkout-header" style={{ marginTop: 10 }}>
        <button className="close-btn" onClick={onBack}>
          <ArrowLeft size={20} color="#000" />
        </button>
        <h2 className="checkout-title">Report Issue</h2>
      </div>

      {/* Yellow banner reminding the user what they're reporting about */}
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

        {/* Radio-style category picker. Tapping a row selects it. */}
        <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', marginBottom: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          {categories.map((cat) => (
            <div
              key={cat}
              className="settings-row"
              onClick={() => setCategory(cat)}
              style={{ gap: 12 }}
            >
              <span style={{ flex: 1, fontWeight: category === cat ? 600 : 400 }}>{cat}</span>
              {/* Hand-drawn radio circle - filled blue when selected */}
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

        {/* Free-text description box - required */}
        <div className="settings-section-title">Additional details</div>
        <textarea
          className="review-textarea"
          placeholder="Describe what happened…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          style={{ marginBottom: 24 }}
        />

        {/* Red submit button because this is a serious action */}
        <button
          type="submit"
          className="primary-btn"
          disabled={submitting || !description.trim()}
          style={{ background: submitting ? '#8E8E93' : '#FF3B30', marginBottom: 12 }}
        >
          {submitting ? 'Submitting…' : 'Submit Report'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#8E8E93', margin: 0 }}>
          Your report will be sent to{' '}
          <a href="mailto:k2339894@kingston.ac.uk" style={{ color: '#0056D2' }}>k2339894@kingston.ac.uk</a>
          {' '}and reviewed within 24 hours.
        </p>
      </form>
    </div>
  );
};

export default ReportView;
