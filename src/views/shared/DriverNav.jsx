/**
 * VIEW: DriverNav.jsx
 * Bottom navigation bar for driver mode.
 */

import React from 'react';
import { MapPin, Home, User } from 'lucide-react';

const PROFILE_SCREENS = ['profile', 'personalInfo', 'manageVehicles', 'notifications', 'helpCenter', 'termsPrivacy', 'paymentMethods', 'addCard'];

const DriverNav = ({ currentScreen, onNavigate }) => (
  <div className="nav-bar-bottom">
    <div className={`nav-item ${currentScreen === 'map' ? 'active' : ''}`} onClick={() => onNavigate('map')}>
      <MapPin size={24} color={currentScreen === 'map' ? "#0056D2" : "#8E8E93"} />
      <span style={{color: currentScreen === 'map' ? '#0056D2' : '#8E8E93'}}>Map</span>
    </div>
    <div className={`nav-item ${currentScreen === 'driverDashboard' ? 'active' : ''}`} onClick={() => onNavigate('driverDashboard')}>
      <Home size={24} color={currentScreen === 'driverDashboard' ? "#0056D2" : "#8E8E93"} />
      <span style={{color: currentScreen === 'driverDashboard' ? '#0056D2' : '#8E8E93'}}>Activity</span>
    </div>
    <div className={`nav-item ${PROFILE_SCREENS.includes(currentScreen) ? 'active' : ''}`} onClick={() => onNavigate('profile')}>
      <User size={24} color={PROFILE_SCREENS.includes(currentScreen) ? "#0056D2" : "#8E8E93"} />
      <span style={{color: PROFILE_SCREENS.includes(currentScreen) ? '#0056D2' : '#8E8E93'}}>Profile</span>
    </div>
  </div>
);

export default DriverNav;
