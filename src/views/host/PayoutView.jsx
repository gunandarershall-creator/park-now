/**
 * VIEW: PayoutView.jsx
 * Payout request screen — available balance, earnings chart, and payout history.
 */

import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

/* ── Helpers ──────────────────────────────────────────────────────────── */

const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Build 6-week buckets (Mon → Sun) from an array of host booking objects. */
const getWeeklyEarnings = (hostBookings) => {
  const result = [];
  const now = new Date();
  for (let w = 5; w >= 0; w--) {
    const weekStart = new Date(now);
    // Monday of the current week minus w full weeks
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7) - w * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const earned = hostBookings
      .filter(b => {
        const t = new Date(b.timestamp || b.startTime);
        return t >= weekStart && t < weekEnd;
      })
      .reduce((sum, b) => sum + (b.totalPaid || 0), 0);

    result.push({
      label: weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      earned,
    });
  }
  return result;
};

/* ── Earnings bar chart (inline SVG — no library needed) ─────────────── */
const EarningsChart = ({ hostBookings }) => {
  const weeks  = getWeeklyEarnings(hostBookings);
  const maxVal = Math.max(...weeks.map(w => w.earned), 0.01);
  const CHART_H = 90;
  const BAR_W   = 32;
  const GAP     = 13;
  const SVG_W   = 6 * BAR_W + 5 * GAP; // 252

  const hasAnyEarnings = weeks.some(w => w.earned > 0);

  return (
    <div style={{ width: '100%' }}>
      {!hasAnyEarnings ? (
        <div style={{ textAlign: 'center', color: '#C7C7CC', padding: '24px 0', fontSize: 13 }}>
          No earnings data yet — bookings will appear here as they come in.
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${SVG_W} ${CHART_H + 38}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          {weeks.map((w, i) => {
            const barH = Math.max(4, (w.earned / maxVal) * CHART_H);
            const x    = i * (BAR_W + GAP);
            const y    = CHART_H - barH;
            return (
              <g key={i}>
                <rect
                  x={x} y={y} width={BAR_W} height={barH}
                  rx={6}
                  fill={w.earned > 0 ? '#0056D2' : '#F2F2F7'}
                />
                {w.earned > 0 && (
                  <text
                    x={x + BAR_W / 2} y={y - 5}
                    textAnchor="middle" fontSize="8.5" fill="#0056D2" fontWeight="700"
                  >
                    £{w.earned.toFixed(0)}
                  </text>
                )}
                <text
                  x={x + BAR_W / 2} y={CHART_H + 16}
                  textAnchor="middle" fontSize="8" fill="#8E8E93"
                >
                  {w.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};

/* ── Status badge ─────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const isPending = status === 'pending';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {isPending
        ? <Clock size={13} color="#FF9500" />
        : <CheckCircle size={13} color="#34C759" />}
      <span style={{
        fontSize: 12, fontWeight: 700,
        color: isPending ? '#FF9500' : '#34C759',
      }}>
        {isPending ? 'Pending' : 'Completed'}
      </span>
    </div>
  );
};

/* ── Main component ───────────────────────────────────────────────────── */
const PayoutView = ({
  availableBalance = 0,
  totalEarnings    = 0,
  hostBookings     = [],
  payouts          = [],
  onRequestPayout,
  isRequesting,
  onBack,
}) => {
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    await onRequestPayout();
    setConfirming(false);
  };

  const Spinner = () => (
    <div style={{
      width: 16, height: 16,
      border: '2.5px solid rgba(255,255,255,0.4)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block',
    }} />
  );

  return (
    <div className="screen" style={{ overflowY: 'auto', paddingBottom: 40 }}>
      {/* Header */}
      <div className="checkout-header" style={{ marginTop: 10 }}>
        <button className="close-btn" onClick={onBack}>
          <ArrowLeft size={20} color="#000" />
        </button>
        <h2 className="checkout-title">Payout</h2>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* ── Balance card ── */}
        <div className="earnings-card" style={{ marginBottom: 20 }}>
          <p className="earnings-title">Available Balance</p>
          <p className="earnings-amount">£{availableBalance.toFixed(2)}</p>
          {totalEarnings > availableBalance && (
            <p style={{ margin: '6px 0 0', fontSize: 13, opacity: 0.8 }}>
              Total earned: £{totalEarnings.toFixed(2)}
            </p>
          )}
          <p style={{ margin: '8px 0 0', fontSize: 13, opacity: 0.85 }}>
            {availableBalance > 0 ? 'Ready to request' : 'No balance to pay out'}
          </p>
        </div>

        {/* ── Request payout / confirmation ── */}
        {!confirming ? (
          <button
            className="primary-btn"
            onClick={() => availableBalance > 0 && setConfirming(true)}
            disabled={availableBalance <= 0 || isRequesting}
            style={{ marginBottom: 8, opacity: availableBalance <= 0 ? 0.4 : 1 }}
          >
            Request Payout
          </button>
        ) : (
          <div style={{
            background: '#F0F6FF', border: '1.5px solid #BDD5FF',
            borderRadius: 16, padding: '18px 16px', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <AlertCircle size={20} color="#0056D2" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: '#1C1C1E' }}>
                  Confirm Payout Request
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#3A3A3C', lineHeight: 1.5 }}>
                  <strong>£{availableBalance.toFixed(2)}</strong> will be sent to your bank account.
                  Funds typically arrive within <strong>3–5 business days</strong>.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirming(false)}
                style={{
                  flex: 1, background: '#E5E5EA', border: 'none', borderRadius: 12,
                  padding: '13px', fontWeight: 700, fontSize: 14, color: '#3A3A3C', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isRequesting}
                style={{
                  flex: 2, background: '#0056D2', border: 'none', borderRadius: 12,
                  padding: '13px', fontWeight: 700, fontSize: 14, color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {isRequesting ? <><Spinner /> Requesting…</> : 'Confirm & Request'}
              </button>
            </div>
          </div>
        )}

        {availableBalance > 0 && !confirming && (
          <p style={{ fontSize: 12, color: '#8E8E93', textAlign: 'center', marginBottom: 24 }}>
            Funds arrive in 3–5 business days after confirmation.
          </p>
        )}

        {/* ── Earnings chart ── */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: '16px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <TrendingUp size={18} color="#0056D2" />
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Earnings Overview</h4>
            <span style={{ fontSize: 12, color: '#8E8E93', marginLeft: 'auto' }}>Last 6 weeks</span>
          </div>
          <EarningsChart hostBookings={hostBookings} />
        </div>

        {/* ── Payout history ── */}
        <h3 style={{ fontSize: 17, marginTop: 4, marginBottom: 14, fontWeight: 700 }}>Payout History</h3>

        {payouts.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: 16, padding: '24px 16px',
            textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          }}>
            <p style={{ margin: 0, color: '#8E8E93', fontSize: 14 }}>No payout requests yet.</p>
          </div>
        ) : (
          payouts.map((payout) => (
            <div
              key={payout.id}
              style={{
                background: '#fff', borderRadius: 14, padding: '14px 16px',
                marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                borderLeft: `4px solid ${payout.status === 'pending' ? '#FF9500' : '#34C759'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: '#1C1C1E' }}>
                    £{(payout.amount || 0).toFixed(2)}
                  </div>
                  <div style={{ color: '#8E8E93', fontSize: 13, marginTop: 3 }}>
                    Requested {fmtDate(payout.requestedAt)}
                  </div>
                  {payout.status === 'pending' && (
                    <div style={{ color: '#FF9500', fontSize: 12, marginTop: 3, fontWeight: 500 }}>
                      Expected in 3–5 business days
                    </div>
                  )}
                </div>
                <StatusBadge status={payout.status} />
              </div>
            </div>
          ))
        )}

      </div>
    </div>
  );
};

export default PayoutView;
