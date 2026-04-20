// ============================================================================
//  VIEW: ManageVehiclesView.jsx - manage the driver's license plate
// ============================================================================
//  For this MVP we only support one vehicle per account (the "primary"
//  one). The top card shows the current plate, the bottom form lets you
//  change it. The plate is forced uppercase via CSS textTransform so it
//  looks like a proper UK numberplate even if the user types lowercase.
// ============================================================================

import React from 'react';
import { ArrowLeft, Car } from 'lucide-react';

const ManageVehiclesView = ({ regPlate, setRegPlate, onSubmit, onBack }) => (
  <div className="screen" style={{overflowY: 'auto'}}>
    {/* Top bar */}
    <div className="checkout-header" style={{marginTop: 10}}>
      <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
      <h2 className="checkout-title">My Vehicles</h2>
    </div>

    {/* Active Vehicle card - just shows what's currently saved, no editing here */}
    <div className="settings-section-title">Active Vehicle</div>
    <div className="ios-input-group">
      <div className="settings-row" style={{cursor: 'default', background: 'white'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <Car size={20} color="#0056D2" />
          <div>
            {/* .toUpperCase() in case the stored value isn't already upper */}
            <span style={{fontWeight: 500, display: 'block', marginBottom: 2}}>{regPlate ? regPlate.toUpperCase() : 'NO PLATE ADDED'}</span>
            <span style={{fontSize: 13, color: '#8E8E93'}}>Primary Vehicle</span>
          </div>
        </div>
        {/* Green "Default" pill - we only have one car so it's always the default */}
        <div style={{fontSize: 12, color: '#34C759', fontWeight: 600, background: '#E8F8EE', padding: '4px 8px', borderRadius: 6}}>Default</div>
      </div>
    </div>

    {/* Edit form - type a new plate and hit Save */}
    <form onSubmit={onSubmit}>
      <div className="settings-section-title" style={{marginTop: 25}}>Update Vehicle</div>
      <div className="ios-input-group">
        <div className="ios-input-row">
          {/* textTransform: 'uppercase' turns "ab12 cde" into "AB12 CDE" visually
              even though the underlying state keeps whatever case the user typed */}
          <input
            className="ios-input"
            style={{marginLeft: 0, textTransform: 'uppercase'}}
            placeholder="Enter License Plate (e.g. AB12 CDE)"
            value={regPlate}
            onChange={(e) => setRegPlate(e.target.value)}
            required
          />
        </div>
      </div>
      <button className="primary-btn" type="submit" style={{marginTop: 10}}>Save Vehicle</button>
    </form>
  </div>
);

export default ManageVehiclesView;
