/**
 * VIEW: ProfileView.jsx
 * Main profile/settings screen — account info, preferences, support, and mode switching.
 */

import React from 'react';
import { User, Car, CreditCard, Bell, HelpCircle, FileText, Home, LogOut, ChevronRight, Flag } from 'lucide-react';
import DriverNav from '../shared/DriverNav';
import HostNav from '../shared/HostNav';

const ProfileView = ({
  regName, email, regPlate, userMode,
  currentScreen,
  onNavigate,
  onSwitchMode,
  onReport,
  onLogout,
}) => (
  <div className="screen" style={{padding: 0}}>
    {/* Scrollable content — padded at bottom to clear the fixed nav bar */}
    <div style={{flex: 1, overflowY: 'auto', padding: '20px 20px 100px 20px'}}>

      <div className="host-header" style={{paddingBottom: 0}}>
        <h2 style={{margin: 0, fontSize: 24, fontWeight: 800}}>Profile</h2>
      </div>

      <div className="profile-header-card">
        <div className="avatar-circle">
          {regName ? regName.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : 'U')}
        </div>
        <div>
          <h3 style={{margin: '0 0 4px 0', fontSize: 20}}>{userMode === 'driver' ? 'Driver Account' : 'Host Account'}</h3>
          <p style={{margin: 0, color: '#8E8E93', fontSize: 14}}>{email || 'test@parknow.com'}</p>
          {regPlate && userMode === 'driver' && (
            <p style={{margin: '4px 0 0 0', color: '#0056D2', fontSize: 12, fontWeight: 700}}>Vehicle: {regPlate.toUpperCase()}</p>
          )}
        </div>
      </div>

      <div className="settings-section-title">Account Settings</div>
      <div className="ios-input-group">
        <div className="settings-row" onClick={() => onNavigate('personalInfo')}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <User size={20} color="#0056D2" />
            <span style={{fontWeight: 500}}>Personal Information</span>
          </div>
          <ChevronRight size={20} color="#C7C7CC" />
        </div>

        {userMode === 'driver' && (
          <div className="settings-row" onClick={() => onNavigate('manageVehicles')}>
            <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
              <Car size={20} color="#0056D2" />
              <span style={{fontWeight: 500}}>Manage Vehicles</span>
            </div>
            <ChevronRight size={20} color="#C7C7CC" />
          </div>
        )}

        <div className="settings-row" onClick={() => onNavigate('paymentMethods')}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <CreditCard size={20} color="#0056D2" />
            <span style={{fontWeight: 500}}>{userMode === 'driver' ? 'Payment Methods' : 'Payout Methods'}</span>
          </div>
          <ChevronRight size={20} color="#C7C7CC" />
        </div>
      </div>

      <div className="settings-section-title" style={{marginTop: 25}}>Preferences</div>
      <div className="ios-input-group">
        <div className="settings-row" onClick={() => onNavigate('notifications')}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <Bell size={20} color="#0056D2" />
            <span style={{fontWeight: 500}}>Notifications</span>
          </div>
          <ChevronRight size={20} color="#C7C7CC" />
        </div>
      </div>

      <div className="settings-section-title" style={{marginTop: 25}}>Support & About</div>
      <div className="ios-input-group">
        <div className="settings-row" onClick={() => onNavigate('helpCenter')}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <HelpCircle size={20} color="#0056D2" />
            <span style={{fontWeight: 500}}>Help Center</span>
          </div>
          <ChevronRight size={20} color="#C7C7CC" />
        </div>
        <div className="settings-row" onClick={onReport}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <Flag size={20} color="#FF3B30" />
            <span style={{fontWeight: 500, color: '#FF3B30'}}>Report an Issue</span>
          </div>
          <ChevronRight size={20} color="#C7C7CC" />
        </div>
        <div className="settings-row" onClick={() => onNavigate('termsPrivacy')}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <FileText size={20} color="#0056D2" />
            <span style={{fontWeight: 500}}>Terms & Privacy</span>
          </div>
          <ChevronRight size={20} color="#C7C7CC" />
        </div>
      </div>

      <div className="settings-section-title" style={{marginTop: 25}}>App Actions</div>
      <div className="ios-input-group">
        {userMode === 'driver' ? (
          <div className="settings-row" onClick={() => onSwitchMode('host')}>
            <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
              <Home size={20} color="#0056D2" />
              <span style={{fontWeight: 500}}>Switch to Host Dashboard</span>
            </div>
            <ChevronRight size={20} color="#C7C7CC" />
          </div>
        ) : (
          <div className="settings-row" onClick={() => onSwitchMode('driver')}>
            <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
              <Car size={20} color="#0056D2" />
              <span style={{fontWeight: 500}}>Switch to Driver Mode</span>
            </div>
            <ChevronRight size={20} color="#C7C7CC" />
          </div>
        )}
        <div className="settings-row" onClick={onLogout}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <LogOut size={20} color="#FF3B30" />
            <span style={{fontWeight: 500, color: '#FF3B30'}}>Log Out</span>
          </div>
        </div>
      </div>

    </div>

    {/* Nav bar outside scroll area — always visible at the bottom */}
    {userMode === 'driver'
      ? <DriverNav currentScreen={currentScreen} onNavigate={onNavigate} />
      : <HostNav currentScreen={currentScreen} onNavigate={onNavigate} />
    }
  </div>
);

export default ProfileView;
