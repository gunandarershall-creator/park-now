// ============================================================================
//  VIEW: PayoutView.jsx - the host's "cash out my earnings" screen
// ============================================================================
//  Three main pieces:
//
//    1. Available balance card - the single big number the host cares
//       about, plus a "Request Payout" button.
//
//    2. Balance-over-time chart - an inline SVG bar chart showing how
//       their balance moved across the last 6 weeks. Balance goes up
//       when a booking completes, and back to £0 whenever they request
//       a payout. Lets the host see the peaks/troughs visually.
//
//    3. Payout history list - every payout they've requested, colour
//       coded: orange border for pending, green for completed.
//
//  The request flow has a two-step confirmation. First tap opens a
//  confirm card. Second tap actually fires off the request.
// ============================================================================

import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

/* ── Small helpers ─────────────────────────────────────────────────── */

// Format a timestamp (Firestore Timestamp or string) as "20 Apr 2026".
const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Normalise a timestamp into a plain JS Date, whatever shape it came in as.
const tsToDate = (ts) => {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  return new Date(ts);
};

/*
 * Build 6 balance snapshots, one for the end of each of the last 6 weeks.
 *
 * Approach: list every event (a booking = +£, a payout = -£), sort them
 * by time, then for each week-end work out the cumulative total up to
 * that point. That's the balance AT that moment.
 *
 * Because payouts drain the balance to zero, the chart visually shows
 * drops after each payout - which is actually pretty readable.
 */
const getBalanceSeries = (hostBookings, payouts) => {
  const events = [];

  // Every booking adds earnings to the balance.
  hostBookings.forEach(b => {
    const t = tsToDate(b.timestamp || b.startTime);
    if (t) events.push({ time: t, delta: +(b.totalPaid || 0) });
  });

  // Every payout drains from it.
  payouts.forEach(p => {
    const t = tsToDate(p.requestedAt);
    if (t) events.push({ time: t, delta: -(p.amount || 0) });
  });

  // Sort chronologically so the running sum is correct.
  events.sort((a, b) => a.time - b.time);

  // Work out the Monday that started THIS week (reset to midnight).
  const now = new Date();
  const mondayThisWeek = new Date(now);
  mondayThisWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  mondayThisWeek.setHours(0, 0, 0, 0);

  // Build 6 weeks' worth of buckets working backwards.
  const weeks = [];
  for (let w = 5; w >= 0; w--) {
    const weekStart = new Date(mondayThisWeek);
    weekStart.setDate(mondayThisWeek.getDate() - w * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Running total of everything up to and including this week's end.
    // Math.max(0, ...) because balance can't be negative.
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

/* ── Balance-over-time bar chart (inline SVG, no chart library) ────── */
const BalanceChart = ({ hostBookings, payouts }) => {
  const series  = getBalanceSeries(hostBookings, payouts);
  // Highest bar determines the chart's scale. Floor at 0.01 so we don't divide by zero.
  const maxVal  = Math.max(...series.map(s => s.balance), 0.01);
  const hasData = series.some(s => s.balance > 0);

  // Chart dimensions - hand-tuned for the screen width.
  const CHART_H = 90;
  const BAR_W   = 32;
  const GAP     = 13;
  const SVG_W   = 6 * BAR_W + 5 * GAP; // 252 total width

  return (
    <div style={{ width: '100%' }}>
      {!hasData ? (
        // Friendly placeholder while the host hasn't earned anything yet.
        <div style={{ textAlign: 'center', color: '#C7C7CC', padding: '24px 0', fontSize: 13 }}>
          No earnings yet — bookings will appear here as they come in.
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${SVG_W} ${CHART_H + 38}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          {series.map((s, i) => {
            // Bar height proportional to balance, minimum 4px so zero-weeks
            // still show a tiny stub for visual continuity.
            const barH = s.balance > 0
              ? Math.max(4, (s.balance / maxVal) * CHART_H)
              : 4;
            // Grey for zero-balance weeks, blue otherwise.
            const isPaidOut = s.balance === 0 && i < series.length - 1
              && series.slice(0, i + 1).some(() => true);
            const x = i * (BAR_W + GAP);
            const y = CHART_H - barH;
            const fill = isPaidOut ? '#E5E5EA' : '#0056D2';

            return (
              <g key={i}>
                <rect x={x} y={y} width={BAR_W} height={barH} rx={6} fill={fill} />
                {/* Pound amount above each non-zero bar */}
                {s.balance > 0 && (
                  <text
                    x={x + BAR_W / 2} y={y - 5}
                    textAnchor="middle" fontSize="8.5" fill="#0056D2" fontWeight="700"
                  >
                    £{s.balance.toFixed(0)}
                  </text>
                )}
                {/* Week label below each bar */}
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

/* ── Small status pill used in each payout history row ─────────────── */
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

/* ── Main view ──────────────────────────────────────────────────────── */

// Tiny spinner for the Confirm button while the request is flying.
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
  // Toggles between "Request Payout" button and the confirm card below it.
  const [confirming, setConfirming] = useState(false);

  // Hit when the host finally confirms the payout.
  const handleConfirm = async () => {
    await onRequestPayout();
    setConfirming(false);
  };

  return (
    <div className="screen" style={{ overflowY: 'auto', paddingBottom: 60 }}>
      {/* Top bar */}
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
          {/* If they've had payouts before, show their lifetime earned total too */}
          {totalEarnings > availableBalance && totalEarnings > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.8 }}>
              Total earned all-time: £{totalEarnings.toFixed(2)}
            </p>
          )}
          <p style={{ margin: '8px 0 0', fontSize: 13, opacity: 0.85 }}>
            {availableBalance > 0 ? 'Ready for payout' : 'Nothing to pay out right now'}
          </p>
        </div>

        {/* ── Either the big "Request Payout" button OR the confirm card ── */}
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
          // Confirm card - explains what's about to happen + Cancel/Confirm buttons
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

        {/* ── Balance-over-time bar chart card ── */}
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

        {/* ── Payout history list ── */}
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
                // Orange border for pending, green for completed.
                borderLeft: `4px solid ${p.status === 'pending' ? '#FF9500' : '#34C759'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 20, color: '#1C1C1E' }}>
                    £{(p.amount || 0).toFixed(2)}
                  </div>

                  <div style={{ color: '#8E8E93', fontSize: 13, marginTop: 4 }}>
                    Requested {fmtDate(p.requestedAt)}
                  </div>

                  {/* Small pill with status-specific text */}
                  {p.status === 'pending' ? (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: '#FFF3E0', borderRadius: 8, padding: '4px 10px',
                      marginTop: 8, fontSize: 12, color: '#FF9500', fontWeight: 600,
                    }}>
                      <Clock size={12} /> Expected in 3–5 business days
                    </div>
                  ) : (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: '#E8F8EE', borderRadius: 8, padding: '4px 10px',
                      marginTop: 8, fontSize: 12, color: '#34C759', fontWeight: 600,
                    }}>
                      <CheckCircle size={12} /> Paid out {fmtDate(p.completedAt || p.requestedAt)}
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
