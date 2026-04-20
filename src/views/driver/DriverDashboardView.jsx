// ============================================================================
//  VIEW: DriverDashboardView.jsx - the driver's "Activity" hub
// ============================================================================
//  This is the screen behind the Activity tab in the driver nav. It's split
//  into three parts:
//
//    1. Top status card - changes depending on what's going on:
//         - Active session   -> green card linking to the live ticket
//         - Upcoming booking -> blue card with the next booking details
//         - Nothing on       -> plain card telling them to open the map
//
//    2. Upcoming bookings list - every booking that hasn't started yet.
//
//    3. Recent bookings list - everything that's already happened.
//
//  I separate upcoming from past up front with a Set so a booking never
//  shows in both places at the same time.
// ============================================================================

import React from 'react';
import { Timer, MapPin, ChevronRight, CalendarX, Clock, Calendar, CalendarCheck } from 'lucide-react';
import DriverNav from '../shared/DriverNav';

// Small helpers - format an ISO string as a friendly time or date label.
const fmtTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const fmtDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
};

const DriverDashboardView = ({
  isSessionActive,
  myDriverBookings,
  currentScreen,
  onNavigate,
  onViewReceipt,
  upcomingBookings = [],
  onViewUpcoming,
}) => {
  // Build a Set of upcoming ids so we can exclude them from the "past"
  // list without double-showing anything.
  const upcomingIds  = new Set(upcomingBookings.map(b => b.id));
  const pastBookings = myDriverBookings.filter(b => !upcomingIds.has(b.id));

  return (
    <div className="screen" style={{ padding: 0 }}>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '20px 20px 100px 20px' }}>
        <div className="host-header">
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Activity Hub</h2>
        </div>

        {/* ── 1. Top status card - content depends on current state ── */}
        {isSessionActive ? (
          // GREEN - user is currently parked, tap to see the ticket
          <div
            className="earnings-card"
            style={{ background: 'linear-gradient(135deg, #34C759 0%, #28a745 100%)', cursor: 'pointer' }}
            onClick={() => onNavigate('activeBooking')}
          >
            <p className="earnings-title">Current Status</p>
            <p className="earnings-amount">Active Session</p>
            <p style={{ margin: '10px 0 0', fontSize: 14, opacity: 0.9, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Timer size={16} /> Tap to view ticket
            </p>
          </div>
        ) : upcomingBookings.length > 0 ? (
          // BLUE - user has a future booking, show when and where
          <div
            className="earnings-card"
            style={{ cursor: 'pointer' }}
            onClick={() => onViewUpcoming && onViewUpcoming(upcomingBookings[0])}
          >
            <p className="earnings-title">Next Booking</p>
            <p className="earnings-amount" style={{ fontSize: 18, marginTop: 4 }}>
              {upcomingBookings[0].address}
            </p>
            <p style={{ margin: '10px 0 0', fontSize: 14, opacity: 0.9, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} />
              {fmtDate(upcomingBookings[0].startTime)} at {fmtTime(upcomingBookings[0].startTime)}
            </p>
          </div>
        ) : (
          // Neutral - nothing happening, prompt to find a spot
          <div className="earnings-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('map')}>
            <p className="earnings-title">Ready to park?</p>
            <p className="earnings-amount">Find a Spot</p>
            <p style={{ margin: '10px 0 0', fontSize: 14, opacity: 0.9, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={16} /> View live map
            </p>
          </div>
        )}

        {/* ── 2. Upcoming bookings list ── */}
        <h3 style={{ fontSize: 18, marginTop: 20, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarCheck size={18} color="#0056D2" /> Upcoming Bookings
        </h3>

        {upcomingBookings.length === 0 ? (
          // Empty-state tile with a calendar icon
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: '#F9F9F9', borderRadius: 16, padding: '16px 18px', marginBottom: 8,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14, background: '#E6F0FF', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Calendar size={22} color="#0056D2" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#1C1C1E' }}>No upcoming bookings</p>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#8E8E93' }}>
                Future bookings will appear here as soon as you book.
              </p>
            </div>
          </div>
        ) : (
          // One row per upcoming booking
          upcomingBookings.map(b => (
            <div
              key={b.id}
              className="listing-item"
              style={{ cursor: 'pointer', borderLeft: '4px solid #0056D2', marginBottom: 10 }}
              onClick={() => onViewUpcoming && onViewUpcoming(b)}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{b.address}</div>
                <div style={{ color: '#8E8E93', fontSize: 13, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={13} />
                  {fmtDate(b.startTime)} · {fmtTime(b.startTime)} – {fmtTime(b.endTime)}
                </div>
                <div style={{ color: '#0056D2', fontWeight: 600, fontSize: 13, marginTop: 3 }}>
                  {b.duration} hr{b.duration > 1 ? 's' : ''} · £{(b.totalPaid || 0).toFixed(2)} paid
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Blue pill tag for visual distinction */}
                <div style={{ fontSize: 11, color: '#0056D2', fontWeight: 700, background: '#E6F0FF', padding: '4px 10px', borderRadius: 20 }}>
                  Upcoming
                </div>
                <ChevronRight size={18} color="#C7C7CC" />
              </div>
            </div>
          ))
        )}

        {/* ── 3. Recent (past) bookings list ── */}
        <h3 style={{ fontSize: 18, marginTop: 24, marginBottom: 15 }}>Recent Bookings</h3>

        {pastBookings.length === 0 ? (
          // Fancy empty-state card prompting first booking
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '36px 20px', background: '#fff', borderRadius: 20,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginTop: 4,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20, background: '#E6F0FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <CalendarX size={32} color="#0056D2" />
            </div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1C1C1E' }}>No bookings yet</p>
            <p style={{ margin: '8px 0 20px', fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 1.5 }}>
              Your parking history will appear here once you make your first booking.
            </p>
            <button
              className="primary-btn"
              onClick={() => onNavigate('map')}
              style={{ width: 'auto', padding: '12px 28px', fontSize: 15 }}
            >
              Find a Spot
            </button>
          </div>
        ) : (
          // One row per past booking - tap to see the receipt
          pastBookings.map(b => (
            <div
              className="listing-item"
              key={b.id}
              style={{ cursor: 'pointer', marginBottom: 10 }}
              onClick={() => onViewReceipt(b)}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{b.address}</div>
                <div style={{ color: '#8E8E93', fontSize: 14, marginTop: 4 }}>
                  {new Date(b.timestamp).toLocaleDateString()} · {b.duration} hr{b.duration > 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontWeight: 600, color: '#0056D2' }}>£{(b.totalPaid || 0).toFixed(2)}</div>
                <ChevronRight size={20} color="#C7C7CC" />
              </div>
            </div>
          ))
        )}
      </div>
      {/* Bottom nav bar */}
      <DriverNav currentScreen={currentScreen} onNavigate={onNavigate} />
    </div>
  );
};

export default DriverDashboardView;
