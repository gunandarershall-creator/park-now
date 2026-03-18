/**
 * CONTROLLER: useHost.js
 * Manages host listings, adding new spots, and editing existing spots.
 * Depends on: SpotModel, user from useAuth
 */

import { useState, useEffect, useRef } from 'react';
import { saveSpot } from '../models/spotModel';


export const useHost = (user, spots, setSpots) => {
  const [hostListings, setHostListings] = useState([]);
  const [newAddress, setNewAddress] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [editingSpotId, setEditingSpotId] = useState(null);
  const fileInputRef = useRef(null);

  // Derive host listings from spots whenever spots change
  useEffect(() => {
    const listings = spots
      .filter(s => s.hostId === user?.uid || s.hostId === 'system')
      .map(s => ({
        id: s.id,
        address: s.address,
        details: `£${Number(s.price).toFixed(2)} / hr • ${s.spotsLeft || 1} spot`,
        isActive: true
      }));
    setHostListings(listings);
  }, [spots, user]);

  const toggleHostListing = (id) => {
    setHostListings(prev => prev.map(l => l.id === id ? { ...l, isActive: !l.isActive } : l));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setNewImage(reader.result);
    reader.readAsDataURL(file);
  };

  const openEditSpot = (id) => {
    const spot = spots.find(s => s.id === id);
    if (!spot) return;
    setNewAddress(spot.address);
    setNewPrice(spot.price.toString());
    setNewImage(spot.imageUrl || null);
    setEditingSpotId(id);
    return true;
  };

  const handleUpdateSpot = (e) => {
    e.preventDefault();
    if (!newAddress || !newPrice) return alert("Please enter an address and a price.");
    setSpots(prev => prev.map(s =>
      s.id === editingSpotId
        ? { ...s, address: newAddress, price: parseFloat(newPrice), imageUrl: newImage }
        : s
    ));
    setHostListings(prev => prev.map(l =>
      l.id === editingSpotId
        ? { ...l, address: newAddress, details: `£${parseFloat(newPrice).toFixed(2)} / hr • ${l.details.split('•')[1]?.trim() || '1 spot'}` }
        : l
    ));
    alert('Listing successfully updated!');
    setNewAddress(''); setNewPrice(''); setNewImage(null); setEditingSpotId(null);
    return true;
  };

  const handlePublishSpot = async (e, setCurrentScreen, setSearchQuery) => {
    e.preventDefault();
    if (!newAddress || !newPrice) return alert("Please enter an address and a price.");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newAddress)}`);
      const data = await res.json();
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
          hostId: user ? user.uid : 'system',
          imageUrl: newImage
        };
        setSpots(prev => [...prev, newSpotData]);
        setHostListings(prev => [...prev, {
          id: newSpotData.id,
          address: newAddress,
          details: `£${parseFloat(newPrice).toFixed(2)} / hr • 1 spot`,
          isActive: true
        }]);
        try {
          await saveSpot(newSpotData);
        } catch (err) {
          console.error("Failed to push to Firebase.", err);
        }
        setNewAddress(''); setNewPrice(''); setNewImage(null);
        alert(`Success! Listing verified and added at exactly ${actualLat.toFixed(4)}, ${actualLng.toFixed(4)}.`);
        setCurrentScreen('map');
        setSearchQuery(newAddress);
        setTimeout(() => {
          if (window.mapInstance) window.mapInstance.flyTo([actualLat, actualLng], 15, { duration: 1.5 });
        }, 300);
      } else {
        alert("Could not find coordinates for this address. Try being more specific.");
      }
    } catch (error) {
      alert("Error connecting to the geocoding service to verify address.");
    }
  };

  const resetSpotForm = () => {
    setNewAddress('');
    setNewPrice('');
    setNewImage(null);
    setEditingSpotId(null);
  };

  return {
    hostListings, setHostListings,
    newAddress, setNewAddress,
    newPrice, setNewPrice,
    newImage, setNewImage,
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
