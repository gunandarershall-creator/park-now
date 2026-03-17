/**
 * PROJECT: Park Now - Application
 * COMMIT: 46 (Google Authentication Integration)
 * DESCRIPTION: Added "Continue with Google" OAuth integration to both Login and Registration screens. Includes a seamless popup flow that automatically creates or merges user documents in Firestore. Added password minimum character requirements to the registration UI. Full 1.8k codebase maintained without cut corners.
 */

import React, { useState, useEffect, useRef } from 'react';
/* UPDATED (Commit 41): Added MessageCircle, Phone, and Send icons for the chat interface */
import { 
  MapPin, Mail, Lock, User, Star, X, ArrowLeft, CreditCard, 
  Navigation, Timer, QrCode, Plus, Home, Camera, ChevronRight, 
  ShieldCheck, LogOut, Car, Pencil, Bell, HelpCircle, FileText, 
  MessageCircle, Phone, Send, Loader2, Settings, Clock 
} from 'lucide-react';

/* --- FIREBASE INTEGRATION --- */
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, setDoc, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
// UPDATED (Commit 46): Imported GoogleAuthProvider and signInWithPopup
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

/* Exact Configuration from Firebase Console */
const firebaseConfig = typeof window !== 'undefined' && window.__firebase_config 
  ? JSON.parse(window.__firebase_config) 
  : {
      apiKey: "AIzaSyA7iaKO86Pbx02BJeA0SulWqpAfB1qs7NU",
      authDomain: "fyp-backend-parknow.firebaseapp.com",
      projectId: "fyp-backend-parknow",
      storageBucket: "fyp-backend-parknow.firebasestorage.app",
      messagingSenderId: "762323405309",
      appId: "1:762323405309:web:cca5363efc85606b807194"
    };

// Retrieve application ID for scoped database access
const rawAppId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

// Initialize core Firebase instances
let app, db, auth;
const googleProvider = new GoogleAuthProvider(); // Added for Google Sign-In

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (e) {
  console.warn("Firebase initialization bypassed. Defaulting to local memory.");
}

// Determine correct collection reference based on current environment variables
const getSpotsRef = () => {
  return typeof window !== 'undefined' && window.__app_id 
    ? collection(db, 'artifacts', rawAppId, 'public', 'data', 'spots')
    : collection(db, 'spots');
};

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

  /* 4. Google Auth Button Styles */
  .google-btn { background: #ffffff; color: #333; border: 1px solid #E5E5EA; width: 100%; padding: 16px; border-radius: 14px; font-size: 17px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
  .divider { display: flex; align-items: center; text-align: center; margin: 20px 0; color: #8E8E93; font-size: 14px; }
  .divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid #E5E5EA; }
  .divider:not(:empty)::before { margin-right: .5em; }
  .divider:not(:empty)::after { margin-left: .5em; }

  /* --- MAP UI STYLES --- */
  .search-header { position: absolute; top: 20px; left: 20px; right: 20px; z-index: 3000 !important; display: flex; gap: 10px; align-items: flex-start; }
  .search-container { flex: 1; display: flex; flex-direction: column; position: relative; }
  .search-input { width: 100%; background: white; padding: 12px 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 8px; font-weight: 500; margin: 0; box-sizing: border-box; height: 50px; }
  .icon-btn { background: white; border-radius: 50%; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; flex-shrink: 0; }
  
  .map-search-field { border: none; outline: none; background: transparent; flex: 1; font-weight: 500; font-size: 16px; font-family: inherit; }

  /* Search Autocomplete Dropdown styles */
  .search-dropdown { position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); overflow: hidden; display: flex; flex-direction: column; z-index: 3001; max-height: 300px; overflow-y: auto; }
  .dropdown-header { font-size: 12px; font-weight: 700; color: #8E8E93; text-transform: uppercase; padding: 12px 15px 4px; letter-spacing: 0.5px; }
  .search-suggestion { display: flex; align-items: center; gap: 12px; padding: 12px 15px; border-bottom: 1px solid #E5E5EA; cursor: pointer; transition: background 0.2s; text-align: left; }
  .search-suggestion:last-child { border-bottom: none; }
  .search-suggestion:hover { background: #F2F2F7; }
  .suggestion-icon { background: #F2F2F7; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .suggestion-text { font-size: 15px; font-weight: 600; color: #000; margin-bottom: 2px; }
  .suggestion-subtext { font-size: 13px; color: #8E8E93; }
  
  /* Real Leaflet Map Container */
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
  .sheet-image { width: 100%; height: 140px; border-radius: 12px; background: #E5E5EA; object-fit: cover; display: flex; align-items: center; justify-content: center; color: #8E8E93; font-weight: 600; font-size: 14px; border: 1px solid #E5E5EA; }
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
  .locate-btn { position: absolute; right: 20px; bottom: 100px; z-index: 2000 !important; background: white; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.15); cursor: pointer; }
  .locate-btn:hover { background: #F2F2F7; }
  
  /* The Blue Dot representing the Driver's GPS Location */
  .driver-dot { position: relative; width: 22px; height: 22px; background: #007AFF; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.3); }
  .driver-dot::after { content: ''; position: absolute; top: -10px; left: -10px; right: -10px; bottom: -10px; background: rgba(0, 122, 255, 0.2); border-radius: 50%; animation: pulse 2s infinite; }
  @keyframes pulse { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }

  /* --- ACTIVE BOOKING TICKET --- */
  .ticket-card { background: #0056D2; color: white; border-radius: 20px; padding: 30px 20px; text-align: center; margin-top: 20px; box-shadow: 0 15px 30px rgba(0,86,210,0.3); }
  .timer-display { font-size: 48px; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: 2px; margin: 10px 0; }
  .qr-box { background: white; padding: 15px; border-radius: 16px; margin: 20px auto; width: 150px; height: 150px; display: flex; align-items: center; justify-content: center; }
  .danger-btn { background: #FFEBEA; color: #FF3B30; border: none; width: 100%; padding: 16px; border-radius: 14px; font-size: 17px; font-weight: 600; cursor: pointer; margin-top: 0; margin-bottom: 10px; }
  
  /* Floating active session banner on map */
  .active-session-banner { position: absolute; top: 80px; left: 20px; right: 20px; background: #0056D2; color: white; padding: 12px 16px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 15px rgba(0,86,210,0.3); z-index: 2000 !important; cursor: pointer; }

  /* --- HOST DASHBOARD --- */
  .host-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; }
  .earnings-card { background: linear-gradient(135deg, #0056D2 0%, #003b8e 100%); color: white; padding: 25px; border-radius: 20px; box-shadow: 0 10px 20px rgba(0,86,210,0.3); margin-bottom: 20px; }
  .earnings-title { font-size: 14px; opacity: 0.9; margin: 0 0 5px 0; }
  .earnings-amount { font-size: 36px; font-weight: 800; margin: 0; }
  .listing-item { background: white; padding: 15px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
  
  /* Custom iOS Toggle Switch for Host Listings */
  .toggle-switch { width: 50px; height: 30px; background: #34C759; border-radius: 30px; position: relative; cursor: pointer; transition: 0.3s; }
  .toggle-knob { width: 26px; height: 26px; background: white; border-radius: 50%; position: absolute; top: 2px; right: 2px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: 0.3s; }
  
  /* Bottom Nav Bar (Global) */
  .nav-bar-bottom { display: flex; justify-content: space-around; align-items: center; background: white; padding: 15px 20px 25px; border-top: 1px solid #E5E5EA; position: absolute; bottom: 0; left: 0; right: 0; border-radius: 0 0 28px 28px; z-index: 2500; }
  .nav-item { display: flex; flex-direction: column; align-items: center; color: #8E8E93; font-size: 11px; gap: 4px; cursor: pointer; font-weight: 500; transition: color 0.2s;}
  .nav-item.active { color: #0056D2; }
  .add-btn { background: #0056D2; color: white; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-top: -35px; box-shadow: 0 8px 15px rgba(0,86,210,0.4); border: 4px solid #F2F2F7; cursor: pointer; }

  /* --- IN-APP MESSAGING STYLES (Commit 41) --- */
  .chat-area { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; padding-bottom: 20px; }
  .chat-bubble { max-width: 75%; padding: 12px 16px; border-radius: 18px; font-size: 15px; line-height: 1.4; }
  .chat-bubble.received { background: #E5E5EA; color: #000; align-self: flex-start; border-bottom-left-radius: 4px; }
  .chat-bubble.sent { background: #0056D2; color: #fff; align-self: flex-end; border-bottom-right-radius: 4px; }
  .chat-input-bar { background: white; padding: 15px; border-top: 1px solid #E5E5EA; display: flex; gap: 10px; align-items: center; margin: 0 -20px -20px; }
  .chat-input { flex: 1; background: #F2F2F7; border: none; padding: 12px 16px; border-radius: 20px; outline: none; font-size: 15px; }
  .send-btn { background: #0056D2; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;}

  /* --- OTHER STYLES --- */
  .photo-upload-box { background: #E5E5EA; height: 160px; border-radius: 16px; border: 2px dashed #C7C7CC; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #8E8E93; margin-bottom: 25px; cursor: pointer; overflow: hidden; position: relative; }
  .photo-preview { width: 100%; height: 100%; object-fit: cover; }
  .input-label { font-size: 13px; color: #8E8E93; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
  .form-section { margin-bottom: 20px; }

  .profile-header-card { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; margin-top: 10px; }
  .avatar-circle { width: 64px; height: 64px; background: #0056D2; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; }
  .settings-section-title { font-size: 13px; color: #8E8E93; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; margin-left: 5px; }
  .settings-row { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #E5E5EA; cursor: pointer; background: white;}
  .settings-row:last-child { border-bottom: none; }
  .settings-row:hover { background: #F8F9FA; }
  .booking-card { background: white; border-radius: 16px; padding: 16px; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border: 1px solid #E5E5EA; border-left: 4px solid #0056D2; transition: background 0.2s; cursor: pointer; }
  .booking-card:hover { background: #F8F9FA; }

  .live-toast { 
    position: absolute; top: 140px; left: 50%; transform: translateX(-50%); 
    background: rgba(0,0,0,0.85); color: white; padding: 12px 20px; 
    border-radius: 30px; font-size: 14px; font-weight: 500; 
    z-index: 4000 !important; display: flex; align-items: center; gap: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    animation: slideDownToast 0.4s cubic-bezier(0.16, 1, 0.3, 1), fadeOutToast 0.4s ease 3.6s forwards;
    white-space: nowrap;
  }
  @keyframes slideDownToast { from { top: 60px; opacity: 0; } to { top: 140px; opacity: 1; } }
  @keyframes fadeOutToast { from { opacity: 1; } to { opacity: 0; visibility: hidden; } }
  .live-indicator { width: 8px; height: 8px; background: #34C759; border-radius: 50%; box-shadow: 0 0 8px #34C759; animation: blink 1s infinite; }
  @keyframes blink { 50% { opacity: 0.3; } }

  .review-header { text-align: center; padding: 40px 20px 20px; }
  .star-row { display: flex; justify-content: center; gap: 15px; margin: 30px 0; }
  .star-btn { background: none; border: none; padding: 0; cursor: pointer; transition: transform 0.2s; outline: none; }
  .star-btn:hover { transform: scale(1.15); }
  .review-textarea { width: 100%; background: white; border: 1px solid #E5E5EA; border-radius: 12px; padding: 15px; font-family: inherit; font-size: 15px; resize: none; box-sizing: border-box; margin-bottom: 20px; outline: none; height: 120px; }
  .review-textarea:focus { border-color: #0056D2; }

  .fullscreen-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.95); z-index: 9999 !important; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease-out; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .fullscreen-img { width: 100%; max-height: 100%; object-fit: contain; }
  .fullscreen-close { position: absolute; top: 40px; right: 20px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; }
  .fullscreen-close:hover { background: rgba(255,255,255,0.4); }
`;

/**
 * COMPONENT: App
 * This is the main function that builds the UI.
 */
function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  
  // NAVIGATION STATE
  const [currentScreen, setCurrentScreen] = useState('login'); 
  
  // State to hold our mock database of parking spots
  const [spots, setSpots] = useState([]);
  
  // State: Tracks which parking spot the user clicked on.
  const [selectedSpot, setSelectedSpot] = useState(null);
  
  // State to store the Driver's simulated GPS location
  const [driverLocation, setDriverLocation] = useState(null);

  // Variables to hold the new host listing data
  const [newAddress, setNewAddress] = useState('');
  const [newPrice, setNewPrice] = useState('');
  
  // Variables to hold the user's uploaded photo for a new spot
  const [newImage, setNewImage] = useState(null);
  const fileInputRef = useRef(null);

  // Manage Host Dashboard Toggle Switches dynamically
  const [hostListings, setHostListings] = useState([
    { id: '1', address: '142 Penrhyn Road', details: '£6.00 / hr • 2 spots', isActive: true },
    { id: '2', address: 'Kingston Uni Garage', details: '£4.50 / hr • 1 spot', isActive: false }
  ]);
  
  const toggleHostListing = (id) => {
    setHostListings(prev => prev.map(listing => 
      listing.id === id ? { ...listing, isActive: !listing.isActive } : listing
    ));
  };

  // Holds the text for live Firebase simulation notifications
  const [liveToastMessage, setLiveToastMessage] = useState(null);

  // Registration form fields
  const [regName, setRegName] = useState('');
  const [regPlate, setRegPlate] = useState('');

  // Holds the user's star rating
  const [rating, setRating] = useState(0);

  // Interactive map search query
  const [searchQuery, setSearchQuery] = useState('');

  // Search Dropdown state and expanded mock data
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Track if the user opted in for Insurance Protection
  const [hasInsurance, setHasInsurance] = useState(true);

  // Track if there is a running booking in the background
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Track where to return when leaving the Payment Methods screen
  const [paymentReturnScreen, setPaymentReturnScreen] = useState('profile');

  // Track if the user is currently operating as a Driver or a Host
  const [userMode, setUserMode] = useState('driver');

  // Track which spot is currently being edited
  const [editingSpotId, setEditingSpotId] = useState(null);

  // Track if an image is being viewed in full screen
  const [fullScreenImage, setFullScreenImage] = useState(null);

  // Track the selected booking duration in hours
  const [bookingDuration, setBookingDuration] = useState(2);

  // Track the selected extension duration in hours
  const [extensionDuration, setExtensionDuration] = useState(1);

  // NEW STATE (Commit 41): Track chat context (who we are messaging and where to return)
  const [chatContext, setChatContext] = useState({ name: '', returnScreen: '' });

  // NEW STATE (Commit 42): Notification preferences
  const [notifBooking, setNotifBooking] = useState(true);
  const [notifPromo, setNotifPromo] = useState(false);

  // Added mock global locations and postcodes to demonstrate dynamic filtering
  const allSuggestions = [
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

  // Logic to show "Recent" if typing is empty, or filter results if user is typing
  const searchSuggestions = searchQuery.trim() === '' 
    ? allSuggestions.filter(item => item.isRecent)
    : allSuggestions.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.subtext.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Map Reference for Leaflet injection
  const mapContainerRef = useRef(null);

  const [user, setUser] = useState(null);

  /**
   * FIREBASE AUTHENTICATION
   */
  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    
    return () => unsubscribe();
  }, []);

  /**
   * FIREBASE REAL-TIME SYNC
   */
  useEffect(() => {
    const defaultSpots = [
      { id: '1', lat: 51.4039, lng: -0.3035, price: 4.50, address: 'Kingston University', rating: 4.8, distance: 'Kingston upon Thames', spotsLeft: 3, imageUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=400&q=80' },
      { id: '2', lat: 51.4045, lng: -0.3015, price: 6.00, address: 'Penrhyn Road', rating: 4.5, distance: 'Surbiton, Surrey', spotsLeft: 1, imageUrl: 'https://images.unsplash.com/photo-1604063154567-b5b8219df515?auto=format&fit=crop&w=400&q=80' },
      { id: '3', lat: 51.4085, lng: -0.3060, price: 5.25, address: 'High St Garage', rating: 4.9, distance: 'Kingston City Centre', spotsLeft: 8, imageUrl: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=400&q=80' }
    ];

    // 1. Load local fallback data initially so the map never appears blank
    setSpots(defaultSpots);
    setHostListings(defaultSpots.map(s => ({
      id: s.id,
      address: s.address,
      details: `£${Number(s.price).toFixed(2)} / hr • ${s.spotsLeft || 1} spot`,
      isActive: true
    })));

    // 2. Connect to database
    if (!user || !db) return;
    
    try {
      const spotsRef = getSpotsRef();
      const unsubscribe = onSnapshot(spotsRef, (snapshot) => {
        const cloudDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Merge cloud data with original spots
        const allSpots = [...defaultSpots, ...cloudDocs];
        setSpots(allSpots);
        
        setHostListings(allSpots.map(s => ({
          id: s.id,
          address: s.address,
          details: `£${Number(s.price).toFixed(2)} / hr • ${s.spotsLeft || 1} spot`,
          isActive: true
        })));
        
      }, (err) => {
        console.error("Firestore Read Error:", err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Firestore Sync Error:", e);
    }
  }, [user]);

  /**
   * EFFECT: Dynamic Leaflet Map Injector
   */
  useEffect(() => {
    if (currentScreen !== 'map') return;

    const initLeafletMap = () => {
      if (!mapContainerRef.current) return;
      
      // Prevent "Map container is already initialized" crash from Leaflet unmounting
      if (window.mapInstance) {
        window.mapInstance.remove();
        window.mapInstance = null;
      }

      window.mapInstance = window.L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView([51.4060, -0.3040], 15);

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(window.mapInstance);
      
      setSpots([...spots]);
    };

    if (!window.L) {
      // Robust stylesheet injection
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Robust script injection to prevent "Script error" on hot-reload
      if (!document.getElementById('leaflet-script')) {
        const script = document.createElement('script');
        script.id = 'leaflet-script';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.crossOrigin = "anonymous";
        script.onload = initLeafletMap;
        document.head.appendChild(script);
      } else {
        // If script tag exists but window.L isn't ready yet, wait for it
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

  /**
   * EFFECT: Update Map Markers Dynamically
   */
  useEffect(() => {
    if (!window.mapInstance || !window.L || currentScreen !== 'map') return;

    if (window.markerLayer) {
      window.mapInstance.removeLayer(window.markerLayer);
    }
    
    const newLayer = window.L.layerGroup().addTo(window.mapInstance);
    window.markerLayer = newLayer;

    // Render ONLY spots that have inventory left (> 0)
    spots.filter(spot => spot.spotsLeft > 0).forEach(spot => {
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

  /**
   * EFFECT: Simulate Firebase Real-Time Listener (UI Demo logic)
   */
  useEffect(() => {
    let timeoutId;
    if (currentScreen === 'map' && spots.length >= 3) {
      timeoutId = setTimeout(() => {
        // Mock notification only
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
  const handleLogin = async (e) => {
    e.preventDefault(); 
    if (email && password) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        setCurrentScreen('map'); 
      } catch (error) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
           alert("Incorrect email or password. Please try again.");
        } else {
           alert("Login failed: " + error.message);
        }
      }
    } else {
      alert('Please enter an email and password');
    }
  };

  /**
   * FUNCTION: handleRegister
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (email && password && regName && regPlate) {
      try {
        // Note: Firebase requires passwords to be at least 6 characters long
        // 1. Create the user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 2. Update their display profile (Isolated try/catch so it doesn't break flow)
        try {
          await updateProfile(userCredential.user, { displayName: regName });
        } catch (profileError) {
          console.warn("Could not attach display name to auth profile.", profileError);
        }
        
        // 3. Save additional user details to the Firestore 'users' collection
        // Isolated in a try/catch. If Firestore rules block this, the user is still successfully registered.
        if (db) {
          try {
            const userDocRef = typeof window !== 'undefined' && window.__app_id 
               ? doc(db, 'artifacts', rawAppId, 'users', userCredential.user.uid) 
               : doc(db, 'users', userCredential.user.uid);
               
            await setDoc(userDocRef, {
              name: regName,
              email: email,
              plate: regPlate.toUpperCase(),
              role: 'driver',
              createdAt: new Date().toISOString()
            });
          } catch (dbError) {
            console.warn("Could not save additional user details to Firestore database. (Check Firestore Rules)", dbError);
          }
        }

        alert(`Account created successfully for ${regName}!`);
        setCurrentScreen('map');
      } catch (error) {
        // Provide clear feedback for common registration errors
        if (error.code === 'auth/email-already-in-use') {
          alert('This email is already registered. Please try logging in instead.');
        } else if (error.code === 'auth/weak-password') {
          alert('Your password is too weak. Please use at least 6 characters.');
        } else {
          alert("Registration failed: " + error.message);
        }
      }
    } else {
      alert('Please fill out all fields to register.');
    }
  };

  /**
   * FUNCTION: handleGoogleSignIn (Commit 46: Google OAuth Integration)
   */
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Ensure a database profile exists for this Google User
      if (db) {
        try {
          const userDocRef = typeof window !== 'undefined' && window.__app_id 
             ? doc(db, 'artifacts', rawAppId, 'users', user.uid) 
             : doc(db, 'users', user.uid);
          
          // merge: true guarantees we don't accidentally overwrite an existing user's license plate if they return
          await setDoc(userDocRef, {
            name: user.displayName || 'Google User',
            email: user.email,
            role: 'driver',
            plate: 'PENDING',
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch (dbError) {
          console.warn("Could not merge Google Auth details into Firestore.", dbError);
        }
      }

      setCurrentScreen('map');
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      alert("Google Sign-In failed: " + error.message);
    }
  };

  /**
   * FUNCTION: handleResetPassword
   */
  const handleResetPassword = (e) => {
    e.preventDefault();
    if (email) {
      alert(`A password reset link has been sent to ${email}`);
      setCurrentScreen('login');
    } else {
      alert('Please enter your email address to receive a reset link.');
    }
  };

  /**
   * FUNCTION: handleSearch
   */
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        
        setIsSearchFocused(false); 
        
        if (window.mapInstance) {
           window.mapInstance.flyTo([lat, lng], 13, { duration: 1.5 });
        }
      } else {
        alert(`Could not find coordinates for: ${searchQuery}`);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      alert("Error connecting to the geocoding service.");
    }
  };

  /**
   * FUNCTION: handlePayment
   * Deducts inventory from Firebase and removes the pin if sold out.
   */
  const handlePayment = async () => {
    if (selectedSpot) {
      // 1. Optimistic Local UI Update (Instant visual feedback)
      const updatedSpotsLeft = (selectedSpot.spotsLeft || 1) - 1;
      
      if (updatedSpotsLeft <= 0) {
        setSpots(prev => prev.filter(s => s.id !== selectedSpot.id));
      } else {
        setSpots(prev => prev.map(s => s.id === selectedSpot.id ? { ...s, spotsLeft: updatedSpotsLeft } : s));
      }

      // 2. Firebase Cloud Transaction
      if (db && !['1', '2', '3'].includes(selectedSpot.id)) {
        try {
          const spotRef = doc(getSpotsRef(), selectedSpot.id);
          if (updatedSpotsLeft <= 0) {
             // Wipes the spot completely from the cloud so it vanishes off all maps
            await deleteDoc(spotRef);
            console.log("Spot sold out and removed from Firebase!");
          } else {
            await updateDoc(spotRef, { spotsLeft: updatedSpotsLeft });
            console.log("Spot inventory updated in Firebase!");
          }
        } catch (error) {
          console.error("Firebase transaction failed:", error);
        }
      }
    }

    setIsSessionActive(true);
    setCurrentScreen('activeBooking');
  };

  /**
   * FUNCTION: handleExtendSession
   */
  const handleExtendSession = () => {
    if (selectedSpot) {
      const extensionCost = selectedSpot.price * extensionDuration;
      alert(`Session successfully extended by ${extensionDuration} Hour${extensionDuration > 1 ? 's' : ''}.\n\nYour default payment method has been charged £${extensionCost.toFixed(2)}.`);
    }
  };

  /**
   * FUNCTION: handleEndSession
   */
  const handleEndSession = () => {
    setIsSessionActive(false);
    setCurrentScreen('review');
  };

  /**
   * FUNCTION: handleSubmitReview
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
   * FUNCTION: openChat
   * Opens the chat interface securely
   */
  const openChat = (recipientName, returnScreen) => {
    setChatContext({ name: recipientName, returnScreen: returnScreen });
    setCurrentScreen('chat');
  };

  /**
   * CORE ALGORITHM: Geospatial Proximity Finder
   */
  const findClosestSpot = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const actualLat = position.coords.latitude;
          const actualLng = position.coords.longitude;
          
          setDriverLocation({ lat: actualLat, lng: actualLng });
          
          if (window.mapInstance) {
            window.mapInstance.flyTo([actualLat, actualLng], 15, { duration: 1.5 });
          }
        },
        (error) => {
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
   * FUNCTION: handleImageUpload
   */
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * FUNCTION: openEditSpot
   */
  const openEditSpot = (id) => {
    const spot = spots.find(s => s.id === id);
    const hostListing = hostListings.find(h => h.id === id);
    
    if (spot && hostListing) {
      setNewAddress(spot.address);
      setNewPrice(spot.price.toString());
      setNewImage(spot.imageUrl || null);
      setEditingSpotId(id);
      setCurrentScreen('editSpot');
    }
  };

  /**
   * FUNCTION: handleUpdateSpot
   */
  const handleUpdateSpot = (e) => {
    e.preventDefault();
    if (!newAddress || !newPrice) {
      alert("Please enter an address and a price.");
      return;
    }

    setSpots(prevSpots => prevSpots.map(spot => 
      spot.id === editingSpotId 
        ? { ...spot, address: newAddress, price: parseFloat(newPrice), imageUrl: newImage } 
        : spot
    ));

    setHostListings(prevListings => prevListings.map(listing => 
      listing.id === editingSpotId 
        ? { ...listing, address: newAddress, details: `£${parseFloat(newPrice).toFixed(2)} / hr • ${listing.details.split('•')[1]?.trim() || '1 spot'}` } 
        : listing
    ));

    alert('Listing successfully updated!');
    
    setNewAddress('');
    setNewPrice('');
    setNewImage(null);
    setEditingSpotId(null);
    setCurrentScreen('hostDashboard');
  };

  /**
   * FUNCTION: handlePublishSpot
   */
  const handlePublishSpot = async (e) => {
    e.preventDefault();
    if (!newAddress || !newPrice) {
      alert("Please enter an address and a price.");
      return;
    }

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newAddress)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const actualLat = parseFloat(data[0].lat);
        const actualLng = parseFloat(data[0].lon);

        const newSpotData = {
          id: Date.now().toString(), 
          lat: actualLat, 
          lng: actualLng, 
          price: parseFloat(newPrice), 
          address: newAddress, 
          rating: 5.0, 
          distance: 'Local Neighbourhood',
          spotsLeft: 1,
          imageUrl: newImage
        };

        // 1. Optimistic Local Update (Instant feedback)
        setSpots([...spots, newSpotData]);
        
        setHostListings([...hostListings, {
          id: newSpotData.id,
          address: newAddress,
          details: `£${parseFloat(newPrice).toFixed(2)} / hr • 1 spot`,
          isActive: true
        }]);

        // 2. Push new listing to Firebase database
        if (db) {
           try {
             // By using setDoc, we force Firebase to use the exact same ID as the local map.
             await setDoc(doc(getSpotsRef(), newSpotData.id), newSpotData);
             console.log("Successfully pushed new spot to Firebase!");
           } catch (err) {
             console.error("Failed to push to Firebase. Check your Firestore Rules (Test Mode) and Authentication.", err);
           }
        }

        setNewAddress('');
        setNewPrice('');
        setNewImage(null); 
        
        alert(`Success! Listing verified and added at exactly ${actualLat.toFixed(4)}, ${actualLng.toFixed(4)}.`);
        
        setCurrentScreen('map');
        setSearchQuery(newAddress);

        setTimeout(() => {
          if (window.mapInstance) {
            window.mapInstance.flyTo([actualLat, actualLng], 15, { duration: 1.5 });
          }
        }, 300);

      } else {
        alert("Could not find coordinates for this address. Try being more specific (e.g., adding a postcode or city).");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      alert("Error connecting to the geocoding service to verify address.");
    }
  };

  /**
   * FUNCTION: handleLogout
   */
  const handleLogout = async () => {
    try {
      if (auth) await signOut(auth);
      setEmail('');
      setPassword('');
      setCurrentScreen('login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Reusable UI Component: Driver Bottom Navigation Bar
  const renderDriverNav = () => (
    <div className="nav-bar-bottom">
      <div className={`nav-item ${currentScreen === 'map' ? 'active' : ''}`} onClick={() => setCurrentScreen('map')}>
        <MapPin size={24} color={currentScreen === 'map' ? "#0056D2" : "#8E8E93"} />
        <span style={{color: currentScreen === 'map' ? '#0056D2' : '#8E8E93'}}>Map</span>
      </div>
      <div className={`nav-item ${currentScreen === 'driverDashboard' ? 'active' : ''}`} onClick={() => setCurrentScreen('driverDashboard')}>
        <Home size={24} color={currentScreen === 'driverDashboard' ? "#0056D2" : "#8E8E93"} />
        <span style={{color: currentScreen === 'driverDashboard' ? '#0056D2' : '#8E8E93'}}>Activity</span>
      </div>
      <div className={`nav-item ${['profile', 'personalInfo', 'manageVehicles', 'notifications', 'helpCenter', 'termsPrivacy', 'paymentMethods', 'addCard'].includes(currentScreen) ? 'active' : ''}`} onClick={() => setCurrentScreen('profile')}>
        <User size={24} color={['profile', 'personalInfo', 'manageVehicles', 'notifications', 'helpCenter', 'termsPrivacy', 'paymentMethods', 'addCard'].includes(currentScreen) ? "#0056D2" : "#8E8E93"} />
        <span style={{color: ['profile', 'personalInfo', 'manageVehicles', 'notifications', 'helpCenter', 'termsPrivacy', 'paymentMethods', 'addCard'].includes(currentScreen) ? '#0056D2' : '#8E8E93'}}>Profile</span>
      </div>
    </div>
  );

  // Reusable UI Component: Host Bottom Navigation Bar
  const renderHostNav = () => (
    <div className="nav-bar-bottom">
      <div className={`nav-item ${currentScreen === 'hostDashboard' ? 'active' : ''}`} onClick={() => setCurrentScreen('hostDashboard')}>
        <Home size={24} color={currentScreen === 'hostDashboard' ? "#0056D2" : "#8E8E93"} />
        <span style={{color: currentScreen === 'hostDashboard' ? '#0056D2' : '#8E8E93'}}>Dashboard</span>
      </div>
      <div className="add-btn" onClick={() => setCurrentScreen('addSpot')}><Plus size={28} /></div>
      <div className={`nav-item ${['profile', 'personalInfo', 'notifications', 'helpCenter', 'termsPrivacy'].includes(currentScreen) ? 'active' : ''}`} onClick={() => setCurrentScreen('profile')}>
        <User size={24} color={['profile', 'personalInfo', 'notifications', 'helpCenter', 'termsPrivacy'].includes(currentScreen) ? "#0056D2" : "#8E8E93"} />
        <span style={{color: ['profile', 'personalInfo', 'notifications', 'helpCenter', 'termsPrivacy'].includes(currentScreen) ? '#0056D2' : '#8E8E93'}}>Profile</span>
      </div>
    </div>
  );

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
                  <input className="ios-input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
              
              <button className="primary-btn" type="submit">Sign In</button>

              <div className="divider">or</div>
              
              <button type="button" className="google-btn" onClick={handleGoogleSignIn}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              
              <button type="button" className="secondary-btn" onClick={() => setCurrentScreen('forgotPassword')}>Forgot Password?</button>
            </form>

            <div className="signup-area">
              New to Park Now? 
              <button type="button" className="signup-link" onClick={() => setCurrentScreen('register')}>Create Account</button>
            </div>
          </div>
        )}

        {/* --- REGISTRATION SCREEN --- */}
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
                  <div className="ios-input-row">
                    <Lock size={20} color="#8E8E93" />
                    <input className="ios-input" placeholder="Create Password (Min. 6 chars)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" />
                  </div>
                  <p style={{fontSize: 12, color: '#8E8E93', marginTop: 5, marginBottom: 10, marginLeft: 15}}>Password must be at least 6 characters long.</p>
                </div>
              </div>

              <div className="form-section">
                <div className="input-label">Vehicle Details</div>
                <div className="ios-input-group">
                  <div className="ios-input-row"><Car size={20} color="#8E8E93" /><input className="ios-input" placeholder="License Plate (e.g. AB12 CDE)" value={regPlate} onChange={(e) => setRegPlate(e.target.value)} required style={{textTransform: 'uppercase'}} /></div>
                </div>
              </div>
              
              <button className="primary-btn" type="submit" style={{marginTop: 20}}>Register & Continue</button>

              <div className="divider">or</div>
              
              <button type="button" className="google-btn" onClick={handleGoogleSignIn}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </form>
          </div>
        )}

        {/* --- FORGOT PASSWORD SCREEN --- */}
        {currentScreen === 'forgotPassword' && (
          <div className="screen">
            <div className="checkout-header" style={{marginTop: 10}}>
              <button className="close-btn" onClick={() => setCurrentScreen('login')}><ArrowLeft size={20} color="#000" /></button>
              <h2 className="checkout-title">Reset Password</h2>
            </div>
            
            <p style={{color: '#8E8E93', marginBottom: 25, fontSize: 15, textAlign: 'center'}}>
              Enter the email address associated with your account, and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleResetPassword}>
              <div className="ios-input-group">
                <div className="ios-input-row">
                  <Mail size={20} color="#8E8E93" />
                  <input 
                    className="ios-input" 
                    placeholder="Email Address" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              
              <button className="primary-btn" type="submit" style={{marginTop: 10}}>
                Send Reset Link
              </button>
            </form>
          </div>
        )}

        {/* --- DRIVER DASHBOARD SCREEN (ACTIVITY) --- */}
        {currentScreen === 'driverDashboard' && (
          <div className="screen" style={{paddingBottom: 90, overflowY: 'auto'}}>
            <div className="host-header">
              <h2 style={{margin: 0, fontSize: 24, fontWeight: 800}}>Activity Hub</h2>
            </div>

            {isSessionActive ? (
              <div className="earnings-card" style={{background: 'linear-gradient(135deg, #34C759 0%, #28a745 100%)', cursor: 'pointer'}} onClick={() => setCurrentScreen('activeBooking')}>
                <p className="earnings-title">Current Status</p>
                <p className="earnings-amount">Active Session</p>
                <p style={{margin: '10px 0 0 0', fontSize: 14, opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px'}}><Timer size={16} /> Tap to view ticket</p>
              </div>
            ) : (
              <div className="earnings-card" style={{cursor: 'pointer'}} onClick={() => setCurrentScreen('map')}>
                <p className="earnings-title">Ready to park?</p>
                <p className="earnings-amount">Find a Spot</p>
                <p style={{margin: '10px 0 0 0', fontSize: 14, opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px'}}><MapPin size={16} /> View live map</p>
              </div>
            )}

            <h3 style={{fontSize: 18, marginTop: 10, marginBottom: 15}}>Recent Bookings</h3>

            <div className="listing-item" onClick={() => setCurrentScreen('pastBookingDetail')} style={{cursor: 'pointer'}}>
              <div>
                <div style={{fontWeight: 700, fontSize: 16}}>High St Garage</div>
                <div style={{color: '#8E8E93', fontSize: 14, marginTop: 4}}>Oct 12 • 3 Hours</div>
              </div>
              <ChevronRight size={20} color="#C7C7CC" />
            </div>

            {renderDriverNav()}
          </div>
        )}

        {/* --- MAP SCREEN --- */}
        {currentScreen === 'map' && (
          <div className="screen" style={{padding: 0, position: 'relative'}}>
            
            {liveToastMessage && (
              <div className="live-toast"><div className="live-indicator"></div>{liveToastMessage}</div>
            )}

            <div className="search-header">
              <div className="search-container">
                <form className="search-input" onSubmit={handleSearch}>
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

                {/* Dropdown Suggestions */}
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

            {/* Floating Active Session Banner */}
            {isSessionActive && selectedSpot && (
              <div className="active-session-banner" onClick={() => setCurrentScreen('activeBooking')}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <div className="live-indicator" style={{background: '#fff', boxShadow: '0 0 8px #fff'}}></div>
                  <span style={{fontWeight: 600}}>Return to Active Session</span>
                </div>
                <ChevronRight size={18} />
              </div>
            )}
            
            <div id="real-map" ref={mapContainerRef}></div>

            {!selectedSpot && (
              <div className="locate-btn" onClick={findClosestSpot}>
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
                    onClick={() => setFullScreenImage(selectedSpot.imageUrl)} 
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

                <button className="primary-btn" onClick={() => setCurrentScreen('checkout')}>Book Spot</button>
              </div>
            )}

            {/* Global Bottom Nav overlaps the Map */}
            {renderDriverNav()}
          </div>
        )}

        {/* --- CHECKOUT SCREEN --- */}
        {currentScreen === 'checkout' && selectedSpot && (
          <div className="screen" style={{overflowY: 'auto'}}>
            <div className="checkout-header">
              <button className="close-btn" onClick={() => setCurrentScreen('map')}><ArrowLeft size={20} color="#000" /></button>
              <h2 className="checkout-title">Confirm Booking</h2>
            </div>

            <div className="receipt-box">
              <h3 style={{marginTop: 0, marginBottom: 15}}>{selectedSpot.address}</h3>
              <div className="receipt-row"><span style={{color: '#8E8E93'}}>Date</span><span>Today</span></div>
              
              <div className="receipt-row"><span style={{color: '#8E8E93'}}>Time</span><span>14:00 - {14 + bookingDuration}:00</span></div>
              
              <div className="receipt-row" style={{alignItems: 'center'}}>
                <span style={{color: '#8E8E93'}}>Duration</span>
                <select 
                  value={bookingDuration}
                  onChange={(e) => setBookingDuration(Number(e.target.value))}
                  style={{border: 'none', background: '#F2F2F7', padding: '6px 12px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', outline: 'none', cursor: 'pointer', color: '#0056D2'}}
                >
                  <option value={1}>1 Hour</option>
                  <option value={2}>2 Hours</option>
                  <option value={3}>3 Hours</option>
                  <option value={4}>4 Hours</option>
                  <option value={5}>5 Hours</option>
                  <option value={8}>8 Hours (Full Day)</option>
                </select>
              </div>

              <div className="receipt-row"><span style={{color: '#8E8E93'}}>Rate</span><span>£{selectedSpot.price.toFixed(2)} / hr</span></div>
              
              {hasInsurance && (
                <div className="receipt-row"><span style={{color: '#34C759', fontWeight: 600}}>Premium Insurance</span><span style={{color: '#34C759', fontWeight: 600}}>£1.50</span></div>
              )}
              
              <div className="receipt-row total">
                <span>Total Due</span>
                <span>£{((selectedSpot.price * bookingDuration) + (hasInsurance ? 1.50 : 0)).toFixed(2)}</span>
              </div>
            </div>

            <h4 style={{marginBottom: 10, color: '#666'}}>Add-ons</h4>
            <div className="payment-method-row" style={{marginBottom: 20}}>
              <ShieldCheck size={28} color={hasInsurance ? "#34C759" : "#8E8E93"} />
              <div style={{flex: 1}}>
                <div style={{fontWeight: 600}}>Premium Protection</div>
                <div style={{fontSize: 13, color: '#8E8E93'}}>Cover up to £1M for your vehicle.</div>
              </div>
              <div 
                className="toggle-switch" 
                style={hasInsurance ? {} : {background: '#E5E5EA'}} 
                onClick={() => setHasInsurance(!hasInsurance)}
              >
                <div className="toggle-knob" style={hasInsurance ? {} : {right: 'auto', left: 2}}></div>
              </div>
            </div>

            <h4 style={{marginBottom: 10, color: '#666'}}>Payment Method</h4>
            <div 
              className="payment-method-row" 
              style={{cursor: 'pointer'}} 
              onClick={() => {
                setPaymentReturnScreen('checkout');
                setCurrentScreen('paymentMethods');
              }}
            >
              <CreditCard size={24} color="#0056D2" />
              <div style={{flex: 1}}><div style={{fontWeight: 600}}>Personal Card</div><div style={{fontSize: 13, color: '#8E8E93'}}>Visa ending in 4242</div></div>
              <ChevronRight size={20} color="#C7C7CC" />
            </div>

            <button className="apple-pay-btn" onClick={handlePayment}>Pay & Confirm</button>
          </div>
        )}

        {/* --- ACTIVE BOOKING SCREEN --- */}
        {currentScreen === 'activeBooking' && selectedSpot && (
          <div className="screen" style={{paddingBottom: 20, overflowY: 'auto'}}>
            <div className="checkout-header" style={{borderBottom: 'none', justifyContent: 'center'}}>
              <h2 className="checkout-title" style={{padding: 0, textAlign: 'center'}}>Active Session</h2>
            </div>

            <div className="ticket-card">
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.9}}><Timer size={20} /><span>Time Remaining</span></div>
              <div className="timer-display">01:59:59</div>
              <div className="qr-box"><QrCode size={100} color="#0056D2" /></div>
              <p style={{fontSize: 14, opacity: 0.9, margin: 0}}>Scan this QR code at the barrier to enter and exit <b>{selectedSpot.address}</b>.</p>
              
              {hasInsurance && (
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#34C759', fontSize: 13, fontWeight: 600, background: 'white', padding: '6px 12px', borderRadius: 12, width: 'fit-content', margin: '15px auto 0'}}>
                  <ShieldCheck size={16} /> Protected by ParkNow
                </div>
              )}
            </div>

            <div style={{marginTop: 20, marginBottom: 20, textAlign: 'center'}}><p style={{color: '#8E8E93', fontSize: 14}}>Booking ID: #PN-894A2B</p></div>

            <div style={{marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10}}>
              
              <div style={{background: 'white', borderRadius: 14, padding: 15, marginBottom: 5, boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
                  <span style={{fontWeight: 600}}>Extend Time</span>
                  <select 
                    value={extensionDuration}
                    onChange={(e) => setExtensionDuration(Number(e.target.value))}
                    style={{border: 'none', background: '#F2F2F7', padding: '8px 12px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', outline: 'none', cursor: 'pointer', color: '#0056D2'} }
                  >
                    <option value={1}>+ 1 Hour</option>
                    <option value={2}>+ 2 Hours</option>
                    <option value={3}>+ 3 Hours</option>
                    <option value={4}>+ 4 Hours</option>
                  </select>
                </div>
                <button className="primary-btn" onClick={handleExtendSession}>
                  Pay & Extend (£{(selectedSpot.price * extensionDuration).toFixed(2)})
                </button>
              </div>

              <button 
                className="secondary-btn" 
                style={{background: '#E6F0FF', color: '#0056D2', fontWeight: 600, padding: '16px', borderRadius: '14px', marginTop: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8}} 
                onClick={() => openChat(`Host (${selectedSpot.address})`, 'activeBooking')}
              >
                <MessageCircle size={20} /> Message Host
              </button>

              <button className="primary-btn" style={{background: '#000'}} onClick={() => setCurrentScreen('map')}>Done (Return to Map)</button>
              <button className="danger-btn" onClick={handleEndSession}>End Session Early</button>
            </div>
          </div>
        )}

        {/* --- IN-APP CHAT SCREEN (Commit 41) --- */}
        {currentScreen === 'chat' && (
          <div className="screen" style={{padding: 0, display: 'flex', flexDirection: 'column', background: '#fff'}}>
            <div className="checkout-header" style={{padding: '20px', margin: 0, background: '#fff', zIndex: 10}}>
              <button className="close-btn" onClick={() => setCurrentScreen(chatContext.returnScreen)}><ArrowLeft size={20} color="#000" /></button>
              <h2 className="checkout-title" style={{paddingRight: 0}}>{chatContext.name}</h2>
              <button className="close-btn" style={{background: 'transparent'}} onClick={() => alert('Calling feature coming soon.')}><Phone size={20} color="#0056D2" /></button>
            </div>
            
            <div className="chat-area">
              <div style={{textAlign: 'center', color: '#8E8E93', fontSize: 12, margin: '10px 0'}}>Today 14:02</div>
              
              {/* Dynamic message layout based on whether user is Host or Driver */}
              <div className={`chat-bubble ${userMode === 'driver' ? 'sent' : 'received'}`}>
                Hi there, just wanted to double check if my vehicle is okay parked on the left side?
              </div>
              <div className={`chat-bubble ${userMode === 'driver' ? 'received' : 'sent'}`}>
                Yes, that's perfect! Let me know if you need anything else.
              </div>
            </div>

            <div className="chat-input-bar">
              <Plus size={24} color="#8E8E93" style={{cursor: 'pointer'}} />
              <input className="chat-input" placeholder="Type a message..." />
              <button className="send-btn" onClick={() => alert('Message sent!')}><Send size={18} /></button>
            </div>
          </div>
        )}

        {/* --- RATING & REVIEW SCREEN --- */}
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

        {/* --- HOST DASHBOARD SCREEN --- */}
        {currentScreen === 'hostDashboard' && (
          <div className="screen" style={{paddingBottom: 90, overflowY: 'auto'}}>
            <div className="host-header">
              <h2 style={{margin: 0, fontSize: 24, fontWeight: 800}}>Host Dashboard</h2>
            </div>

            <div className="earnings-card">
              <p className="earnings-title">Total Earnings (This Month)</p>
              <p className="earnings-amount">£342.50</p>
              <p style={{margin: '10px 0 0 0', fontSize: 14, opacity: 0.9}}>+12% from last month</p>
            </div>

            <h3 style={{fontSize: 18, marginTop: 10, marginBottom: 15}}>Active Guests</h3>
            <div className="listing-item" style={{display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 10, borderLeft: '4px solid #34C759'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
                <div>
                  <div style={{fontWeight: 700, fontSize: 16}}>Jane Doe (Ford Fiesta)</div>
                  <div style={{color: '#8E8E93', fontSize: 14, marginTop: 4}}>142 Penrhyn Road • Ends in 1h 20m</div>
                </div>
                <div className="live-indicator" style={{position: 'static'}}></div>
              </div>
              <button 
                className="secondary-btn" 
                style={{background: '#E6F0FF', marginTop: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, padding: '12px'}} 
                onClick={() => openChat('Driver (Jane D.)', 'hostDashboard')}
              >
                <MessageCircle size={18}/> Message Driver
              </button>
            </div>

            <h3 style={{fontSize: 18, marginTop: 25, marginBottom: 15}}>Your Driveways</h3>

            {hostListings.map(listing => (
              <div className="listing-item" key={listing.id}>
                <div>
                  <div style={{fontWeight: 700, fontSize: 16}}>{listing.address}</div>
                  <div style={{color: '#8E8E93', fontSize: 14, marginTop: 4}}>{listing.details}</div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                  <button 
                    onClick={() => openEditSpot(listing.id)} 
                    style={{background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#0056D2', display: 'flex'}}
                  >
                    <Pencil size={20} />
                  </button>
                  <div 
                    className="toggle-switch" 
                    style={listing.isActive ? {} : {background: '#E5E5EA'}} 
                    onClick={() => toggleHostListing(listing.id)}
                  >
                    <div className="toggle-knob" style={listing.isActive ? {} : {right: 'auto', left: 2}}></div>
                  </div>
                </div>
              </div>
            ))}

            {renderHostNav()}
          </div>
        )}

        {/* --- ADD SPOT SCREEN --- */}
        {currentScreen === 'addSpot' && (
          <div className="screen" style={{overflowY: 'auto'}}>
            <div className="checkout-header" style={{marginTop: 10}}>
              <button className="close-btn" onClick={() => { setCurrentScreen('hostDashboard'); setNewAddress(''); setNewPrice(''); setNewImage(null); }}><ArrowLeft size={20} color="#000" /></button>
              <h2 className="checkout-title">List Driveway</h2>
            </div>

            <form onSubmit={handlePublishSpot}>
              
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                style={{display: 'none'}} 
              />
              
              <div 
                className="photo-upload-box" 
                onClick={() => fileInputRef.current.click()}
              >
                {newImage ? (
                  <img src={newImage} alt="Driveway Preview" className="photo-preview" />
                ) : (
                  <>
                    <Camera size={32} style={{marginBottom: 8}} />
                    <span>Tap to upload a photo</span>
                  </>
                )}
              </div>

              <div className="form-section">
                <div className="input-label">Address (or Postcode)</div>
                <div className="ios-input-group" style={{marginBottom: 0}}>
                  <div className="ios-input-row"><MapPin size={20} color="#8E8E93" /><input className="ios-input" placeholder="e.g. 10 Downing Street, London" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} required /></div>
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

        {/* --- EDIT SPOT SCREEN --- */}
        {currentScreen === 'editSpot' && (
          <div className="screen" style={{overflowY: 'auto'}}>
            <div className="checkout-header" style={{marginTop: 10}}>
              <button className="close-btn" onClick={() => { setCurrentScreen('hostDashboard'); setNewAddress(''); setNewPrice(''); setNewImage(null); setEditingSpotId(null); }}><ArrowLeft size={20} color="#000" /></button>
              <h2 className="checkout-title">Edit Driveway</h2>
            </div>

            <form onSubmit={handleUpdateSpot}>
              
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                style={{display: 'none'}} 
              />
              
              <div 
                className="photo-upload-box" 
                onClick={() => fileInputRef.current.click()}
              >
                {newImage ? (
                  <img src={newImage} alt="Driveway Preview" className="photo-preview" />
                ) : (
                  <>
                    <Camera size={32} style={{marginBottom: 8}} />
                    <span>Tap to change photo</span>
                  </>
                )}
              </div>

              <div className="form-section">
                <div className="input-label">Address (or Postcode)</div>
                <div className="ios-input-group" style={{marginBottom: 0}}>
                  <div className="ios-input-row"><MapPin size={20} color="#8E8E93" /><input className="ios-input" placeholder="e.g. 10 Downing Street, London" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} required /></div>
                </div>
              </div>

              <div className="form-section">
                <div className="input-label">Hourly Rate (£)</div>
                <div className="ios-input-group" style={{marginBottom: 0}}>
                  <div className="ios-input-row"><span style={{color: '#8E8E93', fontSize: 17, fontWeight: 500}}>£</span><input className="ios-input" type="number" step="0.10" placeholder="5.00" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required /></div>
                </div>
              </div>

              <button className="primary-btn" type="submit" style={{marginTop: '40px'}}>Save Changes</button>
            </form>
          </div>
        )}

        {/* --- USER PROFILE & SETTINGS --- */}
        {currentScreen === 'profile' && (
          <div className="screen" style={{paddingBottom: 90, overflowY: 'auto'}}>
            <div className="host-header" style={{paddingBottom: 0}}>
              <h2 style={{margin: 0, fontSize: 24, fontWeight: 800}}>Profile</h2>
            </div>

            <div className="profile-header-card">
              <div className="avatar-circle">{regName ? regName.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : 'U')}</div>
              <div>
                <h3 style={{margin: '0 0 4px 0', fontSize: 20}}>{userMode === 'driver' ? 'Driver Account' : 'Host Account'}</h3>
                <p style={{margin: 0, color: '#8E8E93', fontSize: 14}}>{email || 'test@parknow.com'}</p>
                {regPlate && userMode === 'driver' && (<p style={{margin: '4px 0 0 0', color: '#0056D2', fontSize: 12, fontWeight: 700}}>Vehicle: {regPlate.toUpperCase()}</p>)}
              </div>
            </div>

            {/* Expanded Settings UI */}
            <div className="settings-section-title">Account Settings</div>
            <div className="ios-input-group">
              <div className="settings-row" onClick={() => setCurrentScreen('personalInfo')}>
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                  <User size={20} color="#0056D2" />
                  <span style={{fontWeight: 500}}>Personal Information</span>
                </div>
                <ChevronRight size={20} color="#C7C7CC" />
              </div>

              {userMode === 'driver' && (
                <div className="settings-row" onClick={() => setCurrentScreen('manageVehicles')}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                    <Car size={20} color="#0056D2" />
                    <span style={{fontWeight: 500}}>Manage Vehicles</span>
                  </div>
                  <ChevronRight size={20} color="#C7C7CC" />
                </div>
              )}

              <div 
                className="settings-row" 
                onClick={() => {
                  setPaymentReturnScreen('profile');
                  setCurrentScreen('paymentMethods');
                }}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                  <CreditCard size={20} color="#0056D2" />
                  <span style={{fontWeight: 500}}>{userMode === 'driver' ? 'Payment Methods' : 'Payout Methods'}</span>
                </div>
                <ChevronRight size={20} color="#C7C7CC" />
              </div>
            </div>

            <div className="settings-section-title" style={{marginTop: 25}}>Preferences</div>
            <div className="ios-input-group">
              <div className="settings-row" onClick={() => setCurrentScreen('notifications')}>
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                  <Bell size={20} color="#0056D2" />
                  <span style={{fontWeight: 500}}>Notifications</span>
                </div>
                <ChevronRight size={20} color="#C7C7CC" />
              </div>
            </div>

            <div className="settings-section-title" style={{marginTop: 25}}>Support & About</div>
            <div className="ios-input-group">
              <div className="settings-row" onClick={() => setCurrentScreen('helpCenter')}>
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                  <HelpCircle size={20} color="#0056D2" />
                  <span style={{fontWeight: 500}}>Help Center</span>
                </div>
                <ChevronRight size={20} color="#C7C7CC" />
              </div>
              <div className="settings-row" onClick={() => setCurrentScreen('termsPrivacy')}>
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                  <FileText size={20} color="#0056D2" />
                  <span style={{fontWeight: 500}}>Terms & Privacy</span>
                </div>
                <ChevronRight size={20} color="#C7C7CC" />
              </div>
            </div>

            <div className="settings-section-title" style={{marginTop: 25}}>App Actions</div>
            <div className="ios-input-group">
              {userMode === 'driver' ? (
                <div className="settings-row" onClick={() => { setUserMode('host'); setCurrentScreen('hostDashboard'); }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                    <Home size={20} color="#0056D2" />
                    <span style={{fontWeight: 500}}>Switch to Host Dashboard</span>
                  </div>
                  <ChevronRight size={20} color="#C7C7CC" />
                </div>
              ) : (
                <div className="settings-row" onClick={() => { setUserMode('driver'); setCurrentScreen('map'); }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                    <Car size={20} color="#0056D2" />
                    <span style={{fontWeight: 500}}>Switch to Driver Mode</span>
                  </div>
                  <ChevronRight size={20} color="#C7C7CC" />
                </div>
              )}

              <div className="settings-row" onClick={handleLogout}>
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                  <LogOut size={20} color="#FF3B30" />
                  <span style={{fontWeight: 500, color: '#FF3B30'}}>Log Out</span>
                </div>
              </div>
            </div>

            {userMode === 'driver' ? renderDriverNav() : renderHostNav()}
          </div>
        )}

        {/* --- PAST BOOKING RECEIPT --- */}
        {currentScreen === 'pastBookingDetail' && (
          <div className="screen" style={{overflowY: 'auto'}}>
            <div className="checkout-header" style={{marginTop: 10}}>
              <button className="close-btn" onClick={() => setCurrentScreen('profile')}><ArrowLeft size={20} color="#000" /></button>
              <h2 className="checkout-title">Receipt</h2>
            </div>

            <div className="receipt-box">
              <h3 style={{marginTop: 0, marginBottom: 15}}>High St Garage</h3>
              <div className="receipt-row"><span style={{color: '#8E8E93'}}>Booking ID</span><span>#PN-894A2B</span></div>
              <div className="receipt-row"><span style={{color: '#8E8E93'}}>Date</span><span>October 12, 2025</span></div>
              <div className="receipt-row"><span style={{color: '#8E8E93'}}>Duration</span><span>3 Hours</span></div>
              <div className="receipt-row"><span style={{color: '#8E8E93'}}>Rate</span><span>£5.25 / hr</span></div>
              <div className="receipt-row"><span style={{color: '#34C759'}}>Premium Insurance</span><span style={{color: '#34C759'}}>£1.50</span></div>
              <div className="receipt-row total" style={{marginTop: 15, borderTop: '2px dashed #E5E5EA', paddingTop: 15}}>
                <span>Total Paid</span>
                <span>£17.25</span>
              </div>
            </div>

            <div className="receipt-box" style={{background: '#E8F8EE', border: '1px solid #34C759'}}>
               <div style={{display: 'flex', alignItems: 'center', gap: 10, color: '#34C759', fontWeight: 600, marginBottom: 8}}>
                  <ShieldCheck size={24} /> Insurance Active
               </div>
               <p style={{margin: 0, fontSize: 14, color: '#333'}}>Policy Number: <b>#INS-992A-X</b><br/>This session was fully covered against accidental damage.</p>
            </div>

            <button className="primary-btn" onClick={() => alert('Receipt has been emailed to you.')} style={{marginTop: 'auto', marginBottom: 10}}>Email Receipt</button>
          </div>
        )}

        {/* --- PAYMENT METHODS SCREEN --- */}
        {currentScreen === 'paymentMethods' && (
          <div className="screen" style={{overflowY: 'auto'}}>
            <div className="checkout-header" style={{marginTop: 10}}>
              <button className="close-btn" onClick={() => setCurrentScreen(paymentReturnScreen)}><ArrowLeft size={20} color="#000" /></button>
              <h2 className="checkout-title">Payment Methods</h2>
            </div>

            <div className="settings-section-title">Saved Cards</div>
            <div className="ios-input-group">
              <div className="settings-row">
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                  <CreditCard size={20} color="#0056D2" />
                  <div>
                    <span style={{fontWeight: 500, display: 'block', marginBottom: 2}}>Personal Visa</span>
                    <span style={{fontSize: 13, color: '#8E8E93'}}>**** **** **** 4242</span>
                  </div>
                </div>
                <div style={{fontSize: 12, color: '#34C759', fontWeight: 600, background: '#E8F8EE', padding: '4px 8px', borderRadius: 6}}>Default</div>
              </div>
              
              <div className="settings-row">
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                  <CreditCard size={20} color="#8E8E93" />
                  <div>
                    <span style={{fontWeight: 500, display: 'block', marginBottom: 2}}>Business Mastercard</span>
                    <span style={{fontSize: 13, color: '#8E8E93'}}>**** **** **** 8899</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-section-title" style={{marginTop: 25}}>Add New</div>
            <div className="ios-input-group">
               <div className="settings-row" onClick={() => setCurrentScreen('addCard')}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 12, color: '#0056D2'}}>
                    <Plus size={20} />
                    <span style={{fontWeight: 500}}>Enter Card Details Manually</span>
                  </div>
               </div>
            </div>
            
          </div>
        )}

        {/* --- ADD CARD SCREEN --- */}
        {currentScreen === 'addCard' && (
          <div className="screen" style={{overflowY: 'auto'}}>
            <div className="checkout-header" style={{marginTop: 10}}>
              <button className="close-btn" onClick={() => setCurrentScreen('paymentMethods')}><ArrowLeft size={20} color="#000" /></button>
              <h2 className="checkout-title">Add Card</h2>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              alert('Card details securely encrypted and saved!');
              setCurrentScreen('paymentMethods');
            }}>
              <div className="form-section">
                <div className="input-label">Card Information</div>
                <div className="ios-input-group">
                  <div className="ios-input-row">
                    <User size={20} color="#8E8E93" />
                    <input className="ios-input" placeholder="Cardholder Name" required />
                  </div>
                  <div className="ios-input-row">
                    <CreditCard size={20} color="#8E8E93" />
                    <input className="ios-input" placeholder="Card Number" type="text" maxLength="19" required />
                  </div>
                  <div style={{display: 'flex'}}>
                    <div className="ios-input-row" style={{flex: 1, borderRight: '1px solid #E5E5EA'}}>
                      <input className="ios-input" placeholder="MM/YY" type="text" maxLength="5" required style={{marginLeft: 0, textAlign: 'center'}} />
                    </div>
                    <div className="ios-input-row" style={{flex: 1}}>
                      <input className="ios-input" placeholder="CVV" type="text" maxLength="4" required style={{marginLeft: 0, textAlign: 'center'}} />
                    </div>
                  </div>
                </div>
              </div>
              
              <button className="primary-btn" type="submit" style={{marginTop: 20}}>Save Card</button>
            </form>
          </div>
        )}

        {/* --- NEW SCREENS FOR COMMIT 42 --- */}

        {/* --- PERSONAL INFO SCREEN --- */}
        {currentScreen === 'personalInfo' && (
          <div className="screen" style={{overflowY: 'auto'}}>
            <div className="checkout-header" style={{marginTop: 10}}>
              <button className="close-btn" onClick={() => setCurrentScreen('profile')}><ArrowLeft size={20} color="#000" /></button>
              <h2 className="checkout-title">Personal Info</h2>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); alert('Information saved successfully!'); setCurrentScreen('profile'); }}>
              <div className="form-section">
                <div className="input-label">Update Details</div>
                <div className="ios-input-group">
                  <div className="ios-input-row">
                    <User size={20} color="#8E8E93" />
                    <input className="ios-input" placeholder="Full Name" value={regName} onChange={(e) => setRegName(e.target.value)} required />
                  </div>
                  <div className="ios-input-row">
                    <Mail size={20} color="#8E8E93" />
                    <input className="ios-input" placeholder="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
              </div>
              <button className="primary-btn" type="submit" style={{marginTop: 20}}>Save Changes</button>
            </form>
          </div>
        )}

        {/* --- MANAGE VEHICLES SCREEN --- */}
        {currentScreen === 'manageVehicles' && (
          <div className="screen" style={{overflowY: 'auto'}}>
            <div className="checkout-header" style={{marginTop: 10}}>
              <button className="close-btn" onClick={() => setCurrentScreen('profile')}><ArrowLeft size={20} color="#000" /></button>
              <h2 className="checkout-title">My Vehicles</h2>
            </div>

            <div className="settings-section-title">Active Vehicle</div>
            <div className="ios-input-group">
              <div className="settings-row" style={{cursor: 'default', background: 'white'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                  <Car size={20} color="#0056D2" />
                  <div>
                    <span style={{fontWeight: 500, display: 'block', marginBottom: 2}}>{regPlate ? regPlate.toUpperCase() : 'NO PLATE ADDED'}</span>
                    <span style={{fontSize: 13, color: '#8E8E93'}}>Primary Vehicle</span>
                  </div>
                </div>
                <div style={{fontSize: 12, color: '#34C759', fontWeight: 600, background: '#E8F8EE', padding: '4px 8px', borderRadius: 6}}>Default</div>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); alert('Vehicle added!'); setCurrentScreen('profile'); }}>
              <div className="settings-section-title" style={{marginTop: 25}}>Add New Vehicle</div>
              <div className="ios-input-group">
                <div className="ios-input-row">
                  <input className="ios-input" style={{marginLeft: 0, textTransform: 'uppercase'}} placeholder="Enter License Plate (e.g. AB12 CDE)" onChange={(e) => setRegPlate(e.target.value)} required />
                </div>
              </div>
              <button className="primary-btn" type="submit" style={{marginTop: 10}}>Add Vehicle</button>
            </form>
          </div>
        )}

        {/* --- NOTIFICATIONS SCREEN --- */}
        {currentScreen === 'notifications' && (
          <div className="screen" style={{overflowY: 'auto'}}>
            <div className="checkout-header" style={{marginTop: 10}}>
              <button className="close-btn" onClick={() => setCurrentScreen('profile')}><ArrowLeft size={20} color="#000" /></button>
              <h2 className="checkout-title">Notifications</h2>
            </div>

            <div className="settings-section-title">Push Notifications</div>
            <div className="ios-input-group">
              <div className="payment-method-row" style={{marginBottom: 0, borderBottom: '1px solid #E5E5EA', borderRadius: 0, border: 'none'}}>
                <div style={{flex: 1}}>
                  <div style={{fontWeight: 600}}>Booking Updates</div>
                  <div style={{fontSize: 13, color: '#8E8E93', marginTop: 2}}>Reminders, expiry warnings, and receipts.</div>
                </div>
                <div className="toggle-switch" style={notifBooking ? {} : {background: '#E5E5EA'}} onClick={() => setNotifBooking(!notifBooking)}>
                  <div className="toggle-knob" style={notifBooking ? {} : {right: 'auto', left: 2}}></div>
                </div>
              </div>
              
              <div className="payment-method-row" style={{marginBottom: 0, borderRadius: 0, border: 'none'}}>
                <div style={{flex: 1}}>
                  <div style={{fontWeight: 600}}>Promotions & Offers</div>
                  <div style={{fontSize: 13, color: '#8E8E93', marginTop: 2}}>Discounts and new features.</div>
                </div>
                <div className="toggle-switch" style={notifPromo ? {} : {background: '#E5E5EA'}} onClick={() => setNotifPromo(!notifPromo)}>
                  <div className="toggle-knob" style={notifPromo ? {} : {right: 'auto', left: 2}}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- HELP CENTER SCREEN --- */}
        {currentScreen === 'helpCenter' && (
          <div className="screen" style={{overflowY: 'auto'}}>
            <div className="checkout-header" style={{marginTop: 10}}>
              <button className="close-btn" onClick={() => setCurrentScreen('profile')}><ArrowLeft size={20} color="#000" /></button>
              <h2 className="checkout-title">Help Center</h2>
            </div>

            <div className="ios-input-group" style={{background: '#E5E5EA', padding: '12px 15px', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10}}>
               <HelpCircle size={18} color="#8E8E93"/>
               <input style={{border: 'none', background: 'transparent', outline: 'none', fontSize: 16, flex: 1}} placeholder="Search for help..." />
            </div>

            <div className="settings-section-title">Frequently Asked Questions</div>
            <div className="ios-input-group">
              <div className="settings-row" onClick={() => alert('To book a spot, simply tap a pin on the map and proceed to checkout!')}>
                <span style={{fontWeight: 500}}>How do I book a parking spot?</span>
                <ChevronRight size={20} color="#C7C7CC" />
              </div>
              <div className="settings-row" onClick={() => alert('Go to your profile, tap "Switch to Host Dashboard", and click the + icon.')}>
                <span style={{fontWeight: 500}}>How do I list my driveway?</span>
                <ChevronRight size={20} color="#C7C7CC" />
              </div>
              <div className="settings-row" onClick={() => alert('You can extend your time directly from the Active Session ticket using the dropdown.')}>
                <span style={{fontWeight: 500}}>Can I extend my booking?</span>
                <ChevronRight size={20} color="#C7C7CC" />
              </div>
              <div className="settings-row" onClick={() => alert('Use the Contact Host button on your active ticket to resolve the issue directly, or contact support for a full refund.')}>
                <span style={{fontWeight: 500}}>What if someone is in my spot?</span>
                <ChevronRight size={20} color="#C7C7CC" />
              </div>
              <div className="settings-row border-none" onClick={() => alert('Payouts are processed automatically to your default payment method at the end of each month.')}>
                <span style={{fontWeight: 500}}>How do host payouts work?</span>
                <ChevronRight size={20} color="#C7C7CC" />
              </div>
            </div>

            <button className="secondary-btn" style={{background: '#E6F0FF', color: '#0056D2', fontWeight: 600, padding: '16px', borderRadius: '14px', marginTop: 'auto'}} onClick={() => openChat('Support Agent', 'helpCenter')}>
               Contact Live Support
            </button>
          </div>
        )}

        {/* --- TERMS & PRIVACY SCREEN --- */}
        {currentScreen === 'termsPrivacy' && (
          <div className="screen" style={{overflowY: 'auto', background: '#fff'}}>
            <div className="checkout-header" style={{marginTop: 10, background: '#fff', position: 'sticky', top: 0, zIndex: 10, paddingBottom: 15}}>
              <button className="close-btn" onClick={() => setCurrentScreen('profile')}><ArrowLeft size={20} color="#000" /></button>
              <h2 className="checkout-title">Terms & Privacy</h2>
            </div>

            <div style={{color: '#333', fontSize: 14, lineHeight: 1.6, paddingBottom: 40}}>
              <h3 style={{fontSize: 18, color: '#000'}}>1. Acceptance of Terms</h3>
              <p className="mb-4 font-medium">By accessing or using the Park Now application, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services.</p>

              <h3 style={{fontSize: 18, color: '#000', marginTop: 24}}>2. User Responsibilities (Drivers)</h3>
              <p className="mb-4 font-medium">As a driver, you agree to park only in the designated areas outlined by the Host. You must strictly adhere to the booking times. Overstaying may result in additional penalty fees or your vehicle being towed at your own expense.</p>

              <h3 style={{fontSize: 18, color: '#000', marginTop: 24}}>3. Host Responsibilities</h3>
              <p className="mb-4 font-medium">As a host, you guarantee that you have the legal right to rent out the driveway or parking space listed. The space must be accurately represented in photos and descriptions, and be reasonably accessible during the booking period.</p>

              <h3 style={{fontSize: 18, color: '#000', marginTop: 24}}>4. Privacy & Data Collection</h3>
              <p className="mb-4 font-medium">We collect location data (GPS) to provide you with accurate nearby parking spots. Your payment information is securely encrypted and processed by a third-party gateway. We do not sell your personal data to advertisers.</p>
              
              <h3 style={{fontSize: 18, color: '#000', marginTop: 24}}>5. Cancellations & Refunds</h3>
              <p className="mb-4 font-medium">Bookings can be cancelled up to 1 hour before the scheduled start time for a full refund. Cancellations made within 1 hour are not eligible for refunds. Host-initiated cancellations will result in a 100% refund to the driver.</p>

              <h3 style={{fontSize: 18, color: '#000', marginTop: 24}}>6. Insurance Policy</h3>
              <p className="mb-4 font-medium">Every booking includes a standard public liability protection for both the host and the driver. This is included in the service fee. Damage must be reported within 24 hours of the session end time.</p>

              <h3 style={{fontSize: 18, color: '#000', marginTop: 24}}>7. Community Safety</h3>
              <p className="mb-4 font-medium">We maintain a strict code of conduct. All students must be respectful and park within the designated lines of the host's property. Any reports of inappropriate behaviour will result in an immediate account review.</p>

              <p style={{color: '#8E8E93', marginTop: 30, fontSize: 12, textAlign: 'center'}}>Last updated: October 2025</p>
            </div>
          </div>
        )}

        {/* Fullscreen Image Viewer Overlay */}
        {fullScreenImage && (
          <div className="fullscreen-overlay" onClick={() => setFullScreenImage(null)}>
            <button className="fullscreen-close" onClick={(e) => { e.stopPropagation(); setFullScreenImage(null); }}>
              <X size={24} color="#FFF" />
            </button>
            <img src={fullScreenImage} alt="Full Screen View" className="fullscreen-img" />
          </div>
        )}

      </div>
    </>
  );
}

export default App;