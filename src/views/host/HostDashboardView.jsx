/**
 * VIEW: HostDashboardView.jsx
 * Host dashboard — earnings card, active guests, and driveway listings.
 */

import React from 'react';
import { Pencil, MessageCircle } from 'lucide-react';
import HostNav from '../shared/HostNav';

const HostDashboardView = ({
  myHostEarnings,
  hostListings,
  currentScreen,
  onNavigate,
  onToggleListing,
  onEditSpot,
  onMessageDriver,
}) => (
  <div className="screen" style={{paddingBottom: 90, overflowY: 'auto'}}>
    <div className="host-header">
      <h2 style={{margin: 0, fontSize: 24, fontWeight: 800}}>Host Dashboard</h2>
    </div>

    <div className="earnings-card">
      <p className="earnings-title">Total Earnings</p>
      <p className="earnings-amount">£{myHostEarnings.toFixed(2)}</p>
      <p style={{margin: '10px 0 0 0', fontSize: 14, opacity: 0.9}}>Ready for payout</p>
    </div>

    <h3 style={{fontSize: 18, marginTop: 10, marginBottom: 15}}>Active Guests</h3>
    <div className="listing-item" style={{display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 10, borderLeft: '4px solid #34C759'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
        <div>
          <div style={{fontWeight: 700, fontSize: 16}}>Jane Doe (Ford Fiesta)</div>
          <div style={{color: '#8E8E93', fontSize: 14, marginTop: 4}}>142 Penrhyn Road • Ends in 1h 20m</div>
        </div>
        <div className="live-indicator" style={{position: 'static'}}></div>
      </div>
      <button
        className="secondary-btn"
        style={{background: '#E6F0FF', marginTop: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, padding: '12px'}}
        onClick={onMessageDriver}
      >
        <MessageCircle size={18}/> Message Driver
      </button>
    </div>

    <h3 style={{fontSize: 18, marginTop: 25, marginBottom: 15}}>Your Driveways</h3>

    {hostListings.map(listing => (
      <div className="listing-item" key={listing.id}>
        <div>
          <div style={{fontWeight: 700, fontSize: 16}}>{listing.address}</div>
          <div style={{color: '#8E8E93', fontSize: 14, marginTop: 4}}>{listing.details}</div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <button
            onClick={() => onEditSpot(listing.id)}
            style={{background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#0056D2', display: 'flex'}}
          >
            <Pencil size={20} />
          </button>
          <div
            className="toggle-switch"
            style={listing.isActive ? {} : {background: '#E5E5EA'}}
            onClick={() => onToggleListing(listing.id)}
          >
            <div className="toggle-knob" style={listing.isActive ? {} : {right: 'auto', left: 2}}></div>
          </div>
        </div>
      </div>
    ))}

    <HostNav currentScreen={currentScreen} onNavigate={onNavigate} />
  </div>
);

export default HostDashboardView;
