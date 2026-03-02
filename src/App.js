/**
 * PROJECT: Park Now - Application
 * COMMIT: 21 (Real Interactive Map & Live Geolocation)
 * DESCRIPTION: Integrates a real, interactive world map using Leaflet CDN to avoid build errors. Uses HTML5 Geolocation for real-world GPS tracking.
 * NOTE: All previous comments and logic are preserved. New additions are marked with "Commit X".
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Mail, Lock, Menu, User, Star, X, ArrowLeft, CreditCard, Navigation, Timer, QrCode, Plus, Home, Settings, Camera, ChevronRight, ShieldCheck, LogOut, Car } from 'lucide-react';

/**
 * CSS STYLES (Internal Stylesheet)
 */
const styles = `
  /* Reset default browser margins and set background to black */
  body { margin: 0; padding: 0; background: #000; }
  
  /* The Main App Container - Simulates an iPhone 14 Pro dimensions */
  .app-frame { max-width: 420px; height: 95vh; margin: 2vh auto; background: #ffffff; border-radius: 40px; border: 12px solid #1a1a1a; overflow: hidden; position: relative; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; }
  
  /* The Content Screen inside the phone */
  .screen { height: 100%; display: flex; flex-direction: column; background: #F2F2F7; padding: 20px; box-sizing: border-box; position: relative; flex: 1; overflow: hidden; }
  
  /* Header Section Styling */
  .login-header { margin-top: 60px; text-align: center; margin-bottom: 40px; }
  
  /* Logo Styling - The Blue Box */
  .app-logo { width: 80px; height: 80px; background: #0056D2; border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px rgba(0,86,210,0.3); }
  
  /* Input Group Container - Grouped style like iOS Settings */
  .ios-input-group { background: white; border-radius: 12px; overflow: hidden; margin-bottom: 25px; }
  
  /* Individual Input Row */
  .ios-input-row { display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #E5E5EA; }
  .ios-input-row:last-child { border-bottom: none; }
  
  /* The actual typing field */
  .ios-input { border: none; outline: none; font-size: 17px; flex: 1; margin-left: 10px; }
  
  /* Main Action Button */
  .primary-btn { background: #0056D2; color: white; border: none; width: 100%; padding: 16px; border-radius: 14px; font-size: 17px; font-weight: 600; cursor: pointer; }
  
  /* 1. Forgot Password Button (Transparent "Ghost" Button) */
  .secondary-btn { background: transparent; color: #0056D2; border: none; width: 100%; padding: 10px; margin-top: 10px; font-size: 15px; font-weight: 500; cursor: pointer; }
  
  /* 2. Sign Up Area (Pushed to the bottom of the screen) */
  .signup-area { margin-top: auto; margin-bottom: 20px; text-align: center; font-size: 15px; color: #8E8E93; }
  
  /* 3. The "Create Account" Link */
  .signup-link { color: #0056D2; font-weight: 600; border: none; background: none; cursor: pointer; font-size: 15px; padding: 0; margin-left: 5px; }

  /* --- MAP UI STYLES --- */
  /* NEW (Commit 21): Boosted Z-Indexes to sit above the Leaflet map */
  .search-header { position: absolute; top: 20px; left: 20px; right: 20px; z-index: 3000 !important; display: flex; gap: 10px; align-items: center; }
  .search-input { flex: 1; background: white; padding: 12px 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 8px; font-weight: 500; }
  .icon-btn { background: white; border-radius: 50%; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; }
  
  /* NEW (Commit 21): Real Leaflet Map Container */
  #real-map { width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 0; background-color: #E2E2E0; }
  
  /* Airbnb-style Price Marker overrides for Leaflet */
  .custom-leaflet-icon { background: transparent; border: none; display: flex; justify-content: center; align-items: flex-end; }
  .price-marker { background: white; border-radius: 20px; padding: 6px 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); border: 1px solid #ddd; display: flex; justify-content: center; align-items: center; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer; position: relative; }
  .price-marker.active { transform: scale(1.15); background: #0056D2; color: white; border-color: #0056D2; z-index: 20; }
  .price-marker::after { content: ''; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); border-width: 6px 6px 0; border-style: solid; border-color: white transparent transparent transparent; }
  .price-marker.active::after { border-color: #0056D2 transparent transparent transparent; }

  /* --- BOTTOM SHEET STYLES --- */
  .bottom-sheet { position: absolute; bottom: 0; left: 0; right: 0; background: white; border-radius: 24px 24px 0 0; padding: 24px; box-shadow: 0 -10px 25px rgba(0,0,0,0.15); z-index: 3000 !important; display: flex; flex-direction: column; gap: 16px; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .sheet-header { display: flex; justify-content: space-between; align-items: flex-start; }
  .sheet-title { font-size: 22px; font-weight: 800; margin: 0 0 4px 0; }
  .sheet-subtitle { color: #8E8E93; font-size: 15px; margin: 0; display: flex; align-items: center; gap: 4px; }
  .close-btn { background: #F2F2F7; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; }
  .sheet-image { width: 100%; height: 140px; border-radius: 12px; background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%); display: flex; align-items: center; justify-content: center; color: #0056D2; font-weight: 600; }
  .price-row { display: flex; justify-content: space-between; align-items: flex-end; }
  .price-label { margin: 0; color: #8E8E93; font-size: 14px; margin-bottom: 4px; }
  .sheet-price { font-size: 28px; font-weight: 800; color: #000; margin: 0; }
  .spots-left { color: #FF3B30; font-weight: 600; font-size: 14px; margin: 0; background: #FFEBEA; padding: 4px 10px; border-radius: 8px; }

  /* --- CHECKOUT SCREEN STYLES --- */
  .checkout-header { display: flex; align-items: center; padding-bottom: 15px; border-bottom: 1px solid #E5E5EA; margin-bottom: 20px; margin-top: 30px;}
  .checkout-title { flex: 1; text-align: center; font-size: 20px; font-weight: 700; margin: 0; padding-right: 24px;}
  .receipt-box { background: white; border-radius: 16px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
  .receipt-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px; color: #333; }
  .receipt-row.total { font-weight: 800; font-size: 18px; border-top: 1px solid #E5E5EA; padding-top: 12px; margin-top: 4px; margin-bottom: 0; color: #000;}
  .apple-pay-btn { background: #000; color: white; border: none; width: 100%; padding: 16px; border-radius: 14px; font-size: 18px; font-weight: 600; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: auto; margin-bottom: 10px; }
  .payment-method-row { display: flex; align-items: center; gap: 10px; padding: 15px; background: white; border-radius: 12px; margin-bottom: 20px; border: 1px solid #E5E5EA;}

  /* --- ALGORITHM VISUALS STYLES --- */
  .locate-btn { position: absolute; right: 20px; bottom: 30px; z-index: 3000 !important; background: white; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.15); cursor: pointer; }
  .locate-btn:hover { background: #F2F2F7; }
  
  /* The Blue Dot representing the Driver's GPS Location */
  .driver-dot { position: relative; width: 22px; height: 22px; background: #007AFF; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.3); }
  .driver-dot::after { content: ''; position: absolute; top: -10px; left: -10px; right: -10px; bottom: -10px; background: rgba(0, 122, 255, 0.2); border-radius: 50%; animation: pulse 2s infinite; }
  @keyframes pulse { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }

  /* --- ACTIVE BOOKING TICKET (Commit 13) --- */
  .ticket-card { background: #0056D2; color: white; border-radius: 20px; padding: 30px 20px; text-align: center; margin-top: 20px; box-shadow: 0 15px 30px rgba(0,86,210,0.3); }
  .timer-display { font-size: 48px; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: 2px; margin: 10px 0; }
  .qr-box { background: white; padding: 15px; border-radius: 16px; margin: 20px auto; width: 150px; height: 150px; display: flex; align-items: center; justify-content: center; }
  .danger-btn { background: #FFEBEA; color: #FF3B30; border: none; width: 100%; padding: 16px; border-radius: 14px; font-size: 17px; font-weight: 600; cursor: pointer; margin-top: auto; margin-bottom: 10px; }

  /* --- HOST DASHBOARD (Commit 14) --- */
  .host-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; }
  .earnings-card { background: linear-gradient(135deg, #0056D2 0%, #003b8e 100%); color: white; padding: 25px; border-radius: 20px; box-shadow: 0 10px 20px rgba(0,86,210,0.3); margin-bottom: 20px; }
  .earnings-title { font-size: 14px; opacity: 0.9; margin: 0 0 5px 0; }
  .earnings-amount { font-size: 36px; font-weight: 800; margin: 0; }
  .listing-item { background: white; padding: 15px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
  
  /* Custom iOS Toggle Switch for Host Listings */
  .toggle-switch { width: 50px; height: 30px; background: #34C759; border-radius: 30px; position: relative; cursor: pointer; transition: 0.3s; }
  .toggle-knob { width: 26px; height: 26px; background: white; border-radius: 50%; position: absolute; top: 2px; right: 2px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: 0.3s; }
  
  /* Bottom Nav Bar for Host View */
  .nav-bar-bottom { display: flex; justify-content: space-around; align-items: center; background: white; padding: 15px 20px 25px; border-top: 1px solid #E5E5EA; position: absolute; bottom: 0; left: 0; right: 0; border-radius: 0 0 28px 28px; z-index: 100; }
  .nav-item { display: flex; flex-direction: column; align-items: center; color: #8E8E93; font-size: 11px; gap: 4px; cursor: pointer; }
  .nav-item.active { color: #0056D2; }
  .add-btn { background: #0056D2; color: white; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-top: -35px; box-shadow: 0 8px 15px rgba(0,86,210,0.4); border: 4px solid #F2F2F7; cursor: pointer; }

  /* --- ADD SPOT SCREEN (Commit 15) --- */
  .photo-upload-box { background: #E5E5EA; height: 160px; border-radius: 16px; border: 2px dashed #C7C7CC; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #8E8E93; margin-bottom: 25px; cursor: pointer; }
  .input-label { font-size: 13px; color: #8E8E93; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
  .form-section { margin-bottom: 20px; }

  /* --- USER PROFILE (Commit 16) --- */
  .profile-header-card { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; margin-top: 10px; }
  .avatar-circle { width: 64px; height: 64px; background: #0056D2; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; }
  .settings-section-title { font-size: 13px; color: #8E8E93; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; margin-left: 5px; }
  .settings-row { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #E5E5EA; cursor: pointer; }
  .settings-row:last-child { border-bottom: none; }
  .booking-card { background: white; border-radius: 16px; padding: 16px; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border: 1px solid #E5E5EA; border-left: 4px solid #0056D2; }

  /* --- REAL-TIME TOAST NOTIFICATION (Commit 17) --- */
  .live-toast { 
    position: absolute; top: 80px; left: 50%; transform: translateX(-50%); 
    background: rgba(0,0,0,0.85); color: white; padding: 12px 20px; 
    border-radius: 30px; font-size: 14px; font-weight: 500; 
    z-index: 4000 !important; display: flex; align-items: center; gap: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    animation: slideDownToast 0.4s cubic-bezier(0.16, 1, 0.3, 1), fadeOutToast 0.4s ease 3.6s forwards;
    white-space: nowrap;
  }
  @keyframes slideDownToast { from { top: 60px; opacity: 0; } to { top: 80px; opacity: 1; } }
  @keyframes fadeOutToast { from { opacity: 1; } to { opacity: 0; visibility: hidden; } }
  .live-indicator { width: 8px; height: 8px; background: #34C759; border-radius: 50%; box-shadow: 0 0 8px #34C759; animation: blink 1s infinite; }
  @keyframes blink { 50% { opacity: 0.3; } }

  /* --- RATING & REVIEW SCREEN (Commit 19) --- */
  .review-header { text-align: center; padding: 40px 20px 20px; }
  .star-row { display: flex; justify-content: center; gap: 15px; margin: 30px 0; }
  .star-btn { background: none; border: none; padding: 0; cursor: pointer; transition: transform 0.2s; outline: none; }
  .star-btn:hover { transform: scale(1.15); }
  .review-textarea { width: 100%; background: white; border: 1px solid #E5E5EA; border-radius: 12px; padding: 15px; font-family: inherit; font-size: 15px; resize: none; box-sizing: border-box; margin-bottom: 20px; outline: none; height: 120px; }
  .review-textarea:focus { border-color: #0056D2; }
`;

/**
 * COMPONENT: App
 * This is the main function that builds the UI.
 */
function App() {
  const [email, setEmail] = useState('');
  
  // NAVIGATION STATE
  const [currentScreen, setCurrentScreen] = useState('login'); 
  
  // State to hold our mock database of parking spots
  const [spots, setSpots] = useState([]);
  
  // State: Tracks which parking spot the user clicked on.
  const [selectedSpot, setSelectedSpot] = useState(null);
  
  // State to store the Driver's simulated GPS location
  const [driverLocation, setDriverLocation] = useState(null);

  // Variables to hold the new host listing data (Commit 15)
  const [newAddress, setNewAddress] = useState('');
  const [newPrice, setNewPrice] = useState('');

  // Holds the text for live Firebase simulation notifications (Commit 17)
  const [liveToastMessage, setLiveToastMessage] = useState(null);

  // Registration form fields (Commit 18)
  const [regName, setRegName] = useState('');
  const [regPlate, setRegPlate] = useState('');

  // Holds the user's star rating (Commit 19)
  const [rating, setRating] = useState(0);

  // NEW (Commit 21): Map Reference for Leaflet injection
  const mapContainerRef = useRef(null);

  // Load fake data when the app starts
  useEffect(() => {
    // UPDATED (Commit 20): Using actual London/Kingston Latitude and Longitude coordinates!
    setSpots([
      { id: '1', lat: 51.4039, lng: -0.3035, price: 4.50, address: 'Kingston University', rating: 4.8, distance: '2 min walk', spotsLeft: 3 },
      { id: '2', lat: 51.4045, lng: -0.3015, price: 6.00, address: 'Penrhyn Road', rating: 4.5, distance: '5 min walk', spotsLeft: 1 },
      { id: '3', lat: 51.4085, lng: -0.3060, price: 5.25, address: 'High St Garage', rating: 4.9, distance: '1 min walk', spotsLeft: 8 }
    ]);
  }, []);

  /**
   * NEW EFFECT (Commit 21): Dynamic Leaflet Map Injector
   * To prevent build environment crashes, we inject the Leaflet scripts purely on the client side.
   */
  useEffect(() => {
    if (currentScreen !== 'map') return;

    const initLeafletMap = () => {
      if (!mapContainerRef.current || window.mapInstance) return;

      // Initialize the map centered on Kingston Upon Thames
      window.mapInstance = window.L.map(mapContainerRef.current, {
        zoomControl: false, // We hide defaults for a cleaner UI
      }).setView([51.4060, -0.3040], 15);

      // Add modern, clean map tiles
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(window.mapInstance);
      
      // Force an update to draw markers
      setSpots([...spots]);
    };

    if (!window.L) {
      // Inject CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Inject JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = initLeafletMap;
      document.head.appendChild(script);
    } else {
      initLeafletMap();
    }

    // Cleanup: Destroy the map instance when leaving the map screen to prevent memory leaks
    return () => {
      if (currentScreen !== 'map' && window.mapInstance) {
        window.mapInstance.remove();
        window.mapInstance = null;
        window.markerLayer = null;
      }
    };
  }, [currentScreen]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * NEW EFFECT (Commit 21): Update Map Markers Dynamically
   * Whenever 'spots', 'driverLocation', or 'selectedSpot' change, we redraw the markers.
   */
  useEffect(() => {
    if (!window.mapInstance || !window.L || currentScreen !== 'map') return;

    // Remove old markers to prevent duplicates
    if (window.markerLayer) {
      window.mapInstance.removeLayer(window.markerLayer);
    }
    
    // Create a new layer for all current markers
    const newLayer = window.L.layerGroup().addTo(window.mapInstance);
    window.markerLayer = newLayer;

    // Draw Parking Spots
    spots.forEach(spot => {
      const isSelected = selectedSpot?.id === spot.id;
      const icon = window.L.divIcon({
        className: 'custom-leaflet-icon',
        html: `<div class="price-marker ${isSelected ? 'active' : ''}">£${spot.price.toFixed(2)}</div>`,
        iconSize: [60, 30],
        iconAnchor: [30, 30] // Anchor perfectly to the bottom point
      });
      
      const marker = window.L.marker([spot.lat, spot.lng], { icon }).addTo(newLayer);
      
      // Bind click event to React State
      marker.on('click', () => {
        setSelectedSpot(spot);
        window.mapInstance.flyTo([spot.lat, spot.lng], 16, { duration: 0.5 });
      });
    });

    // Draw Driver Location (Blue Dot)
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

  /**
   * EFFECT (Commit 17): Simulate Firebase Real-Time Listener
   */
  useEffect(() => {
    let timeoutId;
    if (currentScreen === 'map' && spots.length >= 3) {
      timeoutId = setTimeout(() => {
        setSpots(prevSpots => prevSpots.filter(s => s.id !== '2'));
        if (selectedSpot && selectedSpot.id === '2') {
          setSelectedSpot(null);
        }
        setLiveToastMessage("Someone just booked Penrhyn Road");
        setTimeout(() => setLiveToastMessage(null), 4000);
      }, 8000); // Triggers 8 seconds after opening the map
    }
    return () => clearTimeout(timeoutId);
  }, [currentScreen, spots.length, selectedSpot]);

  /**
   * FUNCTION: handleLogin
   */
  const handleLogin = (e) => {
    e.preventDefault(); 
    if (email) {
      setCurrentScreen('map'); 
    } else {
      alert('Please enter an email address');
    }
  };

  /**
   * FUNCTION: handleRegister (Commit 18)
   */
  const handleRegister = (e) => {
    e.preventDefault();
    if (email && regName && regPlate) {
      alert(`Account created for ${regName} with vehicle ${regPlate}!`);
      setCurrentScreen('map');
    } else {
      alert('Please fill out all fields to register.');
    }
  };

  /**
   * FUNCTION: handlePayment
   */
  const handlePayment = () => {
    setCurrentScreen('activeBooking');
  };

  /**
   * FUNCTION: handleEndSession
   */
  const handleEndSession = () => {
    setCurrentScreen('review');
  };

  /**
   * FUNCTION: handleSubmitReview (Commit 19)
   */
  const handleSubmitReview = (e) => {
    e.preventDefault();
    alert(`Thank you! Your ${rating}-star review for ${selectedSpot.address} has been saved.`);
    setRating(0);
    setSelectedSpot(null);
    setDriverLocation(null);
    setCurrentScreen('map');
  };

  /**
   * CORE ALGORITHM: Geospatial Proximity Finder
   * UPDATED (Commit 21): Uses REAL HTML5 Geolocation to find the user's actual phone GPS!
   */
  const findClosestSpot = () => {
    // 1. Fetch the user's REAL physical location using the browser/phone API
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const actualLat = position.coords.latitude;
          const actualLng = position.coords.longitude;
          
          setDriverLocation({ lat: actualLat, lng: actualLng });
          
          // Smoothly fly the interactive map to the user's real location
          if (window.mapInstance) {
            window.mapInstance.flyTo([actualLat, actualLng], 15, { duration: 1.5 });
          }

          // Note: Unless you are physically sitting in Kingston right now, 
          // the spots might be far away! This is exactly how the backend works.
        },
        (error) => {
          // Fallback if the user denies GPS permissions
          alert("Location access denied. Simulating location in Kingston.");
          const simGPS = { lat: 51.4055, lng: -0.3030 };
          setDriverLocation(simGPS);
          if (window.mapInstance) window.mapInstance.flyTo([simGPS.lat, simGPS.lng], 15);
        }
      );
    } else {
       alert("Geolocation is not supported by your browser");
    }
  };

  /**
   * FUNCTION: handlePublishSpot (Commit 15)
   */
  const handlePublishSpot = (e) => {
    e.preventDefault();
    if (!newAddress || !newPrice) {
      alert("Please enter an address and a price.");
      return;
    }

    const newSpotData = {
      id: Date.now().toString(), 
      lat: 51.4060 + (Math.random() * 0.004 - 0.002), // Randomly place it near Kingston
      lng: -0.3040 + (Math.random() * 0.004 - 0.002), 
      price: parseFloat(newPrice), 
      address: newAddress, 
      rating: 5.0, 
      distance: '0 min walk', 
      spotsLeft: 1
    };

    setSpots([...spots, newSpotData]);
    setNewAddress('');
    setNewPrice('');
    
    alert('Listing Published! Check the interactive map to see your new spot.');
    setCurrentScreen('map');
  };

  const handleLogout = () => {
    setEmail('');
    setCurrentScreen('login');
  };

  // RENDER: This is the HTML that appears on screen
  return (
    <>
      <style>{styles}</style> {/* Loads the CSS */}
      <div className="app-frame">
        
        {/* --- LOGIN SCREEN --- */}
        {currentScreen === 'login' && (
          <div className="screen">
            <div className="login-header">
              <div className="app-logo"><MapPin size={40} color="white" /></div>
              <h1 style={{fontSize: 32, fontWeight: 800, margin: '5px 0'}}>Park Now</h1>
              <p style={{color: '#8E8E93', margin: 0}}>Find a spot in 30 seconds.</p>
            </div>
            
            <form onSubmit={handleLogin}>
              <div className="ios-input-group">
                <div className="ios-input-row">
                  <Mail size={20} color="#8E8E93" />
                  <input className="ios-input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="ios-input-row">
                  <Lock size={20} color="#8E8E93" />
                  <input className="ios-input" placeholder="Password" type="password" />
                </div>
              </div>
              
              <button className="primary-btn" type="submit">Sign In</button>
              <button type="button" className="secondary-btn" onClick={() => alert('Coming soon')}>Forgot Password?</button>
            </form>

            <div className="signup-area">
              New to Park Now? 
              <button type="button" className="signup-link" onClick={() => setCurrentScreen('register')}>Create Account</button>
            </div>
          </div>
        )}

        {/* --- REGISTRATION SCREEN (Commit 18) --- */}
        {currentScreen === 'register' && (
          <div className="screen" style={{overflowY: 'auto'}}>
            <div className="checkout-header" style={{marginTop: 10}}>
              <button className="close-btn" onClick={() => setCurrentScreen('login')}><ArrowLeft size={20} color="#000" /></button>
              <h2 className="checkout-title">Create Account</h2>
            </div>
            
            <p style={{color: '#8E8E93', marginBottom: 25, fontSize: 15, textAlign: 'center'}}>Join Park Now to find and list driveways instantly.</p>

            <form onSubmit={handleRegister}>
              <div className="form-section">
                <div className="input-label">Personal Details</div>
                <div className="ios-input-group">
                  <div className="ios-input-row"><User size={20} color="#8E8E93" /><input className="ios-input" placeholder="Full Name" value={regName} onChange={(e) => setRegName(e.target.value)} required /></div>
                  <div className="ios-input-row"><Mail size={20} color="#8E8E93" /><input className="ios-input" placeholder="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                  <div className="ios-input-row"><Lock size={20} color="#8E8E93" /><input className="ios-input" placeholder="Create Password" type="password" required /></div>
                </div>
              </div>

              <div className="form-section">
                <div className="input-label">Vehicle Details</div>
                <div className="ios-input-group">
                  <div className="ios-input-row"><Car size={20} color="#8E8E93" /><input className="ios-input" placeholder="License Plate (e.g. AB12 CDE)" value={regPlate} onChange={(e) => setRegPlate(e.target.value)} required style={{textTransform: 'uppercase'}} /></div>
                </div>
              </div>
              
              <button className="primary-btn" type="submit" style={{marginTop: 20}}>Register & Continue</button>
            </form>
          </div>
        )}

        {/* --- MAP SCREEN --- */}
        {currentScreen === 'map' && (
          <div className="screen" style={{padding: 0, position: 'relative'}}>
            
            {liveToastMessage && (
              <div className="live-toast"><div className="live-indicator"></div>{liveToastMessage}</div>
            )}

            <div className="search-header">
              <div className="icon-btn" onClick={() => setCurrentScreen('profile')}><Menu size={24} color="#000" /></div>
              <div className="search-input"><MapPin size={16} color="#0056D2" /><span>London, UK</span></div>
              <div className="icon-btn" onClick={() => setCurrentScreen('hostDashboard')}><User size={24} color="#000" /></div>
            </div>
            
            {/* NEW (Commit 21): Real Leaflet Map mount point */}
            <div id="real-map" ref={mapContainerRef}></div>

            {/* Locate Me Button */}
            {!selectedSpot && (
              <div className="locate-btn" onClick={findClosestSpot}>
                <Navigation size={22} color="#0056D2" fill="#0056D2" />
              </div>
            )}

            {/* Bottom Sheet */}
            {selectedSpot && (
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

                <div className="sheet-image">Street View Image</div>

                <div className="price-row">
                  <div>
                    <p className="price-label">Total per hour</p>
                    <p className="sheet-price">£{selectedSpot.price.toFixed(2)}</p>
                  </div>
                  <p className="spots-left" style={selectedSpot.spotsLeft > 3 ? {color: '#34C759', background: '#E8F8EE'} : {}}>
                    {selectedSpot.spotsLeft} spots left
                  </p>
                </div>

                <button className="primary-btn" onClick={() => setCurrentScreen('checkout')}>Book Spot</button>
              </div>
            )}
          </div>
        )}

        {/* --- CHECKOUT SCREEN --- */}
        {currentScreen === 'checkout' && selectedSpot && (
          <div className="screen">
            <div className="checkout-header">
              <button className="close-btn" onClick={() => setCurrentScreen('map')}><ArrowLeft size={20} color="#000" /></button>
              <h2 className="checkout-title">Confirm Booking</h2>
            </div>

            <div className="receipt-box">
              <h3 style={{marginTop: 0, marginBottom: 15}}>{selectedSpot.address}</h3>
              <div className="receipt-row"><span style={{color: '#8E8E93'}}>Date</span><span>Today</span></div>
              <div className="receipt-row"><span style={{color: '#8E8E93'}}>Duration</span><span>2 Hours (14:00 - 16:00)</span></div>
              <div className="receipt-row"><span style={{color: '#8E8E93'}}>Rate</span><span>£{selectedSpot.price.toFixed(2)} / hr</span></div>
              <div className="receipt-row total"><span>Total Due</span><span>£{(selectedSpot.price * 2).toFixed(2)}</span></div>
            </div>

            <h4 style={{marginBottom: 10, color: '#666'}}>Payment Method</h4>
            <div className="payment-method-row">
              <CreditCard size={24} color="#0056D2" />
              <div style={{flex: 1}}><div style={{fontWeight: 600}}>Personal Card</div><div style={{fontSize: 13, color: '#8E8E93'}}>Visa ending in 4242</div></div>
            </div>

            <button className="apple-pay-btn" onClick={handlePayment}>Pay & Confirm</button>
          </div>
        )}

        {/* --- ACTIVE BOOKING SCREEN --- */}
        {currentScreen === 'activeBooking' && selectedSpot && (
          <div className="screen">
            <div className="checkout-header" style={{borderBottom: 'none'}}>
              <h2 className="checkout-title" style={{paddingRight: 0}}>Active Session</h2>
            </div>

            <div className="ticket-card">
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.9}}><Timer size={20} /><span>Time Remaining</span></div>
              <div className="timer-display">01:59:59</div>
              <div className="qr-box"><QrCode size={100} color="#0056D2" /></div>
              <p style={{fontSize: 14, opacity: 0.9, margin: 0}}>Scan this QR code at the barrier to enter and exit <b>{selectedSpot.address}</b>.</p>
            </div>

            <div style={{marginTop: 20, textAlign: 'center'}}><p style={{color: '#8E8E93', fontSize: 14}}>Booking ID: #PN-894A2B</p></div>

            <button className="danger-btn" onClick={handleEndSession}>End Session Early</button>
          </div>
        )}

        {/* --- RATING & REVIEW SCREEN (Commit 19) --- */}
        {currentScreen === 'review' && selectedSpot && (
          <div className="screen" style={{background: '#ffffff'}}>
            <div className="review-header">
              <h2 style={{fontSize: 28, fontWeight: 800, margin: '0 0 10px 0'}}>Session Ended</h2>
              <p style={{color: '#8E8E93', fontSize: 16, margin: 0}}>How was your parking experience at <b>{selectedSpot.address}</b>?</p>
            </div>

            <div className="star-row">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <button key={starValue} className="star-btn" onClick={() => setRating(starValue)}>
                  <Star size={40} color={rating >= starValue ? "#FFCC00" : "#E5E5EA"} fill={rating >= starValue ? "#FFCC00" : "transparent"} />
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmitReview} style={{display: 'flex', flexDirection: 'column', flex: 1}}>
              <textarea className="review-textarea" placeholder="Leave a public review for the host (optional)..."></textarea>
              <button className="primary-btn" type="submit" style={{marginTop: 'auto', marginBottom: 20, opacity: rating === 0 ? 0.5 : 1}} disabled={rating === 0}>Submit Feedback</button>
            </form>
          </div>
        )}

        {/* --- HOST DASHBOARD SCREEN (Commit 14) --- */}
        {currentScreen === 'hostDashboard' && (
          <div className="screen" style={{paddingBottom: 80, overflowY: 'auto'}}>
            <div className="host-header">
              <h2 style={{margin: 0, fontSize: 24, fontWeight: 800}}>Host Dashboard</h2>
              <button className="close-btn" onClick={() => setCurrentScreen('map')}><X size={20} color="#000" /></button>
            </div>

            <div className="earnings-card">
              <p className="earnings-title">Total Earnings (This Month)</p>
              <p className="earnings-amount">£342.50</p>
              <p style={{margin: '10px 0 0 0', fontSize: 14, opacity: 0.9}}>+12% from last month</p>
            </div>

            <h3 style={{fontSize: 18, marginTop: 10, marginBottom: 15}}>Your Driveways</h3>

            <div className="listing-item">
              <div>
                <div style={{fontWeight: 700, fontSize: 16}}>142 Penrhyn Road</div>
                <div style={{color: '#8E8E93', fontSize: 14, marginTop: 4}}>£6.00 / hr • 2 spots</div>
              </div>
              <div className="toggle-switch" onClick={() => alert('Toggle availability coming soon.')}><div className="toggle-knob"></div></div>
            </div>

            <div className="listing-item">
              <div>
                <div style={{fontWeight: 700, fontSize: 16}}>Kingston Uni Garage</div>
                <div style={{color: '#8E8E93', fontSize: 14, marginTop: 4}}>£4.50 / hr • 1 spot</div>
              </div>
              <div className="toggle-switch" style={{background: '#E5E5EA'}} onClick={() => alert('Toggle availability coming soon.')}><div className="toggle-knob" style={{right: 'auto', left: 2}}></div></div>
            </div>

            <div className="nav-bar-bottom">
              <div className="nav-item active"><Home size={24} /><span>Home</span></div>
              <div className="add-btn" onClick={() => setCurrentScreen('addSpot')}><Plus size={28} /></div>
              <div className="nav-item" onClick={() => setCurrentScreen('profile')}><Settings size={24} color="#8E8E93" /><span>Settings</span></div>
            </div>
          </div>
        )}

        {/* --- ADD SPOT SCREEN (Commit 15) --- */}
        {currentScreen === 'addSpot' && (
          <div className="screen" style={{overflowY: 'auto'}}>
            <div className="checkout-header" style={{marginTop: 10}}>
              <button className="close-btn" onClick={() => setCurrentScreen('hostDashboard')}><ArrowLeft size={20} color="#000" /></button>
              <h2 className="checkout-title">List Driveway</h2>
            </div>

            <form onSubmit={handlePublishSpot}>
              <div className="photo-upload-box" onClick={() => alert('Camera roll integration coming soon')}><Camera size={32} style={{marginBottom: 8}} /><span>Tap to add photos</span></div>

              <div className="form-section">
                <div className="input-label">Address</div>
                <div className="ios-input-group" style={{marginBottom: 0}}>
                  <div className="ios-input-row"><MapPin size={20} color="#8E8E93" /><input className="ios-input" placeholder="e.g. 10 Downing Street" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} required /></div>
                </div>
              </div>

              <div className="form-section">
                <div className="input-label">Hourly Rate (£)</div>
                <div className="ios-input-group" style={{marginBottom: 0}}>
                  <div className="ios-input-row"><span style={{color: '#8E8E93', fontSize: 17, fontWeight: 500}}>£</span><input className="ios-input" type="number" step="0.10" placeholder="5.00" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required /></div>
                </div>
              </div>

              <button className="primary-btn" type="submit" style={{marginTop: '40px'}}>Publish Listing</button>
            </form>
          </div>
        )}

        {/* --- USER PROFILE & SETTINGS (Commit 16) --- */}
        {currentScreen === 'profile' && (
          <div className="screen" style={{overflowY: 'auto'}}>
            <div className="host-header" style={{paddingBottom: 0}}>
              <h2 style={{margin: 0, fontSize: 24, fontWeight: 800}}>Profile</h2>
              <button className="close-btn" onClick={() => setCurrentScreen('map')}><X size={20} color="#000" /></button>
            </div>

            <div className="profile-header-card">
              <div className="avatar-circle">{regName ? regName.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : 'U')}</div>
              <div>
                <h3 style={{margin: '0 0 4px 0', fontSize: 20}}>Driver Account</h3>
                <p style={{margin: 0, color: '#8E8E93', fontSize: 14}}>{email || 'test@parknow.com'}</p>
                {regPlate && (<p style={{margin: '4px 0 0 0', color: '#0056D2', fontSize: 12, fontWeight: 700}}>Vehicle: {regPlate.toUpperCase()}</p>)}
              </div>
            </div>

            <div className="settings-section-title">Past Bookings & Policies</div>
            
            <div className="booking-card">
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}><span style={{fontWeight: 700}}>High St Garage</span><span style={{color: '#8E8E93', fontSize: 14}}>Oct 12</span></div>
              <div style={{fontSize: 14, color: '#333', marginBottom: 12}}>Duration: 3 Hours • £15.75</div>
              <div style={{display: 'flex', alignItems: 'center', gap: 6, color: '#34C759', fontSize: 12, fontWeight: 600, background: '#E8F8EE', padding: '6px 10px', borderRadius: 8, width: 'fit-content'}}>
                <ShieldCheck size={14} /> Insurance Policy: #INS-992A-X
              </div>
            </div>

            <div className="settings-section-title" style={{marginTop: 25}}>Account Settings</div>
            <div className="ios-input-group">
              <div className="settings-row" onClick={() => alert('Payment settings coming soon.')}>
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}><CreditCard size={20} color="#0056D2" /><span style={{fontWeight: 500}}>Payment Methods</span></div>
                <ChevronRight size={20} color="#C7C7CC" />
              </div>
              
              <div className="settings-row" onClick={() => setCurrentScreen('hostDashboard')}>
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}><Home size={20} color="#0056D2" /><span style={{fontWeight: 500}}>Switch to Host Dashboard</span></div>
                <ChevronRight size={20} color="#C7C7CC" />
              </div>

              <div className="settings-row" onClick={handleLogout}>
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}><LogOut size={20} color="#FF3B30" /><span style={{fontWeight: 500, color: '#FF3B30'}}>Log Out</span></div>
              </div>
            </div>

          </div>
        )}

      </div>
    </>
  );
}
export default App;