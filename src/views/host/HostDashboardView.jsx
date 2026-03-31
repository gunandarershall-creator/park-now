/**
 * VIEW: HostDashboardView.jsx
 * Host dashboard — earnings card, active guests, and driveway listings.
 */

import React from 'react';
import { Pencil, MessageCircle, Star, Flag } from 'lucide-react';
import HostNav from '../shared/HostNav';

const HostDashboardView = ({
  myHostEarnings,
  hostListings,
  allBookings,
  activeHostBookings,
  pastHostBookings,
  currentScreen,
  onNavigate,
  onToggleListing,
  onEditSpot,
  onMessageDriver,
  onReport,
}) => (
  <div className="screen" style={{padding: 0}}>
    <div style={{flex: 1, overflowY: 'auto', padding: '20px 20px 0 20px'}}>
    <div className="host-header">
      <h2 style={{margin: 0, fontSize: 24, fontWeight: 800}}>Host Dashboard</h2>
    </div>

    <div className="earnings-card">
      <p className="earnings-title">Total Earnings</p>
      <p className="earnings-amount">£{myHostEarnings.toFixed(2)}</p>
      <p style={{margin: '10px 0 0 0', fontSize: 14, opacity: 0.9}}>Ready for payout</p>
    </div>

    <h3 style={{fontSize: 18, marginTop: 10, marginBottom: 15}}>Active Guests</h3>
    {activeHostBookings.length === 0 ? (
      <div style={{color: '#8E8E93', fontSize: 14, textAlign: 'center', padding: '20px 0'}}>No active guests right now.</div>
    ) : (
      activeHostBookings.map(booking => {
        const endsAt = new Date(booking.endTime);
        const minsLeft = Math.max(0, Math.round((endsAt - Date.now()) / 60000));
        const timeLeft = minsLeft >= 60
          ? `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m`
          : `${minsLeft}m`;

        return (
          <div key={booking.id} className="listing-item" style={{display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 10, borderLeft: '4px solid #34C759'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
              <div>
                <div style={{fontWeight: 700, fontSize: 16}}>{booking.address}</div>
                <div style={{color: '#8E8E93', fontSize: 14, marginTop: 4}}>Ends in {timeLeft}</div>
              </div>
              <div className="live-indicator" style={{position: 'static'}}></div>
            </div>
            <button
              className="secondary-btn"
              style={{background: '#E6F0FF', marginTop: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, padding: '12px'}}
              onClick={() => onMessageDriver(booking)}
            >
              <MessageCircle size={18}/> Message Driver
            </button>
          </div>
        );
      })
    )}

    <h3 style={{fontSize: 18, marginTop: 25, marginBottom: 15}}>Past Bookings</h3>
    {pastHostBookings.length === 0 ? (
      <div style={{color: '#8E8E93', fontSize: 14, textAlign: 'center', padding: '20px 0'}}>No past bookings yet.</div>
    ) : (
      pastHostBookings.slice(0, 5).map(booking => (
        <div key={booking.id} className="booking-card" style={{borderLeft: '4px solid #E5E5EA', cursor: 'default'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div style={{flex: 1}}>
              <div style={{fontWeight: 700, fontSize: 15}}>{booking.address}</div>
              <div style={{color: '#8E8E93', fontSize: 13, marginTop: 3}}>
                {new Date(booking.timestamp).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'})}
                {' · '}{booking.duration} hr{booking.duration > 1 ? 's' : ''}
              </div>
              <div style={{color: '#34C759', fontWeight: 600, fontSize: 14, marginTop: 4}}>
                £{(booking.totalPaid || 0).toFixed(2)} earned
              </div>
            </div>
            <button
              className="secondary-btn"
              style={{background: '#FFEBEA', color: '#FF3B30', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, padding: '8px 12px', marginTop: 0, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', width: 'auto'}}
              onClick={() => onReport(booking)}
            >
              <Flag size={14}/> Report
            </button>
          </div>
        </div>
      ))
    )}

    <h3 style={{fontSize: 18, marginTop: 25, marginBottom: 15}}>Your Driveways</h3>

    {hostListings.map(listing => {
      const listingReviews = (allBookings || []).filter(b => b.spotId === listing.id && b.review);
      const avgRating = listingReviews.length > 0
        ? (listingReviews.reduce((sum, b) => sum + b.review.rating, 0) / listingReviews.length).toFixed(1)
        : null;

      return (
        <div className="listing-item" key={listing.id} style={{flexDirection: 'column', alignItems: 'stretch', gap: 8}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <div style={{fontWeight: 700, fontSize: 16}}>{listing.address}</div>
              <div style={{color: '#8E8E93', fontSize: 14, marginTop: 4}}>{listing.details}</div>
              {avgRating ? (
                <div style={{display: 'flex', alignItems: 'center', gap: 4, marginTop: 6}}>
                  <Star size={13} fill="#FFCC00" color="#FFCC00" />
                  <span style={{fontSize: 13, fontWeight: 600}}>{avgRating}</span>
                  <span style={{fontSize: 13, color: '#8E8E93'}}>({listingReviews.length} review{listingReviews.length !== 1 ? 's' : ''})</span>
                </div>
              ) : (
                <div style={{fontSize: 13, color: '#C7C7CC', marginTop: 6}}>No reviews yet</div>
              )}
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

          {listingReviews.length > 0 && (
            <div style={{borderTop: '1px solid #F2F2F7', paddingTop: 10, marginTop: 4}}>
              {listingReviews.slice(0, 2).map((b, i) => (
                <div key={i} style={{marginBottom: 8}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 3, marginBottom: 3}}>
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={11} fill={b.review.rating >= s ? '#FFCC00' : 'transparent'} color={b.review.rating >= s ? '#FFCC00' : '#E5E5EA'} />
                    ))}
                    <span style={{fontSize: 11, color: '#8E8E93', marginLeft: 4}}>
                      {new Date(b.review.timestamp).toLocaleDateString('en-GB', {day:'numeric', month:'short'})}
                    </span>
                  </div>
                  {b.review.text && <p style={{margin: 0, fontSize: 13, color: '#3A3A3C'}}>{b.review.text}</p>}
                </div>
              ))}
              {listingReviews.length > 2 && (
                <p style={{margin: 0, fontSize: 13, color: '#0056D2'}}>+{listingReviews.length - 2} more reviews</p>
              )}
            </div>
          )}
        </div>
      );
    })}

    </div>
    <HostNav currentScreen={currentScreen} onNavigate={onNavigate} />
  </div>
);

export default HostDashboardView;
