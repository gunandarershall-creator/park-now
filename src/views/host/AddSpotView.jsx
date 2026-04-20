// ============================================================================
//  VIEW: AddSpotView.jsx - the "List your driveway" form
// ============================================================================
//  Form the host fills in to publish a new listing. More involved than
//  the edit view because we need to pick a real address with lat/lng so
//  the spot can show up on the map.
//
//  The address field uses Google Places Autocomplete - as you type we
//  debounce 300ms and then call the AutocompleteService for suggestions
//  restricted to GB addresses. Picking a suggestion calls the Geocoder
//  to resolve exact lat/lng and store them in newCoords. That's what
//  lets us drop an accurate pin on the map without a second geocode
//  lookup when the host publishes.
//
//  Availability hours: defaults to "all day" but the host can toggle
//  that off and pick specific From/To times (e.g. "only rent between
//  9am-5pm on weekdays").
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, MapPin } from 'lucide-react';

// Spinner for the Publish button while the listing is saving.
const Spinner = () => (
  <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
);

// Quick helper - turns a 24h "14:30" string into "2:30 PM" for the
// summary caption below the time pickers.
const formatTime12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const AddSpotView = ({
  newAddress, setNewAddress,
  setNewCoords,
  newPrice, setNewPrice,
  newImage,
  fileInputRef,
  onImageUpload,
  onSubmit,
  onBack,
  isLoading,
  availFrom, setAvailFrom,
  availTo, setAvailTo,
}) => {
  // "all day" just means the hours are set to the full 24h range.
  const allDay = availFrom === '00:00' && availTo === '23:59';

  // Flip between "all day" and a sensible default (8am-8pm) when the
  // host toggles the switch.
  const toggleAllDay = () => {
    if (allDay) {
      setAvailFrom('08:00');
      setAvailTo('20:00');
    } else {
      setAvailFrom('00:00');
      setAvailTo('23:59');
    }
  };

  // Places Autocomplete state.
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  // Ref for the debounce timer - one in flight at a time.
  const debounceRef = useRef(null);
  // Cache the AutocompleteService so we don't recreate it on every keystroke.
  const autocompleteRef = useRef(null);

  // Lazy init - the Maps SDK might not be loaded yet, so check before use.
  const getAutocomplete = () => {
    if (!autocompleteRef.current && window.google?.maps?.places) {
      autocompleteRef.current = new window.google.maps.places.AutocompleteService();
    }
    return autocompleteRef.current;
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setNewAddress(value);
    // If the host edits the text after picking a suggestion, the coords
    // no longer match - clear them so we fall back to geocoding on publish.
    setNewCoords(null);

    // Debounce. Places API calls aren't free, so we wait 300ms after the
    // last keystroke before firing.
    clearTimeout(debounceRef.current);
    if (!value.trim()) { setSuggestions([]); setShowDropdown(false); return; }

    debounceRef.current = setTimeout(() => {
      const svc = getAutocomplete();
      if (!svc) return;
      svc.getPlacePredictions(
        { input: value, componentRestrictions: { country: 'gb' } }, // GB only
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setSuggestions(results);
            setShowDropdown(true);
          } else {
            setSuggestions([]);
            setShowDropdown(false);
          }
        }
      );
    }, 300);
  };

  // User tapped a suggestion. We've got a place_id but still need the
  // actual lat/lng - that's what the Geocoder call is for.
  const selectSuggestion = (prediction) => {
    setShowDropdown(false);
    setSuggestions([]);
    setNewAddress(prediction.description);

    if (window.google?.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const loc = results[0].geometry.location;
          setNewCoords({ lat: loc.lat(), lng: loc.lng() });
          // Replace the free text with Google's cleaned-up formatted address
          setNewAddress(results[0].formatted_address);
        }
      });
    }
  };

  // Kill any pending debounce timer if this component unmounts mid-typing.
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  return (
    <div className="screen" style={{ overflowY: 'auto' }}>
      {/* Top bar */}
      <div className="checkout-header" style={{ marginTop: 10 }}>
        <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
        <h2 className="checkout-title">List Your Driveway</h2>
      </div>

      {/* Blue info banner - reminder of what's allowed */}
      <div style={{ background: '#E6F0FF', borderRadius: 12, padding: '10px 14px', margin: '0 0 12px', fontSize: 13, color: '#0056D2', fontWeight: 500 }}>
        🏠 Driveways and private parking spaces only — commercial garages and car parks are not permitted.
      </div>

      <form onSubmit={onSubmit}>
        {/* Hidden file input triggered by clicking the big photo box */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={onImageUpload}
          style={{ display: 'none' }}
        />

        {/* Photo picker box. Client-side compression happens in useHost.handleImageUpload */}
        <div className="photo-upload-box" onClick={() => fileInputRef.current.click()}>
          {newImage ? (
            <img src={newImage} alt="Driveway Preview" className="photo-preview" />
          ) : (
            <>
              <Camera size={32} style={{ marginBottom: 8 }} />
              <span>Tap to upload a photo</span>
            </>
          )}
        </div>

        {/* Address field with Places Autocomplete dropdown */}
        <div className="form-section">
          <div className="input-label">Address (or Postcode)</div>
          <div style={{ position: 'relative' }}>
            <div className="ios-input-group" style={{ marginBottom: 0 }}>
              <div className="ios-input-row">
                <MapPin size={20} color="#8E8E93" />
                <input
                  className="ios-input"
                  placeholder="e.g. 10 Downing Street, London"
                  value={newAddress}
                  onChange={handleAddressChange}
                  // Delay hiding the dropdown so a click on a suggestion still fires
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            {/* Autocomplete dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div className="search-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000 }}>
                <div className="dropdown-header">Results</div>
                {suggestions.map((pred) => (
                  <div
                    key={pred.place_id}
                    className="search-suggestion"
                    // preventDefault stops the input blurring before the click lands
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectSuggestion(pred)}
                  >
                    <div className="suggestion-icon">
                      <MapPin size={16} color="#0056D2" />
                    </div>
                    <div>
                      <div className="suggestion-text">{pred.structured_formatting.main_text}</div>
                      <div className="suggestion-subtext">{pred.structured_formatting.secondary_text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hourly rate field */}
        <div className="form-section">
          <div className="input-label">Hourly Rate (£)</div>
          <div className="ios-input-group" style={{ marginBottom: 0 }}>
            <div className="ios-input-row">
              <span style={{ color: '#8E8E93', fontSize: 17, fontWeight: 500 }}>£</span>
              <input className="ios-input" type="number" step="0.10" placeholder="5.00" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required />
            </div>
          </div>
        </div>

        {/* Availability hours block */}
        <div className="form-section">
          <div className="input-label">Availability Hours</div>
          <div className="ios-input-group" style={{ marginBottom: 0 }}>
            {/* "All day" toggle row */}
            <div className="ios-input-row" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontSize: 16, color: '#1C1C1E' }}>All day</span>
              {/* Custom iOS-style toggle switch */}
              <div
                onClick={toggleAllDay}
                style={{
                  width: 50, height: 30,
                  background: allDay ? '#34C759' : '#E5E5EA',
                  borderRadius: 30, position: 'relative', cursor: 'pointer', transition: '0.3s',
                }}
              >
                <div style={{
                  width: 26, height: 26, background: '#fff',
                  borderRadius: '50%', position: 'absolute',
                  top: 2, transition: '0.3s',
                  left: allDay ? 22 : 2,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                }} />
              </div>
            </div>

            {/* From / To time pickers - hidden while "all day" is on */}
            {!allDay && (
              <>
                <div className="ios-input-row" style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 15, color: '#3C3C43' }}>From</span>
                  <input
                    type="time"
                    value={availFrom}
                    onChange={(e) => setAvailFrom(e.target.value)}
                    style={{ border: 'none', outline: 'none', fontSize: 15, color: '#0056D2', fontWeight: 600, background: 'transparent', cursor: 'pointer' }}
                  />
                </div>
                <div className="ios-input-row" style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 15, color: '#3C3C43' }}>To</span>
                  <input
                    type="time"
                    value={availTo}
                    onChange={(e) => setAvailTo(e.target.value)}
                    style={{ border: 'none', outline: 'none', fontSize: 15, color: '#0056D2', fontWeight: 600, background: 'transparent', cursor: 'pointer' }}
                  />
                </div>
              </>
            )}

            {/* "24 hours" summary when all-day is on */}
            {allDay && (
              <div className="ios-input-row" style={{ color: '#8E8E93', fontSize: 14 }}>
                Driveway is available 24 hours
              </div>
            )}
          </div>
          {!allDay && (
            <p style={{ margin: '6px 0 0 4px', fontSize: 12, color: '#8E8E93' }}>
              Available {formatTime12(availFrom)} – {formatTime12(availTo)}
            </p>
          )}
        </div>

        {/* Publish button - spinner + disabled state while saving */}
        <button className="primary-btn" type="submit" disabled={isLoading} style={{ marginTop: '40px', opacity: isLoading ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {isLoading ? <><Spinner /> Publishing…</> : 'Publish Listing'}
        </button>
      </form>
    </div>
  );
};

export default AddSpotView;
