/**
 * VIEW: DriverDashboardView.jsx
 * Driver activity hub — shows active session card and booking history.
 */

import React from 'react';
import { Timer, MapPin, ChevronRight, CalendarX } from 'lucide-react';
import DriverNav from '../shared/DriverNav';

const DriverDashboardView = ({ isSessionActive, myDriverBookings, currentScreen, onNavigate, onViewReceipt }) => (
  <div className="screen" style={{padding: 0}}>
    <div style={{flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '20px 20px 100px 20px'}}>
    <div className="host-header">
      <h2 style={{margin: 0, fontSize: 24, fontWeight: 800}}>Activity Hub</h2>
    </div>

    {isSessionActive ? (
      <div
        className="earnings-card"
        style={{background: 'linear-gradient(135deg, #34C759 0%, #28a745 100%)', cursor: 'pointer'}}
        onClick={() => onNavigate('activeBooking')}
      >
        <p className="earnings-title">Current Status</p>
        <p className="earnings-amount">Active Session</p>
        <p style={{margin: '10px 0 0 0', fontSize: 14, opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px'}}>
          <Timer size={16} /> Tap to view ticket
        </p>
      </div>
    ) : (
      <div className="earnings-card" style={{cursor: 'pointer'}} onClick={() => onNavigate('map')}>
        <p className="earnings-title">Ready to park?</p>
        <p className="earnings-amount">Find a Spot</p>
        <p style={{margin: '10px 0 0 0', fontSize: 14, opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px'}}>
          <MapPin size={16} /> View live map
        </p>
      </div>
    )}

    <h3 style={{fontSize: 18, marginTop: 10, marginBottom: 15}}>Recent Bookings</h3>

    {myDriverBookings.length === 0 ? (
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
      myDriverBookings.map(b => (
        <div
          className="listing-item"
          key={b.id}
          style={{cursor: 'pointer'}}
          onClick={() => onViewReceipt(b)}
        >
          <div>
            <div style={{fontWeight: 700, fontSize: 16}}>{b.address}</div>
            <div style={{color: '#8E8E93', fontSize: 14, marginTop: 4}}>
              {new Date(b.timestamp).toLocaleDateString()} • {b.duration} Hour{b.duration > 1 ? 's' : ''}
            </div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            <div style={{fontWeight: 600, color: '#0056D2'}}>£{(b.totalPaid || 0).toFixed(2)}</div>
            <ChevronRight size={20} color="#C7C7CC" />
          </div>
        </div>
      ))
    )}

    </div>
    <DriverNav currentScreen={currentScreen} onNavigate={onNavigate} />
  </div>
);

export default DriverDashboardView;
