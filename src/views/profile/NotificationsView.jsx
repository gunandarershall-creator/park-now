/**
 * VIEW: NotificationsView.jsx
 * Push notification preferences + in-app notification inbox.
 */

import React from 'react';
import { ArrowLeft, Bell, Clock, Star } from 'lucide-react';

const TYPE_ICON = {
  booking: <Bell size={18} color="#0056D2" />,
  expiry:  <Clock size={18} color="#FF9500" />,
  host:    <Star size={18} color="#34C759" />,
};

const TYPE_BG = {
  booking: '#E6F0FF',
  expiry:  '#FFF3E0',
  host:    '#E8F8EE',
};

const fmtTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const NotificationsView = ({
  notifBooking, setNotifBooking,
  notifPromo, setNotifPromo,
  notifHistory = [],
  onClearHistory,
  onBack,
}) => (
  <div className="screen" style={{ overflowY: 'auto' }}>
    <div className="checkout-header" style={{ marginTop: 10 }}>
      <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
      <h2 className="checkout-title">Notifications</h2>
    </div>

    {/* ── Preferences ── */}
    <div className="settings-section-title">Push Notifications</div>
    <div className="ios-input-group">
      <div className="payment-method-row" style={{ marginBottom: 0, border: 'none', borderBottom: '1px solid #F2F2F7' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>Booking Updates</div>
          <div style={{ fontSize: 13, color: '#8E8E93', marginTop: 2 }}>Reminders, expiry warnings, and receipts.</div>
        </div>
        <div
          className="toggle-switch"
          style={notifBooking ? {} : { background: '#E5E5EA' }}
          onClick={() => setNotifBooking(!notifBooking)}
        >
          <div className="toggle-knob" style={notifBooking ? {} : { right: 'auto', left: 2 }} />
        </div>
      </div>

    </div>

    {/* ── Inbox ── */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '24px 20px 10px' }}>
      <div className="settings-section-title" style={{ margin: 0 }}>Recent Activity</div>
      {notifHistory.length > 0 && (
        <button
          onClick={onClearHistory}
          style={{ background: 'none', border: 'none', color: '#0056D2', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}
        >
          Clear all
        </button>
      )}
    </div>

    {notifHistory.length === 0 ? (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '32px 20px', color: '#8E8E93',
      }}>
        <Bell size={36} color="#C7C7CC" style={{ marginBottom: 12 }} />
        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#3C3C43' }}>No notifications yet</p>
        <p style={{ margin: '6px 0 0', fontSize: 13, textAlign: 'center' }}>
          Booking confirmations, session reminders, and host alerts will appear here.
        </p>
      </div>
    ) : (
      <div style={{ padding: '0 16px 100px' }}>
        {notifHistory.map((n) => (
          <div key={n.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            background: '#fff', borderRadius: 14, padding: '14px',
            marginBottom: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12, flexShrink: 0,
              background: TYPE_BG[n.type] || '#F2F2F7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {TYPE_ICON[n.type] || <Bell size={18} color="#8E8E93" />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{n.title}</span>
                <span style={{ fontSize: 11, color: '#8E8E93', flexShrink: 0 }}>{fmtTime(n.time)}</span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#3C3C43', lineHeight: 1.4 }}>{n.body}</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default NotificationsView;
