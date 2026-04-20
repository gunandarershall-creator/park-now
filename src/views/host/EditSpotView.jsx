// ============================================================================
//  VIEW: EditSpotView.jsx - edit an existing driveway listing
// ============================================================================
//  Form for the host to update an already-published listing. Fewer fields
//  than the add screen because we only let them tweak the photo, address,
//  and hourly rate here.
//
//  The hidden <input type="file"> is triggered by clicking the big photo
//  box - that way we get a nice big tap target instead of the ugly
//  default file-picker button.
// ============================================================================

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
    {/* Top bar */}
    <div className="checkout-header" style={{marginTop: 10}}>
      <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
      <h2 className="checkout-title">Edit Driveway</h2>
    </div>

    <form onSubmit={onSubmit}>
      {/* Hidden file input - clicking the photo box below triggers it */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={onImageUpload}
        style={{display: 'none'}}
      />

      {/* Photo picker - shows current/chosen image or a "tap to change" prompt */}
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

      {/* Address field */}
      <div className="form-section">
        <div className="input-label">Address (or Postcode)</div>
        <div className="ios-input-group" style={{marginBottom: 0}}>
          <div className="ios-input-row">
            <MapPin size={20} color="#8E8E93" />
            <input className="ios-input" placeholder="e.g. 10 Downing Street, London" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} required />
          </div>
        </div>
      </div>

      {/* Hourly rate field. number input with step=0.10 so the up/down keys move in 10p increments */}
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
