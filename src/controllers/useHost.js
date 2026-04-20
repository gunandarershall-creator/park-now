// ============================================================================
//  CONTROLLER: useHost.js - adding, editing, and toggling host listings
// ============================================================================
//  Everything a host can do to their own parking spots:
//    - view their full list (including temporarily-unavailable ones)
//    - add a brand new listing with photo, address, price, availability
//    - edit an existing listing
//    - toggle a listing on and off (e.g. away for the weekend)
//    - delete one
//
//  Photos are resized client-side before upload so they stay well under
//  Firestore's 1MB per-doc limit. I keep base64 data URLs in the doc
//  itself instead of using Firebase Storage because it keeps the demo
//  self-contained (no extra service to set up).
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { saveSpot, updateSpot, subscribeToHostSpots } from '../models/spotModel';


export const useHost = (user, spots, setSpots, showToast, panTo) => {
  // hostListings = cleaned-up "listings" shape for the dashboard UI.
  const [hostListings, setHostListings] = useState([]);
  // hostSpots = raw Firestore docs including inactive ones.
  const [hostSpots, setHostSpots]       = useState([]);

  // Form state for the Add/Edit Spot screen.
  const [newAddress, setNewAddress] = useState('');
  const [newCoords, setNewCoords] = useState(null); // { lat, lng } from Places picker
  const [newPrice, setNewPrice] = useState('');
  const [newImage, setNewImage] = useState(null);   // base64 data URL
  const [availFrom, setAvailFrom] = useState('00:00');
  const [availTo, setAvailTo] = useState('23:59');
  const [editingSpotId, setEditingSpotId] = useState(null);

  // Ref to the hidden <input type="file"> so the "Upload photo" button
  // can trigger a click on it programmatically.
  const fileInputRef = useRef(null);


  // ─── Live sync of THIS host's own listings ───────────────────────────
  // Different from the map-wide spots subscription because here we want
  // to include isActive:false ones (so the host can re-enable them).
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToHostSpots(
      user.uid,
      (docs) => setHostSpots(docs),
      (err) => console.error('Host spots sync error:', err),
    );
    return () => unsubscribe();
  }, [user]);


  // ─── Derive a dashboard-friendly shape from the raw docs ─────────────
  // Adds a human-readable "details" string like "£3.50 / hr • 2 spots".
  useEffect(() => {
    const listings = hostSpots.map(s => ({
      id: s.id,
      address: s.address,
      details: `£${Number(s.price).toFixed(2)} / hr • ${s.spotsLeft ?? 1} spot${(s.spotsLeft ?? 1) !== 1 ? 's' : ''}`,
      isActive: s.isActive ?? true,
    }));
    setHostListings(listings);
  }, [hostSpots]);


  // ─── Flip a listing on/off ───────────────────────────────────────────
  const toggleHostListing = async (id) => {
    const listing = hostListings.find(l => l.id === id);
    if (!listing) return;
    const newActive = !listing.isActive;

    // Optimistic UI: update local state immediately.
    setHostListings(prev => prev.map(l => l.id === id ? { ...l, isActive: newActive } : l));
    setSpots(prev => prev.map(s => s.id === id ? { ...s, isActive: newActive } : s));

    // Persist to Firestore - but only for real spots, not the demo seed.
    if (!['1', '2', '3', '4', '5'].includes(id)) {
      try {
        // If we're re-activating a spot that had spotsLeft=0 (because
        // it was fully booked before being toggled off), reset the
        // counter back to 1 so drivers can book it again.
        const updateData = { isActive: newActive };
        if (newActive) updateData.spotsLeft = 1;
        await updateSpot(id, updateData);
      } catch (e) {
        console.warn('Could not persist toggle to Firestore:', e);
      }
    }
  };


  // ─── Photo upload: read, resize, compress ────────────────────────────
  // FileReader reads the user-picked file as a data URL, I load it into
  // an Image element, then draw it onto a canvas at max 800px width,
  // and export as JPEG at 65% quality. The result is typically ~50-150kb
  // which is comfortable inside Firestore's 1MB doc limit.
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new window.Image();
      img.onload = () => {
        const MAX_WIDTH = 800;
        const ratio = Math.min(MAX_WIDTH / img.width, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        setNewImage(canvas.toDataURL('image/jpeg', 0.65));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };


  // ─── Open the edit form pre-populated with a listing's data ──────────
  // Prefers hostSpots (which includes inactive ones) so the host can
  // edit fully-booked listings too.
  const openEditSpot = (id) => {
    const spot = hostSpots.find(s => s.id === id) || spots.find(s => s.id === id);
    if (!spot) return;
    setNewAddress(spot.address);
    setNewPrice(spot.price.toString());
    setNewImage(spot.imageUrl || null);
    setAvailFrom(spot.availFrom || '00:00');
    setAvailTo(spot.availTo || '23:59');
    setEditingSpotId(id);
    return true;
  };


  // ─── Save changes to an existing listing ─────────────────────────────
  const handleUpdateSpot = async (e) => {
    e.preventDefault();
    if (!newAddress || !newPrice) { showToast('Please enter an address and a price.', 'error'); return false; }
    const updatedFields = { address: newAddress, price: parseFloat(newPrice), imageUrl: newImage, availFrom, availTo };

    // Optimistic update of the map spots state.
    setSpots(prev => prev.map(s =>
      s.id === editingSpotId ? { ...s, ...updatedFields } : s
    ));
    // hostListings auto-updates via the Firestore subscription once the
    // write below lands.

    // Skip Firestore for demo seed spots.
    if (!['1', '2', '3', '4', '5'].includes(editingSpotId)) {
      try {
        await updateSpot(editingSpotId, updatedFields);
      } catch (e) {
        console.warn('Could not persist spot update to Firestore:', e);
      }
    }
    showToast('Listing updated successfully!', 'success');
    // Reset the form.
    setNewAddress(''); setNewPrice(''); setNewImage(null); setEditingSpotId(null);
    return true;
  };


  // ─── Publish a brand new listing ─────────────────────────────────────
  // Two code paths for getting lat/lng:
  //   1. User picked from Google Places autocomplete - coords already
  //      supplied in newCoords, skip the geocoding API call.
  //   2. User typed an address freehand - fall back to Google's
  //      Geocoding REST API to resolve lat/lng.
  const handlePublishSpot = async (e, setCurrentScreen, setSearchQuery) => {
    e.preventDefault();
    if (!newAddress || !newPrice) { showToast('Please enter an address and a price.', 'error'); return; }

    let actualLat, actualLng;

    if (newCoords) {
      actualLat = newCoords.lat;
      actualLng = newCoords.lng;
    } else {
      try {
        const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(newAddress)}&region=gb&key=${apiKey}`);
        const data = await res.json();
        if (data.status === 'OK' && data.results.length > 0) {
          actualLat = data.results[0].geometry.location.lat;
          actualLng = data.results[0].geometry.location.lng;
        } else {
          showToast('Could not find this address. Try selecting from the suggestions.', 'error');
          return;
        }
      } catch (error) {
        showToast('Error connecting to the geocoding service.', 'error');
        return;
      }
    }

    // Build the new spot document. id is just Date.now() as a string
    // which is fine for uniqueness in this prototype.
    const newSpotData = {
      id: Date.now().toString(),
      lat: actualLat,
      lng: actualLng,
      price: parseFloat(newPrice),
      address: newAddress,
      rating: 5.0,
      distance: 'Local Neighbourhood',
      spotsLeft: 1,
      isActive: true,
      hostId: user ? user.uid : 'system',
      imageUrl: newImage,
      availFrom,
      availTo,
    };

    // Save to Firestore. If it fails we surface a clear error rather
    // than silently losing the host's work.
    try {
      await saveSpot(newSpotData);
    } catch (err) {
      console.error("Failed to save spot to Firestore:", err);
      const msg =
        err?.code === 'permission-denied'
          ? 'Permission denied - republish your Firestore security rules in Firebase Console.'
          : err?.message?.toLowerCase().includes('size')
          ? 'Image is too large. Please choose a smaller photo and try again.'
          : `Could not save listing (${err?.code || 'unknown error'}). Try again.`;
      showToast(msg, 'error');
      return;
    }

    // No need to update spots state manually - the onSnapshot listener
    // will pick up the new doc from Firestore's local cache within
    // milliseconds. Updating here too would create a duplicate.
    setNewAddress(''); setNewPrice(''); setNewImage(null); setNewCoords(null);
    showToast('Spot listed successfully!', 'success');
    setCurrentScreen('hostDashboard');
  };


  // ─── Reset every form field ──────────────────────────────────────────
  const resetSpotForm = () => {
    setNewAddress('');
    setNewCoords(null);
    setNewPrice('');
    setNewImage(null);
    setAvailFrom('00:00');
    setAvailTo('23:59');
    setEditingSpotId(null);
  };


  return {
    hostListings, setHostListings,
    hostSpots,
    newAddress, setNewAddress,
    newCoords, setNewCoords,
    newPrice, setNewPrice,
    newImage, setNewImage,
    availFrom, setAvailFrom,
    availTo, setAvailTo,
    editingSpotId,
    fileInputRef,
    toggleHostListing,
    handleImageUpload,
    openEditSpot,
    handleUpdateSpot,
    handlePublishSpot,
    resetSpotForm,
  };
};
