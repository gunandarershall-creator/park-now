/**
 * VIEW: MapView.jsx
 * Interactive Leaflet map with spot markers, search, and booking sheet.
 */

import React from 'react';
import { MapPin, X, Star, Navigation, ChevronRight } from 'lucide-react';
import DriverNav from '../shared/DriverNav';

const MapView = ({
  mapContainerRef,
  searchQuery, setSearchQuery,
  isSearchFocused, setIsSearchFocused,
  searchSuggestions,
  liveToastMessage,
  selectedSpot, setSelectedSpot,
  isSessionActive,
  allBookings,
  onSearch,
  onLocate,
  onBookSpot,
  onViewActiveBooking,
  onViewFullImage,
  currentScreen,
  onNavigate,
}) => {
  const spotReviews = selectedSpot
    ? (allBookings || []).filter(b => b.spotId === selectedSpot.id && b.review)
    : [];
  const avgRating = spotReviews.length > 0
    ? (spotReviews.reduce((sum, b) => sum + b.review.rating, 0) / spotReviews.length).toFixed(1)
    : selectedSpot?.rating ?? null;

  return (
  <div className="screen" style={{padding: 0, position: 'relative'}}>

    {liveToastMessage && (
      <div className="live-toast"><div className="live-indicator"></div>{liveToastMessage}</div>
    )}

    <div className="search-header">
      <div className="search-container">
        <form className="search-input" onSubmit={onSearch}>
          <MapPin size={20} color="#0056D2" />
          <input
            className="map-search-field"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            placeholder="Search for an address or postcode"
          />
          {searchQuery && (
            <X size={18} color="#8E8E93" onClick={() => setSearchQuery('')} style={{cursor: 'pointer'}} />
          )}
        </form>

        {isSearchFocused && searchSuggestions.length > 0 && (
          <div className="search-dropdown">
            <div className="dropdown-header">
              {searchQuery.trim() === '' ? 'Recent Searches' : 'Suggestions'}
            </div>
            {searchSuggestions.map((item, idx) => (
              <div
                key={idx}
                className="search-suggestion"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSearchQuery(item.title);
                  setIsSearchFocused(false);
                  if (window.mapInstance) window.mapInstance.flyTo([item.lat, item.lng], 14, { duration: 1.0 });
                }}
              >
                <div className="suggestion-icon"><MapPin size={16} color="#8E8E93" /></div>
                <div>
                  <div className="suggestion-text">{item.title}</div>
                  <div className="suggestion-subtext">{item.subtext}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {isSessionActive && selectedSpot && (
      <div className="active-session-banner" onClick={onViewActiveBooking}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <div className="live-indicator" style={{background: '#fff', boxShadow: '0 0 8px #fff'}}></div>
          <span style={{fontWeight: 600}}>Return to Active Session</span>
        </div>
        <ChevronRight size={18} />
      </div>
    )}

    <div id="real-map" ref={mapContainerRef}></div>

    {!selectedSpot && (
      <div className="locate-btn" onClick={onLocate}>
        <Navigation size={22} color="#0056D2" fill="#0056D2" />
      </div>
    )}

    {selectedSpot && !isSessionActive && (
      <div className="bottom-sheet" style={{maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden'}}>
        <div className="sheet-header">
          <div>
            <h3 className="sheet-title">{selectedSpot.address}</h3>
            <p className="sheet-subtitle">
              <Star size={16} fill="#FFCC00" color="#FFCC00" />
              {avgRating ? ` ${avgRating} (${spotReviews.length} review${spotReviews.length !== 1 ? 's' : ''})` : ' No reviews yet'}
              {selectedSpot.distance ? <span style={{marginLeft: 8}}>• {selectedSpot.distance}</span> : null}
            </p>
          </div>
          <button className="close-btn" onClick={() => setSelectedSpot(null)}><X size={18} color="#000" /></button>
        </div>

        {selectedSpot.imageUrl ? (
          <img
            src={selectedSpot.imageUrl}
            alt={selectedSpot.address}
            className="sheet-image"
            style={{cursor: 'pointer'}}
            onClick={() => onViewFullImage(selectedSpot.imageUrl)}
          />
        ) : (
          <div className="sheet-image">No Image Provided</div>
        )}

        <div className="price-row">
          <div>
            <p className="price-label">Total per hour</p>
            <p className="sheet-price">£{selectedSpot.price.toFixed(2)}</p>
          </div>
          <p className="spots-left" style={selectedSpot.spotsLeft > 3 ? {color: '#34C759', background: '#E8F8EE'} : {}}>
            {selectedSpot.spotsLeft} spots left
          </p>
        </div>

        <button className="primary-btn" onClick={onBookSpot}>Book Spot</button>

        {spotReviews.length > 0 && (
          <div style={{marginTop: 16, borderTop: '1px solid #F2F2F7', paddingTop: 16}}>
            <p style={{fontWeight: 700, fontSize: 15, margin: '0 0 12px 0'}}>Reviews</p>
            {spotReviews.map((b, i) => (
              <div key={i} style={{marginBottom: 12, padding: '12px', background: '#F9F9F9', borderRadius: 12}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6}}>
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={13} fill={b.review.rating >= s ? '#FFCC00' : 'transparent'} color={b.review.rating >= s ? '#FFCC00' : '#E5E5EA'} />
                  ))}
                  <span style={{fontSize: 12, color: '#8E8E93', marginLeft: 6}}>
                    {new Date(b.review.timestamp).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'})}
                  </span>
                </div>
                {b.review.text && (
                  <p style={{margin: 0, fontSize: 14, color: '#1C1C1E'}}>{b.review.text}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    <DriverNav currentScreen={currentScreen} onNavigate={onNavigate} />
  </div>
  );
};

export default MapView;
