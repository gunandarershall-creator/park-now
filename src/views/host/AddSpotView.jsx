/**
 * VIEW: AddSpotView.jsx
 * Form screen for listing a new parking driveway.
 * Address input uses Google Places Autocomplete.
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, MapPin } from 'lucide-react';

const Spinner = () => (
  <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
);

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
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Lazily initialise AutocompleteService once Google Maps is loaded
  const getAutocomplete = () => {
    if (!autocompleteRef.current && window.google?.maps?.places) {
      autocompleteRef.current = new window.google.maps.places.AutocompleteService();
    }
    return autocompleteRef.current;
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setNewAddress(value);
    setNewCoords(null); // clear resolved coords when user edits text

    clearTimeout(debounceRef.current);
    if (!value.trim()) { setSuggestions([]); setShowDropdown(false); return; }

    debounceRef.current = setTimeout(() => {
      const svc = getAutocomplete();
      if (!svc) return;
      svc.getPlacePredictions(
        { input: value, componentRestrictions: { country: 'gb' } },
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

  const selectSuggestion = (prediction) => {
    setShowDropdown(false);
    setSuggestions([]);
    setNewAddress(prediction.description);

    // Resolve lat/lng via Geocoder
    if (window.google?.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const loc = results[0].geometry.location;
          setNewCoords({ lat: loc.lat(), lng: loc.lng() });
          setNewAddress(results[0].formatted_address);
        }
      });
    }
  };

  // Cleanup debounce on unmount
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  return (
    <div className="screen" style={{ overflowY: 'auto' }}>
      <div className="checkout-header" style={{ marginTop: 10 }}>
        <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
        <h2 className="checkout-title">List Driveway</h2>
      </div>

      <form onSubmit={onSubmit}>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={onImageUpload}
          style={{ display: 'none' }}
        />

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
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            {showDropdown && suggestions.length > 0 && (
              <div className="search-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000 }}>
                <div className="dropdown-header">Results</div>
                {suggestions.map((pred) => (
                  <div
                    key={pred.place_id}
                    className="search-suggestion"
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

        <div className="form-section">
          <div className="input-label">Hourly Rate (£)</div>
          <div className="ios-input-group" style={{ marginBottom: 0 }}>
            <div className="ios-input-row">
              <span style={{ color: '#8E8E93', fontSize: 17, fontWeight: 500 }}>£</span>
              <input className="ios-input" type="number" step="0.10" placeholder="5.00" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required />
            </div>
          </div>
        </div>

        <button className="primary-btn" type="submit" disabled={isLoading} style={{ marginTop: '40px', opacity: isLoading ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {isLoading ? <><Spinner /> Publishing…</> : 'Publish Listing'}
        </button>
      </form>
    </div>
  );
};

export default AddSpotView;
