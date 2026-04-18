/**
 * VIEW: PayoutView.jsx
 * Payout request — available balance, balance-over-time chart, payout history.
 */

import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

/* ── Helpers ──────────────────────────────────────────────────────────── */

const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const tsToDate = (ts) => {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  return new Date(ts);
};

/**
 * Build a 6-point series of available balance sampled at the END of each
 * of the last 6 weeks.  Earnings push the balance up; payouts push it down.
 * The chart therefore drops to ~£0 immediately after every payout request.
 */
const getBalanceSeries = (hostBookings, payouts) => {
  // Combine earning events (+) and payout events (-) into one sorted timeline
  const events = [];

  hostBookings.forEach(b => {
    const t = tsToDate(b.timestamp || b.startTime);
    if (t) events.push({ time: t, delta: +(b.totalPaid || 0) });
  });

  payouts.forEach(p => {
    const t = tsToDate(p.requestedAt);
    if (t) events.push({ time: t, delta: -(p.amount || 0) });
  });

  events.sort((a, b) => a.time - b.time);

  // Sample cumulative balance at the end of each of the last 6 weeks (Mon–Sun)
  const now = new Date();
  const mondayThisWeek = new Date(now);
  mondayThisWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  mondayThisWeek.setHours(0, 0, 0, 0);

  const weeks = [];
  for (let w = 5; w >= 0; w--) {
    const weekStart = new Date(mondayThisWeek);
    weekStart.setDate(mondayThisWeek.getDate() - w * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const balance = Math.max(
      0,
      events
        .filter(e => e.time <= weekEnd)
        .reduce((sum, e) => sum + e.delta, 0),
    );

    weeks.push({
      label: weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      balance,
    });
  }
  return weeks;
};

/* ── Balance-over-time bar chart (inline SVG) ─────────────────────────── */
const BalanceChart = ({ hostBookings, payouts }) => {
  const series  = getBalanceSeries(hostBookings, payouts);
  const maxVal  = Math.max(...series.map(s => s.balance), 0.01);
  const hasData = series.some(s => s.balance > 0);

  const CHART_H = 90;
  const BAR_W   = 32;
  const GAP     = 13;
  const SVG_W   = 6 * BAR_W + 5 * GAP; // 252

  return (
    <div style={{ width: '100%' }}>
      {!hasData ? (
        <div style={{ textAlign: 'center', color: '#C7C7CC', padding: '24px 0', fontSize: 13 }}>
          No earnings yet — bookings will appear here as they come in.
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${SVG_W} ${CHART_H + 38}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          {series.map((s, i) => {
            const barH = s.balance > 0
              ? Math.max(4, (s.balance / maxVal) * CHART_H)
              : 4;
            const isPaidOut = s.balance === 0 && i < series.length - 1
              && series.slice(0, i + 1).some(() => true); // week exists but balance 0
            const x = i * (BAR_W + GAP);
            const y = CHART_H - barH;
            const fill = isPaidOut ? '#E5E5EA' : '#0056D2';

            return (
              <g key={i}>
                <rect x={x} y={y} width={BAR_W} height={barH} rx={6} fill={fill} />
                {s.balance > 0 && (
                  <text
                    x={x + BAR_W / 2} y={y - 5}
                    textAnchor="middle" fontSize="8.5" fill="#0056D2" fontWeight="700"
                  >
                    £{s.balance.toFixed(0)}
                  </text>
                )}
                <text
                  x={x + BAR_W / 2} y={CHART_H + 16}
                  textAnchor="middle" fontSize="8" fill="#8E8E93"
                >
                  {s.label}
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
      <span style={{ fontSize: 12, fontWeight: 700, color: isPending ? '#FF9500' : '#34C759' }}>
        {isPending ? 'Pending' : 'Completed'}
      </span>
    </div>
  );
};

/* ── Main view ────────────────────────────────────────────────────────── */
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

  return (
    <div className="screen" style={{ overflowY: 'auto', paddingBottom: 60 }}>
      {/* Header */}
      <div className="checkout-header" style={{ marginTop: 10 }}>
        <button className="close-btn" onClick={onBack}>
          <ArrowLeft size={20} color="#000" />
        </button>
        <h2 className="checkout-title">Payout</h2>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* ── Available balance card ── */}
        <div className="earnings-card" style={{ marginBottom: 20 }}>
          <p className="earnings-title">Available Balance</p>
          <p className="earnings-amount">£{availableBalance.toFixed(2)}</p>
          {totalEarnings > availableBalance && totalEarnings > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.8 }}>
              Total earned all-time: £{totalEarnings.toFixed(2)}
            </p>
          )}
          <p style={{ margin: '8px 0 0', fontSize: 13, opacity: 0.85 }}>
            {availableBalance > 0 ? 'Ready for payout' : 'Nothing to pay out right now'}
          </p>
        </div>

        {/* ── Request payout button / confirmation ── */}
        {!confirming ? (
          <>
            <button
              className="primary-btn"
              onClick={() => availableBalance > 0 && setConfirming(true)}
              disabled={availableBalance <= 0 || isRequesting}
              style={{ marginBottom: 6, opacity: availableBalance <= 0 ? 0.4 : 1 }}
            >
              Request Payout
            </button>
            {availableBalance > 0 && (
              <p style={{ fontSize: 12, color: '#8E8E93', textAlign: 'center', marginBottom: 24 }}>
                Funds arrive in 3–5 business days after confirmation.
              </p>
            )}
          </>
        ) : (
          <div style={{
            background: '#F0F6FF', border: '1.5px solid #BDD5FF',
            borderRadius: 16, padding: '18px 16px', marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <AlertCircle size={20} color="#0056D2" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: '#1C1C1E' }}>
                  Confirm Payout
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#3A3A3C', lineHeight: 1.5 }}>
                  <strong>£{availableBalance.toFixed(2)}</strong> will be sent to your bank account
                  within <strong>3–5 business days</strong>. Your balance will reset to £0.00.
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

        {/* ── Balance-over-time chart ── */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: '16px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <TrendingUp size={18} color="#0056D2" />
            <div>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Balance Overview</h4>
              <p style={{ margin: 0, fontSize: 11, color: '#8E8E93' }}>
                Drops to £0 after each payout · last 6 weeks
              </p>
            </div>
          </div>
          <BalanceChart hostBookings={hostBookings} payouts={payouts} />
        </div>

        {/* ── Payout history ── */}
        <h3 style={{ fontSize: 17, marginTop: 0, marginBottom: 14, fontWeight: 700 }}>
          Payout History
        </h3>

        {payouts.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: 16, padding: '24px 16px',
            textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          }}>
            <p style={{ margin: 0, color: '#8E8E93', fontSize: 14 }}>No payout requests yet.</p>
          </div>
        ) : (
          payouts.map((p) => (
            <div
              key={p.id}
              style={{
                background: '#fff', borderRadius: 14, padding: '14px 16px',
                marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                borderLeft: `4px solid ${p.status === 'pending' ? '#FF9500' : '#34C759'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: '#1C1C1E' }}>
                    £{(p.amount || 0).toFixed(2)}
                  </div>
                  <div style={{ color: '#8E8E93', fontSize: 13, marginTop: 3 }}>
                    Requested {fmtDate(p.requestedAt)}
                  </div>
                  {p.status === 'pending' && (
                    <div style={{ color: '#FF9500', fontSize: 12, marginTop: 3, fontWeight: 500 }}>
                      Expected in 3–5 business days
                    </div>
                  )}
                </div>
                <StatusBadge status={p.status} />
              </div>
            </div>
          ))
        )}

      </div>
    </div>
  );
};

export default PayoutView;
