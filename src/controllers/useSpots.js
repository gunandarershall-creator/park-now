/**
 * CONTROLLER: useSpots.js
 * Manages parking spots state, Google Maps lifecycle, search, and geolocation.
 * Depends on: SpotModel, GeoModel, user from useAuth
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { subscribeToSpots } from '../models/spotModel';
import { subscribeToBookings } from '../models/bookingModel';
import { sortSpotsByProximity } from '../models/geoModel';

// Stable libraries array — must not be inline to avoid Google Maps reload warnings
export const GOOGLE_MAPS_LIBRARIES = ['places'];

const DEFAULT_SPOTS = [
  { id: '1', lat: 51.4039, lng: -0.3035, price: 4.50, address: 'Kingston University', rating: 4.8, distance: 'Kingston upon Thames', spotsLeft: 3, hostId: 'system', imageUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=400&q=80' },
  { id: '2', lat: 51.4045, lng: -0.3015, price: 6.00, address: 'Penrhyn Road', rating: 4.5, distance: 'Surbiton, Surrey', spotsLeft: 1, hostId: 'system', imageUrl: 'https://images.unsplash.com/photo-1604063154567-b5b8219df515?auto=format&fit=crop&w=400&q=80' },
  { id: '3', lat: 51.4085, lng: -0.3060, price: 5.25, address: 'High St Garage', rating: 4.9, distance: 'Kingston City Centre', spotsLeft: 8, hostId: 'system', imageUrl: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=400&q=80' }
];

const getRecentSearches = () => {
  try { return JSON.parse(localStorage.getItem('parkNowRecents') || '[]'); }
  catch { return []; }
};

const saveRecentSearch = (item) => {
  try {
    const recents = getRecentSearches();
    const filtered = recents.filter(r => r.title !== item.title);
    const updated = [{ title: item.title, subtext: item.subtext, lat: item.lat, lng: item.lng }, ...filtered].slice(0, 5);
    localStorage.setItem('parkNowRecents', JSON.stringify(updated));
  } catch {}
};

export const useSpots = (user, currentScreen, showToast) => {
  const [spots, setSpots] = useState(DEFAULT_SPOTS);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [liveToastMessage, setLiveToastMessage] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 51.4060, lng: -0.3040 });
  const [mapZoom, setMapZoom] = useState(15);
  const [searchSuggestions, setSearchSuggestions] = useState(getRecentSearches);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const geocoderRef = useRef(null);

  // Ensure geocoder is always available once Google Maps loads
  const ensureGeocoderReady = () => {
    if (!geocoderRef.current && window.google?.maps) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
    if (!autocompleteServiceRef.current && window.google?.maps?.places) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
    }
  };

  // Called when Google Map instance is ready
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    ensureGeocoderReady();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigate the Google Map — update both React state and imperative API
  const panTo = useCallback((lat, lng, zoom = 14) => {
    setMapCenter({ lat, lng });
    setMapZoom(zoom);
    if (mapRef.current) {
      mapRef.current.setCenter({ lat, lng });
      mapRef.current.setZoom(zoom);
    }
  }, []);

  // Sync live spots from Firestore + merge with defaults
  useEffect(() => {
    setSpots(DEFAULT_SPOTS);
    if (!user) return;
    try {
      const unsubscribe = subscribeToSpots((cloudDocs) => {
        const merged = [...DEFAULT_SPOTS, ...cloudDocs.filter(s => s.isActive !== false)];
        setDriverLocation(prev => {
          if (prev) {
            setSpots(sortSpotsByProximity(merged, prev));
          } else {
            setSpots(merged);
          }
          return prev;
        });
      }, (err) => console.error("Spots sync error:", err));
      return () => unsubscribe();
    } catch (e) {
      console.error("Firestore Spots Error:", e);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live toast — fires when a real booking lands in Firestore
  useEffect(() => {
    const seenIds = new Set();
    let initialised = false;

    const unsubscribe = subscribeToBookings((docs) => {
      if (!initialised) {
        docs.forEach(d => seenIds.add(d.id));
        initialised = true;
        return;
      }
      docs.forEach(booking => {
        if (!seenIds.has(booking.id)) {
          seenIds.add(booking.id);
          const age = Date.now() - new Date(booking.timestamp).getTime();
          if (currentScreen === 'map' && age < 30000) {
            setLiveToastMessage(`Someone just booked ${booking.address}`);
            setTimeout(() => setLiveToastMessage(null), 4000);
          }
        }
      });
    }, (err) => console.warn('Live booking listener error:', err));

    return () => unsubscribe();
  }, [currentScreen]);

  // Fetch real Google Places predictions as user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions(getRecentSearches());
      return;
    }

    ensureGeocoderReady();
    if (!autocompleteServiceRef.current) return;

    const timer = setTimeout(() => {
      autocompleteServiceRef.current.getPlacePredictions(
        { input: searchQuery },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSearchSuggestions(predictions.map(p => ({
              title: p.structured_formatting.main_text,
              subtext: p.structured_formatting.secondary_text || '',
              placeId: p.place_id,
            })));
          } else {
            setSearchSuggestions([]);
          }
        }
      );
    }, 200); // debounce 200ms

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Navigate to a selected suggestion by placeId or lat/lng
  const selectSuggestion = useCallback(async (item) => {
    setSearchQuery(item.title);
    setIsSearchFocused(false);

    // Recent search — has lat/lng already
    if (item.lat && item.lng) {
      panTo(item.lat, item.lng, 14);
      saveRecentSearch(item);
      return;
    }

    // Places suggestion — geocode via REST using placeId
    if (item.placeId) {
      const key = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${item.placeId}&key=${key}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.status === 'OK' && data.results[0]) {
          const loc = data.results[0].geometry.location;
          panTo(loc.lat, loc.lng, 14);
          saveRecentSearch({ title: item.title, subtext: item.subtext, lat: loc.lat, lng: loc.lng });
        }
      } catch (err) {
        console.error('Geocode error:', err);
      }
    }
  }, [panTo]);

  const geocodeAddress = async (address) => {
    const key = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'OK' && data.results[0]) {
      const loc = data.results[0].geometry.location;
      return {
        lat: loc.lat,
        lng: loc.lng,
        title: data.results[0].address_components[0]?.long_name || address,
        subtext: data.results[0].formatted_address,
      };
    }
    return null;
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchFocused(false);

    // Use first Places suggestion if available (click-selected)
    if (searchSuggestions.length > 0 && searchSuggestions[0].placeId) {
      selectSuggestion(searchSuggestions[0]);
      return;
    }

    // Direct REST geocode — works regardless of window.google timing
    const result = await geocodeAddress(searchQuery);
    if (result) {
      panTo(result.lat, result.lng, 13);
      saveRecentSearch(result);
    } else {
      showToast(`Could not find: ${searchQuery}`, 'error');
    }
  };

  const findClosestSpot = () => {
    if (!("geolocation" in navigator)) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    setIsLocating(true);

    const applyProximity = (loc) => {
      setIsLocating(false);
      setDriverLocation(loc);
      const sorted = sortSpotsByProximity(spots, loc);
      setSpots(sorted);
      panTo(loc.lat, loc.lng, 15);
      const closest = sorted[0];
      if (closest) {
        setTimeout(() => {
          setSelectedSpot(closest);
          panTo(closest.lat, closest.lng, 16);
        }, 1000);
      }
    };

    // Phase 1: fast network/WiFi location (instant)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        applyProximity({ lat: position.coords.latitude, lng: position.coords.longitude });
        // Phase 2: silently refine with GPS in background
        navigator.geolocation.getCurrentPosition(
          (precise) => applyProximity({ lat: precise.coords.latitude, lng: precise.coords.longitude }),
          () => {},
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      },
      () => {
        setIsLocating(false);
        showToast('Could not get your location — showing nearest Kingston spots', 'info');
        applyProximity({ lat: 51.4055, lng: -0.3030 });
      },
      { enableHighAccuracy: false, timeout: 3000, maximumAge: 30000 }
    );
  };

  return {
    spots, setSpots,
    selectedSpot, setSelectedSpot,
    driverLocation, setDriverLocation,
    searchQuery, setSearchQuery,
    isSearchFocused, setIsSearchFocused,
    searchSuggestions,
    liveToastMessage,
    mapRef,
    onMapLoad,
    mapCenter,
    mapZoom,
    panTo,
    handleSearch,
    selectSuggestion,
    findClosestSpot,
    isLocating,
  };
};
