// ============================================================================
//  CONTROLLER: useSpots.js - parking spots, maps, search, geolocation
// ============================================================================
//  The other big hook. It owns:
//
//    - The list of spots shown on the map (real Firestore ones + the
//      five demo seed spots in Kingston)
//    - Google Maps instance lifecycle (map handle, panning, zooming)
//    - Search bar: Places autocomplete, REST geocoding fallback,
//      recent-search memory in localStorage
//    - Geolocation: "find my nearest spot" with a fast two-phase
//      fix (network first, GPS refinement in the background)
//    - A live toast that fires when another driver books somewhere
//      nearby (social proof)
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { subscribeToSpots } from '../models/spotModel';
import { subscribeToBookings } from '../models/bookingModel';
import { sortSpotsByProximity } from '../models/geoModel';

// This array has to be defined at module scope, not inline inside the
// component. The Google Maps library does a === comparison on it and
// rebuilding it every render would cause it to reload, which is slow
// and logs a warning.
export const GOOGLE_MAPS_LIBRARIES = ['places'];


// ─── Demo seed spots ─────────────────────────────────────────────────────────
// Five hand-picked Kingston-upon-Thames listings so the map has
// something to show before the user has signed in, and so examiners
// have something to book during the demo without needing a real host
// to have listed first.
const DEFAULT_SPOTS = [
  {
    id: '1',
    lat: 51.4039, lng: -0.3035,
    price: 4.50,
    address: '53 Penrhyn Road, Kingston upon Thames, KT1 2EE',
    rating: 4.8,
    distance: 'Kingston upon Thames',
    spotsLeft: 2,
    hostId: 'system',
    availFrom: '07:00', availTo: '20:00',
    imageUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '2',
    lat: 51.4061, lng: -0.3008,
    price: 3.50,
    address: '12 Fassett Road, Kingston upon Thames, KT1 2TQ',
    rating: 4.6,
    distance: 'Kingston upon Thames',
    spotsLeft: 1,
    hostId: 'system',
    availFrom: '08:00', availTo: '18:00',
    imageUrl: 'https://images.unsplash.com/photo-1604063154567-b5b8219df515?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '3',
    lat: 51.4085, lng: -0.3060,
    price: 5.00,
    address: '8 Brook Street, Kingston upon Thames, KT1 2AT',
    rating: 4.9,
    distance: 'Kingston Town Centre',
    spotsLeft: 3,
    hostId: 'system',
    availFrom: '00:00', availTo: '23:59',
    imageUrl: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '4',
    lat: 51.4022, lng: -0.2991,
    price: 2.50,
    address: '27 Villiers Road, Kingston upon Thames, KT1 3BA',
    rating: 4.3,
    distance: 'Norbiton',
    spotsLeft: 4,
    hostId: 'system',
    availFrom: '09:00', availTo: '17:00',
    imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '5',
    lat: 51.4101, lng: -0.3041,
    price: 6.00,
    address: '3 London Road, Kingston upon Thames, KT2 6ND',
    rating: 5.0,
    distance: 'Kingston upon Thames',
    spotsLeft: 1,
    hostId: 'system',
    availFrom: '00:00', availTo: '23:59',
    imageUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=400&q=80'
  },
];


// ─── Recent search memory ───────────────────────────────────────────────────
// Persisted to localStorage so "recent searches" survive a page refresh.
// The try/catch handles the (rare) case of corrupted JSON in storage.
const getRecentSearches = () => {
  try { return JSON.parse(localStorage.getItem('parkNowRecents') || '[]'); }
  catch { return []; }
};

const saveRecentSearch = (item) => {
  try {
    const recents = getRecentSearches();
    // De-dupe by title, then prepend and cap at 5.
    const filtered = recents.filter(r => r.title !== item.title);
    const updated = [{ title: item.title, subtext: item.subtext, lat: item.lat, lng: item.lng }, ...filtered].slice(0, 5);
    localStorage.setItem('parkNowRecents', JSON.stringify(updated));
  } catch {}
};


export const useSpots = (user, currentScreen, showToast) => {
  // All state this hook owns.
  const [spots, setSpots] = useState(DEFAULT_SPOTS);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [liveToastMessage, setLiveToastMessage] = useState(null);
  // Default map centre = roughly Kingston town centre.
  const [mapCenter, setMapCenter] = useState({ lat: 51.4060, lng: -0.3040 });
  const [mapZoom, setMapZoom] = useState(15);
  const [searchSuggestions, setSearchSuggestions] = useState(getRecentSearches);
  const [isLocating, setIsLocating] = useState(false);

  // Refs to Google Maps objects. Using refs not state because changing
  // them shouldn't trigger a rerender.
  const mapRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const geocoderRef = useRef(null);


  // Lazy-init Google Maps service objects the first time we need them.
  // Can't init at module load because the Google Maps script hasn't
  // loaded yet. We check window.google.maps existence each time.
  const ensureGeocoderReady = () => {
    if (!geocoderRef.current && window.google?.maps) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
    if (!autocompleteServiceRef.current && window.google?.maps?.places) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
    }
  };


  // Callback passed to <GoogleMap onLoad={...}> so we grab a handle
  // to the map instance once Google Maps finishes initialising.
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    ensureGeocoderReady();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  // Programmatically pan the map to a new centre and zoom. Updates
  // both React state (so the next render is consistent) and calls
  // the imperative API (so the move is instant, no wait for rerender).
  const panTo = useCallback((lat, lng, zoom = 14) => {
    setMapCenter({ lat, lng });
    setMapZoom(zoom);
    if (mapRef.current) {
      mapRef.current.setCenter({ lat, lng });
      mapRef.current.setZoom(zoom);
    }
  }, []);


  // ─── Live sync of spots from Firestore ────────────────────────────────
  // Merge strategy: always show demo seed spots + whatever real spots
  // are isActive !== false in Firestore. If the driver has a known
  // location, sort by proximity at merge time.
  useEffect(() => {
    setSpots(DEFAULT_SPOTS);
    if (!user) return;
    try {
      const unsubscribe = subscribeToSpots((cloudDocs) => {
        const merged = [...DEFAULT_SPOTS, ...cloudDocs.filter(s => s.isActive !== false)];
        setDriverLocation(prev => {
          // Using the setter's functional form to read driverLocation
          // without adding it as a dependency of this effect, which
          // would cause it to resubscribe on every location change.
          if (prev) {
            setSpots(sortSpotsByProximity(merged, prev));
          } else {
            setSpots(merged);
          }
          return prev;
        });
      }, (err) => {
        console.error("Spots sync error:", err);
        // Common first-time gotcha: security rules haven't been
        // deployed. Give a specific hint.
        if (err?.code === 'permission-denied') {
          showToast(
            'Firestore rules not applied - go to Firebase Console > Firestore > Rules and publish the project rules.',
            'error'
          );
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Firestore Spots Error:", e);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps


  // ─── Social-proof live toast ──────────────────────────────────────────
  // When another driver books somewhere, I want to show a little
  // "someone just booked Kingston Road" banner on the map. The trick
  // is distinguishing a genuinely NEW booking from the ones we get
  // delivered at first-subscribe time. So on the first callback I
  // just record every id I've seen. Any id not in that set on a later
  // callback must be genuinely new, and if it's less than 30s old and
  // the user is on the map, I show the toast.
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


  // ─── Search autocomplete ──────────────────────────────────────────────
  // Debounced by 200ms so we don't fire an API call on every keystroke.
  // When the query is empty, show recent searches instead.
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
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);


  // ─── User picks a suggestion ──────────────────────────────────────────
  const selectSuggestion = useCallback(async (item) => {
    setSearchQuery(item.title);
    setIsSearchFocused(false);

    // Recent search - lat/lng already known.
    if (item.lat && item.lng) {
      panTo(item.lat, item.lng, 14);
      saveRecentSearch(item);
      return;
    }

    // Places suggestion - need to geocode the placeId to lat/lng.
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
        showToast('Could not find that location. Check your internet connection and try again.', 'error');
      }
    }
  }, [panTo, showToast]);


  // Geocode a free-text address to lat/lng. Used when the user hits
  // Enter instead of picking an autocomplete suggestion.
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


  // Search form submit handler. Prefer the first autocomplete
  // suggestion if there is one, else fall back to REST geocode.
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchFocused(false);

    if (searchSuggestions.length > 0 && searchSuggestions[0].placeId) {
      selectSuggestion(searchSuggestions[0]);
      return;
    }

    const result = await geocodeAddress(searchQuery);
    if (result) {
      panTo(result.lat, result.lng, 13);
      saveRecentSearch(result);
    } else {
      showToast(`Could not find: ${searchQuery}`, 'error');
    }
  };


  // ─── "Find me the nearest spot" ───────────────────────────────────────
  // Two-phase geolocation:
  //   Phase 1: fast network/WiFi fix (usually < 1s, accuracy ~100m).
  //            Sort the list by proximity and pan the map immediately.
  //   Phase 2: GPS fix running in the background (up to 10s, accuracy
  //            ~5-10m). Re-sort silently once it arrives.
  // This gives a snappy UI without sacrificing accuracy.
  //
  // If geolocation fails entirely (user denied permission, browser
  // doesn't support it, timeout), fall back to Kingston town centre.
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
        // After a brief pause, auto-select the closest spot so its
        // details popup opens. Pause so the map pan settles first.
        setTimeout(() => {
          setSelectedSpot(closest);
          panTo(closest.lat, closest.lng, 16);
        }, 1000);
      }
    };

    // Phase 1: fast, low-accuracy fix.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        applyProximity({ lat: position.coords.latitude, lng: position.coords.longitude });
        // Phase 2: silent high-accuracy fix in the background.
        navigator.geolocation.getCurrentPosition(
          (precise) => applyProximity({ lat: precise.coords.latitude, lng: precise.coords.longitude }),
          () => {},
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      },
      () => {
        // Both phases failed. Fall back to Kingston centre.
        setIsLocating(false);
        showToast('Could not get your location - showing nearest Kingston spots', 'info');
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
