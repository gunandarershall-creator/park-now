/**
 * VIEW: MapView.jsx
 * Google Maps integration with spot markers, search, and booking sheet.
 */

import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { MapPin, Clock, X, Star, Navigation, ChevronRight } from 'lucide-react';
import { GOOGLE_MAPS_LIBRARIES } from '../../controllers/useSpots';
import DriverNav from '../shared/DriverNav';

const MAP_OPTIONS = {
  disableDefaultUI: true,
  gestureHandling: 'greedy',
  clickableIcons: false,
  mapId: undefined,
  // Prevent zooming out to world view — keeps map within city-level bounds
  minZoom: 10,
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
};

// Stable reference — prevents GoogleMap from remounting on re-renders
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

const MapView = ({
  onMapLoad,
  mapCenter,
  mapZoom,
  panTo,
  spots,
  searchQuery, setSearchQuery,
  isSearchFocused, setIsSearchFocused,
  searchSuggestions,
  selectSuggestion,
  liveToastMessage,
  selectedSpot, setSelectedSpot,
  driverLocation,
  isSessionActive,
  allBookings,
  onSearch,
  onLocate,
  onBookSpot,
  onViewActiveBooking,
  isLocating,
  onViewFullImage,
  currentScreen,
  onNavigate,
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Track zoom level so markers scale down when zoomed out
  const [currentZoom, setCurrentZoom] = useState(mapZoom);
  const mapRef = React.useRef(null);
  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
    onMapLoad(map);
  }, [onMapLoad]);
  const handleZoomChanged = useCallback(() => {
    if (mapRef.current) setCurrentZoom(mapRef.current.getZoom());
  }, []);

  // Marker scale: full size at zoom ≥14, shrinks as you zoom out
  const markerScale = currentZoom >= 14 ? 1 : currentZoom >= 12 ? 0.82 : 0.65;

  const spotReviews = selectedSpot
    ? (allBookings || []).filter(b => b.spotId === selectedSpot.id && b.review)
    : [];
  const avgRating = spotReviews.length > 0
    ? (spotReviews.reduce((sum, b) => sum + b.review.rating, 0) / spotReviews.length).toFixed(1)
    : selectedSpot?.rating ?? null;

  return (
    <div className="screen" style={{ padding: 0, position: 'relative', paddingBottom: 0 }}>

      {liveToastMessage && (
        <div className="live-toast">
          <div className="live-indicator"></div>
          {liveToastMessage}
        </div>
      )}

      {/* Search Bar */}
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
              <X size={18} color="#8E8E93" onClick={() => setSearchQuery('')} style={{ cursor: 'pointer' }} />
            )}
          </form>

          {isSearchFocused && searchSuggestions.length > 0 && (
            <div className="search-dropdown">
              <div className="dropdown-header">
                {searchQuery.trim() === '' ? (searchSuggestions.length > 0 ? 'Recent Searches' : 'No recent searches') : 'Results'}
              </div>
              {searchSuggestions.map((item, idx) => (
                <div
                  key={idx}
                  className="search-suggestion"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion && selectSuggestion(item)}
                >
                  <div className="suggestion-icon">
                    {item.lat ? <Clock size={16} color="#8E8E93" /> : <MapPin size={16} color="#0056D2" />}
                  </div>
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

      {/* Active session banner */}
      {isSessionActive && (
        <div className="active-session-banner" onClick={onViewActiveBooking}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="live-indicator" style={{ background: '#fff', boxShadow: '0 0 8px #fff' }}></div>
            <span style={{ fontWeight: 600 }}>Return to Active Session</span>
          </div>
          <ChevronRight size={18} />
        </div>
      )}

      {/* Google Map */}
      <div id="real-map" style={{ width: '100%', height: '100%' }}>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER_STYLE}
            center={mapCenter}
            zoom={mapZoom}
            options={MAP_OPTIONS}
            onLoad={handleMapLoad}
            onZoomChanged={handleZoomChanged}
          >
            {/* Spot price markers — OverlayView kept for styled HTML bubbles */}
            {spots.filter(s => s.spotsLeft > 0).map(spot => {
              const isActive = selectedSpot?.id === spot.id;
              return (
                <OverlayView
                  key={spot.id}
                  position={{ lat: spot.lat, lng: spot.lng }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -h - 4 })}
                  zIndex={isActive ? 999 : 1}
                >
                  <div
                    className={`price-marker ${isActive ? 'active' : ''}`}
                    onClick={() => { setSelectedSpot(spot); panTo && panTo(spot.lat, spot.lng, 16); }}
                    style={{ transform: `scale(${markerScale})`, transformOrigin: 'bottom center' }}
                  >
                    £{spot.price.toFixed(2)}
                  </div>
                </OverlayView>
              );
            })}

            {/* Driver location dot */}
            {driverLocation && (
              <OverlayView
                position={{ lat: driverLocation.lat, lng: driverLocation.lng }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h / 2) })}
              >
                <div className="driver-dot" />
              </OverlayView>
            )}
          </GoogleMap>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0' }}>
            <p style={{ color: '#8E8E93' }}>Loading map…</p>
          </div>
        )}
      </div>

      {/* Locate button */}
      {!selectedSpot && (
        <div className={`locate-btn ${isLocating ? 'locating' : ''}`} onClick={onLocate}>
          {isLocating
            ? <div className="locate-spinner" />
            : <Navigation size={20} color="white" fill="white" />
          }
        </div>
      )}

      {/* Spot bottom sheet */}
      {selectedSpot && !isSessionActive && (
        <div className="bottom-sheet" style={{ maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden' }}>
          <div className="sheet-header">
            <div>
              <h3 className="sheet-title">{selectedSpot.address}</h3>
              <p className="sheet-subtitle">
                <Star size={16} fill="#FFCC00" color="#FFCC00" />
                {avgRating
                  ? ` ${avgRating} (${spotReviews.length} review${spotReviews.length !== 1 ? 's' : ''})`
                  : ' No reviews yet'}
                {selectedSpot.distance && <span style={{ marginLeft: 8 }}>• {selectedSpot.distance}</span>}
              </p>
            </div>
            <button className="close-btn" onClick={() => setSelectedSpot(null)}>
              <X size={18} color="#000" />
            </button>
          </div>

          {selectedSpot.imageUrl ? (
            <img
              src={selectedSpot.imageUrl}
              alt={selectedSpot.address}
              className="sheet-image"
              style={{ cursor: 'pointer' }}
              onClick={() => onViewFullImage(selectedSpot.imageUrl)}
            />
          ) : (
            <div className="sheet-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E8E93' }}>
              No Image Provided
            </div>
          )}

          <div className="price-row">
            <div>
              <p className="price-label">Total per hour</p>
              <p className="sheet-price">£{selectedSpot.price.toFixed(2)}</p>
            </div>
            <p className="spots-left" style={selectedSpot.spotsLeft > 3 ? { color: '#34C759', background: '#E8F8EE' } : {}}>
              {selectedSpot.spotsLeft} spots left
            </p>
          </div>

          <button className="primary-btn" onClick={onBookSpot}>Book Spot</button>

          {spotReviews.length > 0 && (
            <div style={{ marginTop: 16, borderTop: '1px solid #F2F2F7', paddingTop: 16 }}>
              <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 12px 0' }}>Reviews</p>
              {spotReviews.map((b, i) => (
                <div key={i} style={{ marginBottom: 12, padding: '12px', background: '#F9F9F9', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={13} fill={b.review.rating >= s ? '#FFCC00' : 'transparent'} color={b.review.rating >= s ? '#FFCC00' : '#E5E5EA'} />
                    ))}
                    <span style={{ fontSize: 12, color: '#8E8E93', marginLeft: 6 }}>
                      {new Date(b.review.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {b.review.text && (
                    <p style={{ margin: 0, fontSize: 14, color: '#1C1C1E' }}>{b.review.text}</p>
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
