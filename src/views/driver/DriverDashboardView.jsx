/**
 * VIEW: DriverDashboardView.jsx
 * Driver activity hub — shows active session card and booking history.
 */

import React from 'react';
import { Timer, MapPin, ChevronRight } from 'lucide-react';
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
      <p style={{color: '#8E8E93', fontSize: 15, textAlign: 'center', marginTop: 25}}>
        No recent bookings yet. Go find a spot!
      </p>
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
