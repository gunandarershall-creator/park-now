// ============================================================================
//  VIEW: DriverNav.jsx - bottom tab bar for driver mode
// ============================================================================
//  The three main driver tabs: Map, Activity (bookings), Profile.
//  The currently-active tab turns blue; inactive ones are grey.
//
//  The tricky bit is the Profile tab - we consider it "active" not just
//  when you're literally on the profile screen, but also when you're on
//  any sub-screen that you'd reach via Profile (personal info, vehicles,
//  payment methods, etc.). That's why we keep a PROFILE_SCREENS list and
//  check `.includes(currentScreen)` instead of a simple equality check.
//  Otherwise the tab bar would go "grey" when you drilled into settings,
//  which would be confusing.
// ============================================================================

import React from 'react';
import { MapPin, Home, User } from 'lucide-react';

// Every screen that should keep the Profile tab highlighted.
const PROFILE_SCREENS = ['profile', 'personalInfo', 'manageVehicles', 'notifications', 'helpCenter', 'termsPrivacy', 'paymentMethods', 'addCard'];

const DriverNav = ({ currentScreen, onNavigate }) => (
  <div className="nav-bar-bottom">
    {/* Map tab */}
    <div className={`nav-item ${currentScreen === 'map' ? 'active' : ''}`} onClick={() => onNavigate('map')}>
      <MapPin size={24} color={currentScreen === 'map' ? "#0056D2" : "#8E8E93"} />
      <span style={{color: currentScreen === 'map' ? '#0056D2' : '#8E8E93'}}>Map</span>
    </div>

    {/* Activity tab - shows the driver's bookings dashboard */}
    <div className={`nav-item ${currentScreen === 'driverDashboard' ? 'active' : ''}`} onClick={() => onNavigate('driverDashboard')}>
      <Home size={24} color={currentScreen === 'driverDashboard' ? "#0056D2" : "#8E8E93"} />
      <span style={{color: currentScreen === 'driverDashboard' ? '#0056D2' : '#8E8E93'}}>Activity</span>
    </div>

    {/* Profile tab - highlighted for every sub-screen in PROFILE_SCREENS above */}
    <div className={`nav-item ${PROFILE_SCREENS.includes(currentScreen) ? 'active' : ''}`} onClick={() => onNavigate('profile')}>
      <User size={24} color={PROFILE_SCREENS.includes(currentScreen) ? "#0056D2" : "#8E8E93"} />
      <span style={{color: PROFILE_SCREENS.includes(currentScreen) ? '#0056D2' : '#8E8E93'}}>Profile</span>
    </div>
  </div>
);

export default DriverNav;
