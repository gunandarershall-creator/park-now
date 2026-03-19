/**
 * CONTROLLER: useSpots.js
 * Manages parking spots state, Leaflet map lifecycle, search, and geolocation.
 * Depends on: SpotModel, user from useAuth
 */

import { useState, useEffect, useRef } from 'react';
import { subscribeToSpots } from '../models/spotModel';
import { sortSpotsByProximity } from '../models/geoModel';

const DEFAULT_SPOTS = [
  { id: '1', lat: 51.4039, lng: -0.3035, price: 4.50, address: 'Kingston University', rating: 4.8, distance: 'Kingston upon Thames', spotsLeft: 3, hostId: 'system', imageUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=400&q=80' },
  { id: '2', lat: 51.4045, lng: -0.3015, price: 6.00, address: 'Penrhyn Road', rating: 4.5, distance: 'Surbiton, Surrey', spotsLeft: 1, hostId: 'system', imageUrl: 'https://images.unsplash.com/photo-1604063154567-b5b8219df515?auto=format&fit=crop&w=400&q=80' },
  { id: '3', lat: 51.4085, lng: -0.3060, price: 5.25, address: 'High St Garage', rating: 4.9, distance: 'Kingston City Centre', spotsLeft: 8, hostId: 'system', imageUrl: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=400&q=80' }
];

const ALL_SUGGESTIONS = [
  { title: 'Surbiton Station', subtext: 'Victoria Rd, Surbiton', lat: 51.3943, lng: -0.3023, isRecent: true },
  { title: 'KT1 2EE', subtext: 'Kingston upon Thames', lat: 51.4111, lng: -0.3005, isRecent: true },
  { title: 'Richmond Park', subtext: 'Richmond, London', lat: 51.4427, lng: -0.2719, isRecent: true },
  { title: 'St Albans', subtext: 'Hertfordshire', lat: 51.7520, lng: -0.3394, isRecent: false },
  { title: 'Albert Bridge', subtext: 'London', lat: 51.4822, lng: -0.1681, isRecent: false },
  { title: 'Albany Park', subtext: 'Bexley, London', lat: 51.4355, lng: 0.1247, isRecent: false },
  { title: 'SW19 5AG', subtext: 'Wimbledon, London', lat: 51.4255, lng: -0.2078, isRecent: false },
  { title: 'Wimbledon Center', subtext: 'Wimbledon, London', lat: 51.4214, lng: -0.2074, isRecent: false },
  { title: 'Jakarta', subtext: 'Indonesia', lat: -6.2088, lng: 106.8456, isRecent: false },
];

export const useSpots = (user, currentScreen, showToast) => {
  const [spots, setSpots] = useState(DEFAULT_SPOTS);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [liveToastMessage, setLiveToastMessage] = useState(null);
  const mapContainerRef = useRef(null);

  const searchSuggestions = searchQuery.trim() === ''
    ? ALL_SUGGESTIONS.filter(i => i.isRecent)
    : ALL_SUGGESTIONS.filter(i =>
        i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.subtext.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Sync live spots from Firestore + merge with defaults
  // If driver location is already known, enrich with real distances immediately
  useEffect(() => {
    setSpots(DEFAULT_SPOTS);
    if (!user) return;
    try {
      const unsubscribe = subscribeToSpots((cloudDocs) => {
        const merged = [...DEFAULT_SPOTS, ...cloudDocs];
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

  // Leaflet map lifecycle
  useEffect(() => {
    if (currentScreen !== 'map') return;

    const initLeafletMap = () => {
      if (!mapContainerRef.current) return;
      if (window.mapInstance) {
        window.mapInstance.remove();
        window.mapInstance = null;
      }
      window.mapInstance = window.L.map(mapContainerRef.current, { zoomControl: false })
        .setView([51.4060, -0.3040], 15);
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(window.mapInstance);
      setSpots(prev => [...prev]);
    };

    if (!window.L) {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (!document.getElementById('leaflet-script')) {
        const script = document.createElement('script');
        script.id = 'leaflet-script';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.crossOrigin = "anonymous";
        script.onload = initLeafletMap;
        document.head.appendChild(script);
      } else {
        document.getElementById('leaflet-script').addEventListener('load', initLeafletMap);
      }
    } else {
      initLeafletMap();
    }

    return () => {
      if (window.mapInstance) {
        window.mapInstance.remove();
        window.mapInstance = null;
        window.markerLayer = null;
      }
    };
  }, [currentScreen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update map markers when spots/selection change
  useEffect(() => {
    if (!window.mapInstance || !window.L || currentScreen !== 'map') return;
    if (window.markerLayer) window.mapInstance.removeLayer(window.markerLayer);

    const newLayer = window.L.layerGroup().addTo(window.mapInstance);
    window.markerLayer = newLayer;

    spots.filter(s => s.spotsLeft > 0).forEach(spot => {
      const isSelected = selectedSpot?.id === spot.id;
      const icon = window.L.divIcon({
        className: 'custom-leaflet-icon',
        html: `<div class="price-marker ${isSelected ? 'active' : ''}">£${spot.price.toFixed(2)}</div>`,
        iconSize: [60, 30],
        iconAnchor: [30, 30]
      });
      const marker = window.L.marker([spot.lat, spot.lng], { icon }).addTo(newLayer);
      marker.on('click', () => {
        setSelectedSpot(spot);
        window.mapInstance.flyTo([spot.lat, spot.lng], 16, { duration: 0.5 });
      });
    });

    if (driverLocation) {
      const dIcon = window.L.divIcon({
        className: 'custom-leaflet-icon',
        html: `<div class="driver-dot"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });
      window.L.marker([driverLocation.lat, driverLocation.lng], { icon: dIcon }).addTo(newLayer);
    }
  }, [spots, selectedSpot, driverLocation, currentScreen]);

  // Live toast notification simulation
  useEffect(() => {
    let timeoutId;
    if (currentScreen === 'map' && spots.length >= 3) {
      timeoutId = setTimeout(() => {
        if (selectedSpot && selectedSpot.id === '2') setSelectedSpot(null);
        setLiveToastMessage("Someone just booked Penrhyn Road");
        setTimeout(() => setLiveToastMessage(null), 4000);
      }, 8000);
    }
    return () => clearTimeout(timeoutId);
  }, [currentScreen, spots.length, selectedSpot]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setIsSearchFocused(false);
        if (window.mapInstance) {
          window.mapInstance.flyTo([parseFloat(data[0].lat), parseFloat(data[0].lon)], 13, { duration: 1.5 });
        }
      } else {
        showToast(`Could not find: ${searchQuery}`, 'error');
      }
    } catch (error) {
      showToast('Error connecting to the geocoding service.', 'error');
    }
  };

  const findClosestSpot = () => {
    if (!("geolocation" in navigator)) { showToast('Geolocation is not supported by your browser', 'error'); return; }

    const applyProximity = (loc) => {
      setDriverLocation(loc);

      // Haversine sort: enrich all spots with real distances, nearest first
      const sorted = sortSpotsByProximity(spots, loc);
      setSpots(sorted);

      if (window.mapInstance) {
        // Fly to driver first, then pan to closest spot
        window.mapInstance.flyTo([loc.lat, loc.lng], 15, { duration: 1.2 });
        const closest = sorted[0];
        if (closest) {
          setTimeout(() => {
            setSelectedSpot(closest);
            window.mapInstance.flyTo([closest.lat, closest.lng], 16, { duration: 0.8 });
          }, 1400);
        }
      }
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        applyProximity({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        // Fallback: simulate driver location at Kingston University
        applyProximity({ lat: 51.4055, lng: -0.3030 });
      }
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
    mapContainerRef,
    handleSearch,
    findClosestSpot,
  };
};
