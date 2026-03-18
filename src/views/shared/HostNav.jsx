/**
 * VIEW: HostNav.jsx
 * Bottom navigation bar for host mode.
 */

import React from 'react';
import { Home, Plus, User } from 'lucide-react';

const PROFILE_SCREENS = ['profile', 'personalInfo', 'notifications', 'helpCenter', 'termsPrivacy'];

const HostNav = ({ currentScreen, onNavigate }) => (
  <div className="nav-bar-bottom">
    <div className={`nav-item ${currentScreen === 'hostDashboard' ? 'active' : ''}`} onClick={() => onNavigate('hostDashboard')}>
      <Home size={24} color={currentScreen === 'hostDashboard' ? "#0056D2" : "#8E8E93"} />
      <span style={{color: currentScreen === 'hostDashboard' ? '#0056D2' : '#8E8E93'}}>Dashboard</span>
    </div>
    <div className="add-btn" onClick={() => onNavigate('addSpot')}><Plus size={28} /></div>
    <div className={`nav-item ${PROFILE_SCREENS.includes(currentScreen) ? 'active' : ''}`} onClick={() => onNavigate('profile')}>
      <User size={24} color={PROFILE_SCREENS.includes(currentScreen) ? "#0056D2" : "#8E8E93"} />
      <span style={{color: PROFILE_SCREENS.includes(currentScreen) ? '#0056D2' : '#8E8E93'}}>Profile</span>
    </div>
  </div>
);

export default HostNav;
