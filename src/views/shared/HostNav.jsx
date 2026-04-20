// ============================================================================
//  VIEW: HostNav.jsx - bottom tab bar for host mode
// ============================================================================
//  Host tab bar only has 2 tabs + a big blue "+" button in the middle.
//  Tapping "+" takes you straight to the Add Spot form so a host can
//  list a new driveway with one tap.
//
//  Same trick as DriverNav - the Profile tab stays highlighted while
//  you're on any of its sub-screens (personal info, notifications, etc.).
// ============================================================================

import React from 'react';
import { Home, Plus, User } from 'lucide-react';

// Sub-screens that should keep the Profile tab lit up while you're on them.
// Note this list is shorter than DriverNav's because hosts don't have
// "Manage Vehicles" or "Payment Methods" rows.
const PROFILE_SCREENS = ['profile', 'notifications', 'helpCenter', 'termsPrivacy'];

const HostNav = ({ currentScreen, onNavigate }) => (
  <div className="nav-bar-bottom">
    {/* Dashboard tab - host's earnings / active guests / listings */}
    <div className={`nav-item ${currentScreen === 'hostDashboard' ? 'active' : ''}`} onClick={() => onNavigate('hostDashboard')}>
      <Home size={24} color={currentScreen === 'hostDashboard' ? "#0056D2" : "#8E8E93"} />
      <span style={{color: currentScreen === 'hostDashboard' ? '#0056D2' : '#8E8E93'}}>Dashboard</span>
    </div>

    {/* Big blue "+" button in the middle - quick shortcut to add a new driveway */}
    <div className="add-btn" onClick={() => onNavigate('addSpot')}><Plus size={28} /></div>

    {/* Profile tab */}
    <div className={`nav-item ${PROFILE_SCREENS.includes(currentScreen) ? 'active' : ''}`} onClick={() => onNavigate('profile')}>
      <User size={24} color={PROFILE_SCREENS.includes(currentScreen) ? "#0056D2" : "#8E8E93"} />
      <span style={{color: PROFILE_SCREENS.includes(currentScreen) ? '#0056D2' : '#8E8E93'}}>Profile</span>
    </div>
  </div>
);

export default HostNav;
