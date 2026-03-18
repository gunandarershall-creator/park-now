/**
 * VIEW: EditSpotView.jsx
 * Form screen for editing an existing parking driveway listing.
 */

import React from 'react';
import { ArrowLeft, Camera, MapPin } from 'lucide-react';

const EditSpotView = ({
  newAddress, setNewAddress,
  newPrice, setNewPrice,
  newImage,
  fileInputRef,
  onImageUpload,
  onSubmit,
  onBack,
}) => (
  <div className="screen" style={{overflowY: 'auto'}}>
    <div className="checkout-header" style={{marginTop: 10}}>
      <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
      <h2 className="checkout-title">Edit Driveway</h2>
    </div>

    <form onSubmit={onSubmit}>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={onImageUpload}
        style={{display: 'none'}}
      />

      <div className="photo-upload-box" onClick={() => fileInputRef.current.click()}>
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
          <div className="ios-input-row">
            <MapPin size={20} color="#8E8E93" />
            <input className="ios-input" placeholder="e.g. 10 Downing Street, London" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} required />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="input-label">Hourly Rate (£)</div>
        <div className="ios-input-group" style={{marginBottom: 0}}>
          <div className="ios-input-row">
            <span style={{color: '#8E8E93', fontSize: 17, fontWeight: 500}}>£</span>
            <input className="ios-input" type="number" step="0.10" placeholder="5.00" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required />
          </div>
        </div>
      </div>

      <button className="primary-btn" type="submit" style={{marginTop: '40px'}}>Save Changes</button>
    </form>
  </div>
);

export default EditSpotView;
