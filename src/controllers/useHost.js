/**
 * CONTROLLER: useHost.js
 * Manages host listings, adding new spots, and editing existing spots.
 * Depends on: SpotModel, user from useAuth
 */

import { useState, useEffect, useRef } from 'react';
import { saveSpot, updateSpot, subscribeToHostSpots } from '../models/spotModel';


export const useHost = (user, spots, setSpots, showToast, panTo) => {
  const [hostListings, setHostListings] = useState([]);
  const [hostSpots, setHostSpots]       = useState([]); // direct Firestore sub — all host spots incl. inactive
  const [newAddress, setNewAddress] = useState('');
  const [newCoords, setNewCoords] = useState(null); // { lat, lng } resolved by Places selection
  const [newPrice, setNewPrice] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [availFrom, setAvailFrom] = useState('00:00');
  const [availTo, setAvailTo] = useState('23:59');
  const [editingSpotId, setEditingSpotId] = useState(null);
  const fileInputRef = useRef(null);

  // Direct Firestore subscription scoped to this host — returns inactive spots too so
  // the dashboard never loses a listing just because it was marked unavailable after booking.
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToHostSpots(
      user.uid,
      (docs) => setHostSpots(docs),
      (err) => console.error('Host spots sync error:', err),
    );
    return () => unsubscribe();
  }, [user]);

  // Derive host listings from hostSpots (includes isActive:false spots)
  useEffect(() => {
    const listings = hostSpots.map(s => ({
      id: s.id,
      address: s.address,
      details: `£${Number(s.price).toFixed(2)} / hr • ${s.spotsLeft ?? 1} spot${(s.spotsLeft ?? 1) !== 1 ? 's' : ''}`,
      isActive: s.isActive ?? true,
    }));
    setHostListings(listings);
  }, [hostSpots]);

  const toggleHostListing = async (id) => {
    const listing = hostListings.find(l => l.id === id);
    if (!listing) return;
    const newActive = !listing.isActive;
    // Update local state immediately
    setHostListings(prev => prev.map(l => l.id === id ? { ...l, isActive: newActive } : l));
    setSpots(prev => prev.map(s => s.id === id ? { ...s, isActive: newActive } : s));
    // Persist to Firestore (only real spots, not demo seed data)
    if (!['1', '2', '3', '4', '5'].includes(id)) {
      try {
        // When re-activating a spot that was deactivated due to full booking,
        // restore spotsLeft to 1 so drivers can book it again.
        const updateData = { isActive: newActive };
        if (newActive) updateData.spotsLeft = 1;
        await updateSpot(id, updateData);
      } catch (e) {
        console.warn('Could not persist toggle to Firestore:', e);
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      // Compress image to stay well under Firestore's 1MB document limit
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

  const openEditSpot = (id) => {
    // Prefer hostSpots (includes inactive) so the host can edit a fully-booked listing
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

  const handleUpdateSpot = async (e) => {
    e.preventDefault();
    if (!newAddress || !newPrice) { showToast('Please enter an address and a price.', 'error'); return false; }
    const updatedFields = { address: newAddress, price: parseFloat(newPrice), imageUrl: newImage, availFrom, availTo };
    // Optimistically update the map spots state
    setSpots(prev => prev.map(s =>
      s.id === editingSpotId ? { ...s, ...updatedFields } : s
    ));
    // hostListings will update automatically via the hostSpots Firestore subscription
    if (!['1', '2', '3', '4', '5'].includes(editingSpotId)) {
      try {
        await updateSpot(editingSpotId, updatedFields);
      } catch (e) {
        console.warn('Could not persist spot update to Firestore:', e);
      }
    }
    showToast('Listing updated successfully!', 'success');
    setNewAddress(''); setNewPrice(''); setNewImage(null); setEditingSpotId(null);
    return true;
  };

  const handlePublishSpot = async (e, setCurrentScreen, setSearchQuery) => {
    e.preventDefault();
    if (!newAddress || !newPrice) { showToast('Please enter an address and a price.', 'error'); return; }

    let actualLat, actualLng;

    if (newCoords) {
      // Coords already resolved by Places selection — no geocoding needed
      actualLat = newCoords.lat;
      actualLng = newCoords.lng;
    } else {
      // Fallback: geocode via Google Geocoding API
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

    // Save to Firestore first — if it fails, surface the error rather than silently losing data
    try {
      await saveSpot(newSpotData);
    } catch (err) {
      console.error("Failed to save spot to Firestore:", err);
      const msg =
        err?.code === 'permission-denied'
          ? 'Permission denied — republish your Firestore security rules in Firebase Console.'
          : err?.message?.toLowerCase().includes('size')
          ? 'Image is too large. Please choose a smaller photo and try again.'
          : `Could not save listing (${err?.code || 'unknown error'}). Try again.`;
      showToast(msg, 'error');
      return;
    }

    // Don't manually update spots — the Firestore onSnapshot listener fires immediately
    // from local cache and updates spots automatically, avoiding duplicates
    setNewAddress(''); setNewPrice(''); setNewImage(null); setNewCoords(null);
    showToast('Spot listed successfully!', 'success');
    setCurrentScreen('hostDashboard');
  };

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
