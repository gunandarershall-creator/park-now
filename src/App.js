/**
 * PROJECT: Park Now - Application
 * COMMIT: 16 (User Profile & Booking History)
 * DESCRIPTION: Centralizes navigation, user settings, and displays past booking/insurance data.
 * NOTE: All previous comments and logic are preserved. New additions are marked with "Commit X".
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Mail, Lock, Menu, User, Star, X, ArrowLeft, CreditCard, Navigation, Timer, QrCode, Plus, Home, Settings, Camera, ChevronRight, ShieldCheck, LogOut } from 'lucide-react'; // 'useState' allows us to store data (like email) in memory. Import icons for better User Experience (UX). NEW (Commit 13): Added Timer and QrCode icons. NEW (Commit 14): Added Plus, Home, Settings for the Host Nav. NEW (Commit 15): Added Camera icon. NEW (Commit 16): Added ChevronRight, ShieldCheck, LogOut icons.

/**
 * CSS STYLES (Internal Stylesheet)
 * We define styles here to keep the component self-contained.
 * Design Standard: iOS Human Interface Guidelines (clean, white, rounded corners).
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

  /* --- MAP STYLES --- */
  .search-header { position: absolute; top: 20px; left: 20px; right: 20px; z-index: 1000; display: flex; gap: 10px; align-items: center; }
  .search-input { flex: 1; background: white; padding: 12px 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 8px; font-weight: 500; }
  .icon-btn { background: white; border-radius: 50%; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; }
  
  /* Prototype Map Area */
  .map-simulation { width: 100%; height: 100%; position: relative; background-color: #E2E2E0; overflow: hidden; }
  .fake-road-1 { position: absolute; top: 40%; left: -10%; right: -10%; height: 20px; background: #FFFFFF; transform: rotate(-10deg); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
  .fake-road-2 { position: absolute; top: -10%; bottom: -10%; left: 55%; width: 25px; background: #FFFFFF; transform: rotate(15deg); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
  
  /* Airbnb-style Price Marker */
  .price-marker { position: absolute; background: white; border-radius: 20px; padding: 6px 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); border: 1px solid #ddd; display: flex; justify-content: center; align-items: center; transition: all 0.2s; z-index: 10; cursor: pointer; }
  .price-marker:hover, .price-marker.active { transform: scale(1.1); background: #0056D2; color: white; border-color: #0056D2; z-index: 20; }
  .price-marker::after { content: ''; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); border-width: 6px 6px 0; border-style: solid; border-color: white transparent transparent transparent; }
  .price-marker:hover::after, .price-marker.active::after { border-color: #0056D2 transparent transparent transparent; }

  /* --- BOTTOM SHEET STYLES --- */
  .bottom-sheet { position: absolute; bottom: 0; left: 0; right: 0; background: white; border-radius: 24px 24px 0 0; padding: 24px; box-shadow: 0 -10px 25px rgba(0,0,0,0.15); z-index: 2000; display: flex; flex-direction: column; gap: 16px; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
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
  .locate-btn { position: absolute; right: 20px; bottom: 30px; z-index: 1000; background: white; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.15); cursor: pointer; }
  .locate-btn:hover { background: #F2F2F7; }
  /* The Blue Dot representing the Driver's GPS Location */
  .driver-dot { position: absolute; width: 20px; height: 20px; background: #007AFF; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.3); z-index: 15; transform: translate(-50%, -50%); }
  /* The animated pulsing radar effect */
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

  /* --- NEW STYLES (Commit 16): USER PROFILE --- */
  .profile-header-card { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; margin-top: 10px; }
  .avatar-circle { width: 64px; height: 64px; background: #0056D2; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; }
  .settings-section-title { font-size: 13px; color: #8E8E93; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; margin-left: 5px; }
  .settings-row { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #E5E5EA; cursor: pointer; }
  .settings-row:last-child { border-bottom: none; }
  .booking-card { background: white; border-radius: 16px; padding: 16px; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border: 1px solid #E5E5EA; border-left: 4px solid #0056D2; }
`;

/**
 * COMPONENT: App
 * This is the main function that builds the UI.
 */
function App() {
  // STATE VARIABLE: 'email'
  // 1. email: variable that holds the text the user types.
  // 2. setEmail: function we call to update that variable.
  // 3. useState(''): initializes it as an empty string.
  const [email, setEmail] = useState('');
  
  // NAVIGATION STATE
  // 'currentScreen' determines which view is shown (login, map, checkout). 
  // NEW (Commit 13): can now also be 'activeBooking'
  // NEW (Commit 14): can now also be 'hostDashboard'
  // NEW (Commit 15): can now also be 'addSpot'
  // NEW (Commit 16): can now also be 'profile'
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

  // Load fake data when the app starts
  useEffect(() => {
    // We assign mathematical 'x' and 'y' coordinates to make the distance algorithm possible!
    setSpots([
      { id: '1', top: '35%', left: '30%', x: 30, y: 35, price: 4.50, address: 'Kingston University', rating: 4.8, distance: '2 min walk', spotsLeft: 3 },
      { id: '2', top: '55%', left: '60%', x: 60, y: 55, price: 6.00, address: 'Penrhyn Road', rating: 4.5, distance: '5 min walk', spotsLeft: 1 },
      { id: '3', top: '65%', left: '20%', x: 20, y: 65, price: 5.25, address: 'High St Garage', rating: 4.9, distance: '1 min walk', spotsLeft: 8 }
    ]);
  }, []);

  /**
   * FUNCTION: handleLogin
   * This runs when the user clicks the "Sign In" button.
   */
  const handleLogin = (e) => {
    e.preventDefault(); // Stop the page from reloading (default HTML behavior)
    
    // Check if the user typed anything
    if (email) {
      // Success: Switch state to 'map' to trigger re-render
      setCurrentScreen('map'); 
    } else {
      // Error: User left the field empty
      alert('Please enter an email address');
    }
  };

  /**
   * FUNCTION: handlePayment
   * Simulates the atomic transaction from your report
   */
  const handlePayment = () => {
    // We are no longer using the alert to reset.
    // Transition directly to the active digital ticket.
    setCurrentScreen('activeBooking');
  };

  /**
   * FUNCTION: handleEndSession
   * Allows the driver to stop their session and returns them to the map.
   */
  const handleEndSession = () => {
    setSelectedSpot(null);
    setDriverLocation(null);
    setCurrentScreen('map');
  };

  /**
   * CORE ALGORITHM: Geospatial Proximity Finder
   * This simulates Section 4.2.1 of your report. It uses the Pythagorean theorem
   * to calculate the shortest straight-line distance to all available spots.
   */
  const findClosestSpot = () => {
    // 1. Simulate finding the driver's GPS (e.g., somewhere in the middle of the map)
    const currentGPS = { x: 45, y: 45 };
    setDriverLocation(currentGPS);

    // 2. Algorithm to find the shortest distance
    let closestSpot = null;
    let shortestDistance = Infinity; // Start with infinitely far away

    spots.forEach(spot => {
      // Pythagorean Theorem: d = √( (x2 - x1)² + (y2 - y1)² )
      const distance = Math.sqrt(
        Math.pow(spot.x - currentGPS.x, 2) + Math.pow(spot.y - currentGPS.y, 2)
      );
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        closestSpot = spot;
      }
    });

    // 3. Automatically select the closest spot found after a tiny delay
    if (closestSpot) {
      setTimeout(() => setSelectedSpot(closestSpot), 600); // Small delay so the user sees the dot first
    }
  };

  /**
   * FUNCTION: handlePublishSpot (Commit 15)
   * Takes the host's input, adds a new spot to our database, and returns to dashboard.
   */
  const handlePublishSpot = (e) => {
    e.preventDefault();
    if (!newAddress || !newPrice) {
      alert("Please enter an address and a price.");
      return;
    }

    // Create a new spot object. We hardcode the GPS coordinates to the middle 
    // of the prototype map for demonstration purposes.
    const newSpotData = {
      id: Date.now().toString(), // Generates a unique ID based on timestamp
      top: '45%', left: '45%', x: 45, y: 45, 
      price: parseFloat(newPrice), 
      address: newAddress, 
      rating: 5.0, // Brand new spot gets a default 5 stars!
      distance: '0 min walk', 
      spotsLeft: 1
    };

    // Update our map database state
    setSpots([...spots, newSpotData]);
    
    // Clear the form fields for next time
    setNewAddress('');
    setNewPrice('');
    
    // Send host back to the dashboard
    alert('Listing Published! Simulating database update...');
    setCurrentScreen('hostDashboard');
  };

  // NEW FUNCTION (Commit 16): handleLogout
  const handleLogout = () => {
    setEmail('');
    setCurrentScreen('login');
  };

  // RENDER: This is the HTML that appears on screen
  return (
    <>
      <style>{styles}</style> {/* Loads the CSS */}
      <div className="app-frame">
        
        {/* CONDITIONAL RENDERING: Check which screen to show */}
        {/* --- LOGIN SCREEN --- */}
        {currentScreen === 'login' && (
          <div className="screen">
            {/* 1. Header with Logo */}
            <div className="login-header">
              <div className="app-logo"><MapPin size={40} color="white" /></div>
              <h1 style={{fontSize: 32, fontWeight: 800, margin: '5px 0'}}>Park Now</h1>
              <p style={{color: '#8E8E93', margin: 0}}>Find a spot in 30 seconds.</p>
            </div>
            
            {/* 2. Login Form */}
            <form onSubmit={handleLogin}>
              <div className="ios-input-group">
                {/* Email Field */}
                <div className="ios-input-row">
                  <Mail size={20} color="#8E8E93" />
                  <input className="ios-input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} /> {/* Connects input to our State */}
                </div>
                {/* Password Field (Static for now) */}
                <div className="ios-input-row">
                  <Lock size={20} color="#8E8E93" />
                  <input className="ios-input" placeholder="Password" type="password" />
                </div>
              </div>
              
              {/* 3. Submit Button */}
              <button className="primary-btn" type="submit">Sign In</button>
              
              {/* 4. Forgot Password */}
              <button type="button" className="secondary-btn" onClick={() => alert('Coming soon')}>Forgot Password?</button>
            </form>

            {/* 5. Sign Up Option */}
            <div className="signup-area">
              New to Park Now? 
              <button type="button" className="signup-link" onClick={() => alert('Coming soon')}>Create Account</button>
            </div>
          </div>
        )}

        {/* --- MAP SCREEN --- */}
        {currentScreen === 'map' && (
          <div className="screen" style={{padding: 0}}>
            {/* The Floating Search Bar */}
            <div className="search-header">
              {/* NEW (Commit 16): Wired the Menu button to go to Settings/Profile */}
              <div className="icon-btn" onClick={() => setCurrentScreen('profile')}><Menu size={24} color="#000" /></div>
              <div className="search-input"><MapPin size={16} color="#0056D2" /><span>Kingston, UK</span></div>
              {/* (Commit 14): Wired the User icon to switch to the Host Dashboard */}
              <div className="icon-btn" onClick={() => setCurrentScreen('hostDashboard')}><User size={24} color="#000" /></div>
            </div>
            
            {/* Simulated Prototype Map */}
            <div className="map-simulation" onClick={() => setSelectedSpot(null)}>
              <div className="fake-road-1"></div>
              <div className="fake-road-2"></div>

              {/* Render the Driver's GPS Dot if we have their location */}
              {driverLocation && (
                <div className="driver-dot" style={{ top: `${driverLocation.y}%`, left: `${driverLocation.x}%` }}></div>
              )}

              {spots.map(spot => (
                <div 
                  key={spot.id} 
                  className={`price-marker ${selectedSpot?.id === spot.id ? 'active' : ''}`}
                  style={{ top: spot.top, left: spot.left }}
                  onClick={(e) => { e.stopPropagation(); setSelectedSpot(spot); }}
                >
                  £{spot.price.toFixed(2)}
                </div>
              ))}
            </div>

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

                {/* Fake Image Placeholder */}
                <div className="sheet-image">Street View Image</div>

                {/* Pricing and Availability Row */}
                <div className="price-row">
                  <div>
                    <p className="price-label">Total per hour</p>
                    <p className="sheet-price">£{selectedSpot.price.toFixed(2)}</p>
                  </div>
                  <p className="spots-left" style={selectedSpot.spotsLeft > 3 ? {color: '#34C759', background: '#E8F8EE'} : {}}>
                    {selectedSpot.spotsLeft} spots left
                  </p>
                </div>

                {/* Switches screen to 'checkout' */}
                <button className="primary-btn" onClick={() => setCurrentScreen('checkout')}>
                  Book Spot
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- CHECKOUT SCREEN --- */}
        {currentScreen === 'checkout' && selectedSpot && (
          <div className="screen">
            <div className="checkout-header">
              {/* Back Button */}
              <button className="close-btn" onClick={() => setCurrentScreen('map')}>
                <ArrowLeft size={20} color="#000" />
              </button>
              <h2 className="checkout-title">Confirm Booking</h2>
            </div>

            {/* Receipt details simulating a 2-hour booking */}
            <div className="receipt-box">
              <h3 style={{marginTop: 0, marginBottom: 15}}>{selectedSpot.address}</h3>
              <div className="receipt-row">
                <span style={{color: '#8E8E93'}}>Date</span>
                <span>Today</span>
              </div>
              <div className="receipt-row">
                <span style={{color: '#8E8E93'}}>Duration</span>
                <span>2 Hours (14:00 - 16:00)</span>
              </div>
              <div className="receipt-row">
                <span style={{color: '#8E8E93'}}>Rate</span>
                <span>£{selectedSpot.price.toFixed(2)} / hr</span>
              </div>
              <div className="receipt-row total">
                <span>Total Due</span>
                {/* Math logic: multiplies hourly rate by 2 */}
                <span>£{(selectedSpot.price * 2).toFixed(2)}</span>
              </div>
            </div>

            <h4 style={{marginBottom: 10, color: '#666'}}>Payment Method</h4>
            <div className="payment-method-row">
              <CreditCard size={24} color="#0056D2" />
              <div style={{flex: 1}}>
                <div style={{fontWeight: 600}}>Personal Card</div>
                <div style={{fontSize: 13, color: '#8E8E93'}}>Visa ending in 4242</div>
              </div>
            </div>

            {/* Simulates the final transaction */}
            <button className="apple-pay-btn" onClick={handlePayment}>
              Pay & Confirm
            </button>
          </div>
        )}

        {/* --- ACTIVE BOOKING SCREEN --- */}
        {currentScreen === 'activeBooking' && selectedSpot && (
          <div className="screen">
            <div className="checkout-header" style={{borderBottom: 'none'}}>
              <h2 className="checkout-title" style={{paddingRight: 0}}>Active Session</h2>
            </div>

            <div className="ticket-card">
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.9}}>
                <Timer size={20} />
                <span>Time Remaining</span>
              </div>
              {/* Simulated 2 hour countdown timer visually */}
              <div className="timer-display">01:59:59</div>
              
              <div className="qr-box">
                <QrCode size={100} color="#0056D2" />
              </div>
              <p style={{fontSize: 14, opacity: 0.9, margin: 0}}>
                Scan this QR code at the barrier to enter and exit <b>{selectedSpot.address}</b>.
              </p>
            </div>

            <div style={{marginTop: 20, textAlign: 'center'}}>
              <p style={{color: '#8E8E93', fontSize: 14}}>Booking ID: #PN-894A2B</p>
            </div>

            {/* Button to end the lifecycle and return to map */}
            <button className="danger-btn" onClick={handleEndSession}>
              End Session Early
            </button>
          </div>
        )}

        {/* --- HOST DASHBOARD SCREEN (Commit 14) --- */}
        {currentScreen === 'hostDashboard' && (
          <div className="screen" style={{paddingBottom: 80, overflowY: 'auto'}}>
            <div className="host-header">
              <h2 style={{margin: 0, fontSize: 24, fontWeight: 800}}>Host Dashboard</h2>
              <button className="close-btn" onClick={() => setCurrentScreen('map')}>
                <X size={20} color="#000" />
              </button>
            </div>

            <div className="earnings-card">
              <p className="earnings-title">Total Earnings (This Month)</p>
              <p className="earnings-amount">£342.50</p>
              <p style={{margin: '10px 0 0 0', fontSize: 14, opacity: 0.9}}>+12% from last month</p>
            </div>

            <h3 style={{fontSize: 18, marginTop: 10, marginBottom: 15}}>Your Driveways</h3>

            {/* Simulated Active Listing 1 */}
            <div className="listing-item">
              <div>
                <div style={{fontWeight: 700, fontSize: 16}}>142 Penrhyn Road</div>
                <div style={{color: '#8E8E93', fontSize: 14, marginTop: 4}}>£6.00 / hr • 2 spots</div>
              </div>
              {/* iOS Style Toggle Switch (ON) */}
              <div className="toggle-switch" onClick={() => alert('Toggle availability coming soon.')}>
                <div className="toggle-knob"></div>
              </div>
            </div>

            {/* Simulated Inactive Listing 2 */}
            <div className="listing-item">
              <div>
                <div style={{fontWeight: 700, fontSize: 16}}>Kingston Uni Garage</div>
                <div style={{color: '#8E8E93', fontSize: 14, marginTop: 4}}>£4.50 / hr • 1 spot</div>
              </div>
              {/* iOS Style Toggle Switch (OFF) */}
              <div className="toggle-switch" style={{background: '#E5E5EA'}} onClick={() => alert('Toggle availability coming soon.')}>
                <div className="toggle-knob" style={{right: 'auto', left: 2}}></div>
              </div>
            </div>

            {/* Bottom Navigation Menu for Host */}
            <div className="nav-bar-bottom">
              <div className="nav-item active">
                <Home size={24} />
                <span>Home</span>
              </div>
              
              {/* (Commit 15): Wired the Add Spot button to transition to the form */}
              <div className="add-btn" onClick={() => setCurrentScreen('addSpot')}>
                <Plus size={28} />
              </div>
              
              {/* NEW (Commit 16): Wire settings icon to profile view */}
              <div className="nav-item" onClick={() => setCurrentScreen('profile')}>
                <Settings size={24} color="#8E8E93" />
                <span>Settings</span>
              </div>
            </div>
          </div>
        )}

        {/* --- ADD SPOT SCREEN (Commit 15) --- */}
        {currentScreen === 'addSpot' && (
          <div className="screen" style={{overflowY: 'auto'}}>
            <div className="checkout-header" style={{marginTop: 10}}>
              {/* Back Button */}
              <button className="close-btn" onClick={() => setCurrentScreen('hostDashboard')}>
                <ArrowLeft size={20} color="#000" />
              </button>
              <h2 className="checkout-title">List Driveway</h2>
            </div>

            <form onSubmit={handlePublishSpot}>
              <div className="photo-upload-box" onClick={() => alert('Camera roll integration coming soon')}>
                <Camera size={32} style={{marginBottom: 8}} />
                <span>Tap to add photos</span>
              </div>

              <div className="form-section">
                <div className="input-label">Address</div>
                <div className="ios-input-group" style={{marginBottom: 0}}>
                  <div className="ios-input-row">
                    <MapPin size={20} color="#8E8E93" />
                    <input 
                      className="ios-input" 
                      placeholder="e.g. 10 Downing Street" 
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="input-label">Hourly Rate (£)</div>
                <div className="ios-input-group" style={{marginBottom: 0}}>
                  <div className="ios-input-row">
                    <span style={{color: '#8E8E93', fontSize: 17, fontWeight: 500}}>£</span>
                    <input 
                      className="ios-input" 
                      type="number" 
                      step="0.10"
                      placeholder="5.00" 
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <button className="primary-btn" type="submit" style={{marginTop: '40px'}}>
                Publish Listing
              </button>
            </form>
          </div>
        )}

        {/* --- NEW SECTION (Commit 16): USER PROFILE & SETTINGS --- */}
        {currentScreen === 'profile' && (
          <div className="screen" style={{overflowY: 'auto'}}>
            <div className="host-header" style={{paddingBottom: 0}}>
              <h2 style={{margin: 0, fontSize: 24, fontWeight: 800}}>Profile</h2>
              <button className="close-btn" onClick={() => setCurrentScreen('map')}>
                <X size={20} color="#000" />
              </button>
            </div>

            <div className="profile-header-card">
              <div className="avatar-circle">
                {email ? email.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 style={{margin: '0 0 4px 0', fontSize: 20}}>Driver Account</h3>
                <p style={{margin: 0, color: '#8E8E93', fontSize: 14}}>{email || 'test@parknow.com'}</p>
              </div>
            </div>

            <div className="settings-section-title">Past Bookings & Policies</div>
            
            {/* Displaying the Insurance Policy ID generated by the Backend in Section 4.2.2 */}
            <div className="booking-card">
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}>
                <span style={{fontWeight: 700}}>High St Garage</span>
                <span style={{color: '#8E8E93', fontSize: 14}}>Oct 12</span>
              </div>
              <div style={{fontSize: 14, color: '#333', marginBottom: 12}}>Duration: 3 Hours • £15.75</div>
              
              <div style={{display: 'flex', alignItems: 'center', gap: 6, color: '#34C759', fontSize: 12, fontWeight: 600, background: '#E8F8EE', padding: '6px 10px', borderRadius: 8, width: 'fit-content'}}>
                <ShieldCheck size={14} />
                Insurance Policy: #INS-992A-X
              </div>
            </div>

            <div className="settings-section-title" style={{marginTop: 25}}>Account Settings</div>
            <div className="ios-input-group">
              <div className="settings-row" onClick={() => alert('Payment settings coming soon.')}>
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                  <CreditCard size={20} color="#0056D2" />
                  <span style={{fontWeight: 500}}>Payment Methods</span>
                </div>
                <ChevronRight size={20} color="#C7C7CC" />
              </div>
              
              <div className="settings-row" onClick={() => setCurrentScreen('hostDashboard')}>
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                  <Home size={20} color="#0056D2" />
                  <span style={{fontWeight: 500}}>Switch to Host Dashboard</span>
                </div>
                <ChevronRight size={20} color="#C7C7CC" />
              </div>

              <div className="settings-row" onClick={handleLogout}>
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                  <LogOut size={20} color="#FF3B30" />
                  <span style={{fontWeight: 500, color: '#FF3B30'}}>Log Out</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </>
  );
}
export default App;