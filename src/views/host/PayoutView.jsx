/**
 * VIEW: PayoutView.jsx
 * Payout request screen — shows available balance and past payout history.
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';

const Spinner = () => (
  <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
);

const StatusBadge = ({ status }) => {
  const isPending = status === 'pending';
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      background: isPending ? '#FFF3E0' : '#E8F8EE',
      color: isPending ? '#FF9500' : '#34C759',
    }}>
      {isPending ? 'Pending' : 'Completed'}
    </span>
  );
};

const PayoutView = ({ earnings, onRequestPayout, payouts, onBack, isRequesting }) => (
  <div className="screen" style={{ overflowY: 'auto' }}>
    <div className="checkout-header" style={{ marginTop: 10 }}>
      <button className="close-btn" onClick={onBack}>
        <ArrowLeft size={20} color="#000" />
      </button>
      <h2 className="checkout-title">Payout</h2>
    </div>

    <div style={{ padding: '0 20px 100px 20px' }}>
      {/* Balance card */}
      <div className="earnings-card" style={{ marginBottom: 28 }}>
        <p className="earnings-title">Available Balance</p>
        <p className="earnings-amount">£{(earnings || 0).toFixed(2)}</p>
        <p style={{ margin: '10px 0 0 0', fontSize: 14, opacity: 0.9 }}>Ready for payout</p>
      </div>

      <button
        className="primary-btn"
        onClick={onRequestPayout}
        disabled={!earnings || earnings <= 0 || isRequesting}
        style={{ marginBottom: 32, opacity: isRequesting ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        {isRequesting ? <><Spinner /> Requesting…</> : 'Request Payout'}
      </button>

      {/* Payout history */}
      <h3 style={{ fontSize: 18, marginTop: 0, marginBottom: 15 }}>Payout History</h3>

      {payouts.length === 0 ? (
        <div style={{ color: '#8E8E93', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
          No payout requests yet.
        </div>
      ) : (
        payouts.map((payout) => {
          const date = payout.requestedAt?.toDate
            ? payout.requestedAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—';
          return (
            <div key={payout.id} className="booking-card" style={{ cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>£{(payout.amount || 0).toFixed(2)}</div>
                  <div style={{ color: '#8E8E93', fontSize: 13, marginTop: 3 }}>{date}</div>
                </div>
                <StatusBadge status={payout.status} />
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);

export default PayoutView;
