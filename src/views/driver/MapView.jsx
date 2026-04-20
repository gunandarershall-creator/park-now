// ============================================================================
//  VIEW: MapView.jsx - the main "find a spot" screen
// ============================================================================
//  This is the screen behind the Map tab in driver mode. A live Google Map
//  with a blue price marker on every available spot, a search bar up top,
//  a filter panel, a locate-me button, and a bottom sheet that slides up
//  when you tap a marker.
//
//  Key pieces:
//    - @react-google-maps/api loads the map script and gives us <GoogleMap>.
//    - Custom price markers via OverlayView (not default pins) so they
//      can show the spot's hourly rate directly.
//    - Markers shrink when the map is zoomed out so they don't cover
//      each other up - smooth scale between 40% (zoom 10) and 100% (zoom 15+).
//    - Filters for price, rating and distance. Rating filter uses the
//      actual average from completed bookings, not the seed rating field.
//    - Selecting a spot opens a bottom sheet with photo, rate, reviews
//      and the "Book Spot" button.
// ============================================================================

import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { MapPin, Clock, X, Star, Navigation, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { GOOGLE_MAPS_LIBRARIES } from '../../controllers/useSpots';
import DriverNav from '../shared/DriverNav';

// Options passed to <GoogleMap>. Hides every default button, disables
// POI labels (less clutter), and stops the user from zooming out too far.
const MAP_OPTIONS = {
  disableDefaultUI: true,
  gestureHandling: 'greedy',
  clickableIcons: false,
  mapId: undefined,
  minZoom: 10,
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
};

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

// Haversine formula - calculates the great-circle distance in km between
// two lat/lng points. Used for the "distance from centre" filter.
const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// The three filter categories. Each option has a min/max and a label.
const PRICE_OPTIONS = [
  { label: 'Any', max: Infinity },
  { label: 'Under £3', max: 3 },
  { label: '£3 – £6', max: 6, min: 3 },
  { label: '£6+', min: 6 },
];

const RATING_OPTIONS = [
  { label: 'Any', min: 0 },
  { label: '3★+', min: 3 },
  { label: '4★+', min: 4 },
  { label: '5★', min: 5 },
];

const DISTANCE_OPTIONS = [
  { label: 'Any', max: Infinity },
  { label: '<0.5 km', max: 0.5 },
  { label: '<1 km', max: 1 },
  { label: '<2 km', max: 2 },
];

// Little pill-style button used in the filter panel.
const FilterChip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '7px 14px',
      borderRadius: 20,
      border: active ? 'none' : '1.5px solid #E5E5EA',
      background: active ? '#0056D2' : '#fff',
      color: active ? '#fff' : '#1C1C1E',
      fontSize: 14,
      fontWeight: active ? 700 : 500,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </button>
);

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
  // Loads the Google Maps JS SDK asynchronously. `isLoaded` flips true
  // once the script's ready - until then we show a "Loading map..." box.
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Track the current zoom level so we can scale down the price markers
  // as the user zooms out.
  const [currentZoom, setCurrentZoom] = useState(mapZoom);
  const mapRef = React.useRef(null);
  const handleMapLoad = useCallback((map) => { mapRef.current = map; onMapLoad(map); }, [onMapLoad]);
  const handleZoomChanged = useCallback(() => { if (mapRef.current) setCurrentZoom(mapRef.current.getZoom()); }, []);
  // Smooth marker scaling: full size at zoom 15+, shrinks down to 40%
  // at zoom 10 and below. Otherwise markers overlap badly at city level.
  const markerScale = Math.min(1, Math.max(0.4, (currentZoom - 9) / 6));

  // --- FILTER STATE ---
  const [showFilters, setShowFilters] = useState(false);
  const [priceIdx, setPriceIdx] = useState(0);     // 0 means "Any"
  const [ratingIdx, setRatingIdx] = useState(0);
  const [distanceIdx, setDistanceIdx] = useState(0);

  // Count how many filters are active (not "Any") so we can show a badge.
  const activeFilterCount = (priceIdx > 0 ? 1 : 0) + (ratingIdx > 0 ? 1 : 0) + (distanceIdx > 0 ? 1 : 0);

  const clearFilters = () => { setPriceIdx(0); setRatingIdx(0); setDistanceIdx(0); };

  // For a given spot, calculate its average rating from actual completed
  // bookings with reviews. Returns null if nothing's been reviewed yet.
  const getSpotRating = (spotId) => {
    const reviews = (allBookings || []).filter(b => b.spotId === spotId && b.review);
    if (reviews.length === 0) return null;
    return reviews.reduce((sum, b) => sum + b.review.rating, 0) / reviews.length;
  };

  // Apply all three filters + the "has capacity" check to produce the
  // subset of spots we actually show on the map.
  const filteredSpots = spots.filter(s => {
    // Fully booked - hide from the map entirely.
    if (s.spotsLeft <= 0) return false;

    // Price filter.
    const p = PRICE_OPTIONS[priceIdx];
    if (p.min !== undefined && s.price < p.min) return false;
    if (p.max !== undefined && p.max !== Infinity && s.price > p.max) return false;

    // Rating filter - prefer real review average, fall back to seed rating.
    const r = RATING_OPTIONS[ratingIdx];
    if (r.min > 0) {
      const rating = getSpotRating(s.id) ?? s.rating ?? 0;
      if (rating < r.min) return false;
    }

    // Distance filter - measured from the current map centre, so as the
    // user pans around the list updates.
    const d = DISTANCE_OPTIONS[distanceIdx];
    if (d.max !== Infinity) {
      const centre = mapRef.current
        ? { lat: mapRef.current.getCenter().lat(), lng: mapRef.current.getCenter().lng() }
        : mapCenter;
      const km = getDistanceKm(centre.lat, centre.lng, s.lat, s.lng);
      if (km > d.max) return false;
    }

    return true;
  });

  // Reviews for the currently-selected spot, used in the bottom sheet.
  const spotReviews = selectedSpot
    ? (allBookings || []).filter(b => b.spotId === selectedSpot.id && b.review)
    : [];
  const avgRating = spotReviews.length > 0
    ? (spotReviews.reduce((sum, b) => sum + b.review.rating, 0) / spotReviews.length).toFixed(1)
    : selectedSpot?.rating ?? null;

  return (
    <div className="screen" style={{ padding: 0, position: 'relative', paddingBottom: 0 }}>

      {/* "Sarah just booked in Tulse Hill" style live social-proof toast */}
      {liveToastMessage && (
        <div className="live-toast">
          <div className="live-indicator"></div>
          {liveToastMessage}
        </div>
      )}

      {/* Top search bar and filter button */}
      <div className="search-header">
        <div className="search-container" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <form className="search-input" style={{ flex: 1 }} onSubmit={onSearch}>
            <MapPin size={20} color="#0056D2" />
            <input
              className="map-search-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              // Delay the blur so clicking a suggestion still fires before
              // the dropdown closes and swallows the click.
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search for an address or postcode"
            />
            {searchQuery && (
              <X size={18} color="#8E8E93" onClick={() => setSearchQuery('')} style={{ cursor: 'pointer' }} />
            )}
          </form>

          {/* Filter toggle - turns blue with a count badge when filters are active */}
          <button
            onClick={() => setShowFilters(v => !v)}
            style={{
              flexShrink: 0,
              background: activeFilterCount > 0 ? '#0056D2' : '#fff',
              border: activeFilterCount > 0 ? 'none' : '1.5px solid #E5E5EA',
              borderRadius: 12,
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
              color: activeFilterCount > 0 ? '#fff' : '#1C1C1E',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <SlidersHorizontal size={17} />
            {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
          </button>

          {/* Autocomplete dropdown. When the search box is focused and there
              are either recent searches or Places suggestions, show them. */}
          {isSearchFocused && searchSuggestions.length > 0 && (
            <div className="search-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100 }}>
              <div className="dropdown-header">
                {searchQuery.trim() === '' ? 'Recent Searches' : 'Results'}
              </div>
              {searchSuggestions.map((item, idx) => (
                <div
                  key={idx}
                  className="search-suggestion"
                  // onMouseDown + preventDefault stops the input losing focus
                  // before we can handle the click
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion && selectSuggestion(item)}
                >
                  <div className="suggestion-icon">
                    {/* Clock icon for recent searches, pin for places suggestions */}
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

      {/* Filter panel - slides down when the filter button is pressed */}
      {showFilters && (
        <div style={{
          position: 'absolute', top: 72, left: 0, right: 0, zIndex: 200,
          background: '#fff', borderRadius: '0 0 20px 20px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '16px 20px 20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Filters</span>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#0056D2', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Clear All
              </button>
            )}
          </div>

          {/* Price chip row */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Price</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRICE_OPTIONS.map((o, i) => (
                <FilterChip key={i} label={o.label} active={priceIdx === i} onClick={() => setPriceIdx(i)} />
              ))}
            </div>
          </div>

          {/* Rating chip row */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Rating</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {RATING_OPTIONS.map((o, i) => (
                <FilterChip key={i} label={o.label} active={ratingIdx === i} onClick={() => setRatingIdx(i)} />
              ))}
            </div>
          </div>

          {/* Distance chip row */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Distance from centre</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DISTANCE_OPTIONS.map((o, i) => (
                <FilterChip key={i} label={o.label} active={distanceIdx === i} onClick={() => setDistanceIdx(i)} />
              ))}
            </div>
          </div>

          {/* Live result count - orange if there's nothing matching */}
          {filteredSpots.length === 0 ? (
            <div style={{ marginTop: 16, background: '#FFF3E0', borderRadius: 10, padding: '10px 14px', textAlign: 'center', fontSize: 14, color: '#FF9500', fontWeight: 600 }}>
              No spots match your filters — try widening your search
            </div>
          ) : (
            <div style={{ marginTop: 16, background: '#F2F2F7', borderRadius: 10, padding: '8px 14px', textAlign: 'center', fontSize: 14, color: '#3A3A3C', fontWeight: 500 }}>
              {filteredSpots.length} spot{filteredSpots.length !== 1 ? 's' : ''} match your filters
            </div>
          )}
        </div>
      )}

      {/* Green "Return to Active Session" banner - only shown while parked */}
      {isSessionActive && (
        <div className="active-session-banner" onClick={onViewActiveBooking}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="live-indicator" style={{ background: '#fff', boxShadow: '0 0 8px #fff' }}></div>
            <span style={{ fontWeight: 600 }}>Return to Active Session</span>
          </div>
          <ChevronRight size={18} />
        </div>
      )}

      {/* The actual Google Map */}
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
            {/* One price marker per spot */}
            {filteredSpots.map(spot => {
              const isActive = selectedSpot?.id === spot.id;
              return (
                <OverlayView
                  key={spot.id}
                  position={{ lat: spot.lat, lng: spot.lng }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  // Centre the marker horizontally and sit it just above the point
                  getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -h - 4 })}
                  zIndex={isActive ? 999 : 1}
                >
                  <div
                    className={`price-marker ${isActive ? 'active' : ''}`}
                    onClick={() => { setSelectedSpot(spot); panTo && panTo(spot.lat, spot.lng, 16); }}
                    // Shrink/grow smoothly as the user zooms
                    style={{ transform: `scale(${markerScale})`, transformOrigin: 'bottom center' }}
                  >
                    £{spot.price.toFixed(2)}
                  </div>
                </OverlayView>
              );
            })}

            {/* Blue pulsing dot showing driver's current location */}
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
          // Fallback while Google Maps JS is still loading
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0' }}>
            <p style={{ color: '#8E8E93' }}>Loading map…</p>
          </div>
        )}
      </div>

      {/* Blue "locate me" button, hidden when a spot is selected so it
          doesn't fight with the bottom sheet for attention */}
      {!selectedSpot && (
        <div className={`locate-btn ${isLocating ? 'locating' : ''}`} onClick={onLocate}>
          {isLocating
            ? <div className="locate-spinner" />
            : <Navigation size={20} color="white" fill="white" />
          }
        </div>
      )}

      {/* Bottom sheet - shown when a spot is selected */}
      {selectedSpot && !isSessionActive && (
        <div className="bottom-sheet" style={{ maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden' }}>
          {/* Sheet header: title, rating, distance */}
          <div className="sheet-header">
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 className="sheet-title">{selectedSpot.address}</h3>
              <p className="sheet-subtitle">
                <Star size={16} fill="#FFCC00" color="#FFCC00" />
                {avgRating
                  ? ` ${avgRating} (${spotReviews.length} review${spotReviews.length !== 1 ? 's' : ''})`
                  : ' No reviews yet'}
                {selectedSpot.distance && <span style={{ marginLeft: 8 }}>• {selectedSpot.distance}</span>}
              </p>
              {/* Open in the device's maps app */}
              <a
                href={`https://maps.google.com/maps?q=${selectedSpot.lat},${selectedSpot.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#0056D2', fontWeight: 600, marginTop: 4, textDecoration: 'none' }}
              >
                <Navigation size={13} /> Open in Maps
              </a>
            </div>
            <button className="close-btn" onClick={() => setSelectedSpot(null)}>
              <X size={18} color="#000" />
            </button>
          </div>

          {/* Spot image - tap to open full screen. Fallback if missing. */}
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

          {/* Price and capacity */}
          <div className="price-row">
            <div>
              <p className="price-label">Total per hour</p>
              <p className="sheet-price">£{selectedSpot.price.toFixed(2)}</p>
            </div>
            {/* Green pill if 4+ spots available, default pill otherwise */}
            <p className="spots-left" style={selectedSpot.spotsLeft > 3 ? { color: '#34C759', background: '#E8F8EE' } : {}}>
              {selectedSpot.spotsLeft} spots left
            </p>
          </div>

          {/* Availability hours. IIFE so we can compute and return
              nothing if there's nothing useful to show. */}
          {(() => {
            const from = selectedSpot.availFrom;
            const to = selectedSpot.availTo;
            if (!from && !to) return null;
            // If hours span a full day, show "Available all day" instead.
            const isAllDay = (!from || from === '00:00') && (!to || to === '23:59' || to === '00:00');
            // Convert 24h to 12h with AM/PM for readability.
            const fmt = (t) => {
              const [h, m] = t.split(':').map(Number);
              return `${h % 12 || 12}:${m.toString().padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
            };
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#8E8E93', marginBottom: 12 }}>
                <Clock size={14} />
                {isAllDay ? 'Available all day' : `Available ${fmt(from)} – ${fmt(to)}`}
              </div>
            );
          })()}

          {/* Main "Book Spot" button - sticky to the bottom of the sheet */}
          <button
            className="primary-btn"
            onClick={onBookSpot}
            style={{
              position: 'sticky', bottom: 0, zIndex: 10,
              boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
              margin: '0 -20px', width: 'calc(100% + 40px)',
              borderRadius: 0, paddingLeft: 20, paddingRight: 20,
            }}
          >
            Book Spot
          </button>

          {/* Reviews list at the bottom of the sheet */}
          {spotReviews.length > 0 && (
            <div style={{ marginTop: 16, borderTop: '1px solid #F2F2F7', paddingTop: 16 }}>
              <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 12px 0' }}>Reviews</p>
              {spotReviews.map((b, i) => (
                <div key={i} style={{ marginBottom: 12, padding: '12px', background: '#F9F9F9', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    {/* Star row - filled yellow for stars earned */}
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

      {/* Bottom nav bar */}
      <DriverNav currentScreen={currentScreen} onNavigate={onNavigate} />
    </div>
  );
};

export default MapView;
