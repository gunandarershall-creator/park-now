/**
 * CONTROLLER: useHost.js
 * Manages host listings, adding new spots, and editing existing spots.
 * Depends on: SpotModel, user from useAuth
 */

import { useState, useEffect, useRef } from 'react';
import { saveSpot, updateSpot } from '../models/spotModel';


export const useHost = (user, spots, setSpots, showToast, panTo) => {
  const [hostListings, setHostListings] = useState([]);
  const [newAddress, setNewAddress] = useState('');
  const [newCoords, setNewCoords] = useState(null); // { lat, lng } resolved by Places selection
  const [newPrice, setNewPrice] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [availFrom, setAvailFrom] = useState('00:00');
  const [availTo, setAvailTo] = useState('23:59');
  const [editingSpotId, setEditingSpotId] = useState(null);
  const fileInputRef = useRef(null);

  // Derive host listings from spots — only the user's own spots
  useEffect(() => {
    const listings = spots
      .filter(s => s.hostId === user?.uid)
      .map(s => ({
        id: s.id,
        address: s.address,
        details: `£${Number(s.price).toFixed(2)} / hr • ${s.spotsLeft || 1} spot`,
        isActive: s.isActive ?? true,
      }));
    setHostListings(listings);
  }, [spots, user]);

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
        await updateSpot(id, { isActive: newActive });
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
    const spot = spots.find(s => s.id === id);
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
    setSpots(prev => prev.map(s =>
      s.id === editingSpotId ? { ...s, ...updatedFields } : s
    ));
    setHostListings(prev => prev.map(l =>
      l.id === editingSpotId
        ? { ...l, address: newAddress, details: `£${parseFloat(newPrice).toFixed(2)} / hr • ${l.details.split('•')[1]?.trim() || '1 spot'}` }
        : l
    ));
    // Persist to Firestore (only real spots, not demo seed data)
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

    // Only update UI after Firestore confirms the write
    // Note: hostListings is auto-derived from spots via useEffect — don't add it manually here
    setSpots(prev => [...prev, newSpotData]);
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
