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
  onSearch,
  onLocate,
  onBookSpot,
  onViewActiveBooking,
  onViewFullImage,
  currentScreen,
  onNavigate,
}) => (
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
      <div className="bottom-sheet">
        <div className="sheet-header">
          <div>
            <h3 className="sheet-title">{selectedSpot.address}</h3>
            <p className="sheet-subtitle">
              <Star size={16} fill="#FFCC00" color="#FFCC00" /> {selectedSpot.rating} • <span style={{marginLeft: 8}}>{selectedSpot.distance}</span>
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
      </div>
    )}

    <DriverNav currentScreen={currentScreen} onNavigate={onNavigate} />
  </div>
);

export default MapView;
