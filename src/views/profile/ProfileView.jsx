// ============================================================================
//  VIEW: ProfileView.jsx - the main settings / account screen
// ============================================================================
//  The "you" tab of the app. Shows the user's avatar + email at the top,
//  then groups settings into sections:
//    - Account Settings   (personal info, vehicles, payment methods)
//    - Preferences        (notifications)
//    - Support & About    (help centre, report issue, T&Cs)
//    - App Actions        (switch to host/driver mode, log out)
//
//  Some rows only show in driver mode - e.g. "Manage Vehicles" makes no
//  sense for a host who rents out a driveway. The mode switch at the
//  bottom is how the same account flips between the two experiences.
//
//  The bottom nav bar (DriverNav vs HostNav) is picked based on userMode
//  so the icons match the role they're currently in.
// ============================================================================

import React, { useRef } from 'react';
import { User, Car, CreditCard, Bell, HelpCircle, FileText, Home, LogOut, ChevronRight, Flag, Camera } from 'lucide-react';
import DriverNav from '../shared/DriverNav';
import HostNav from '../shared/HostNav';

const ProfileView = ({
  regName, email, regPlate, userMode,
  photoUrl, onUpdatePhoto,
  currentScreen,
  onNavigate,
  onSwitchMode,
  onReport,
  onLogout,
}) => {
  // Hidden <input type=file> that we trigger by clicking the avatar.
  const photoInputRef = useRef(null);

  return (
  <div className="screen" style={{padding: 0}}>
    {/* Scrollable content - padded at bottom to clear the fixed nav bar */}
    <div style={{flex: 1, overflowY: 'auto', padding: '20px 20px 100px 20px'}}>

      {/* Page title */}
      <div className="host-header" style={{paddingBottom: 0}}>
        <h2 style={{margin: 0, fontSize: 24, fontWeight: 800}}>Profile</h2>
      </div>

      {/* Header card - avatar + name/email + license plate (driver only) */}
      <div className="profile-header-card">
        {/* Hidden file input; fires when the user picks a new photo */}
        <input
          type="file" accept="image/*" ref={photoInputRef}
          style={{ display: 'none' }}
          onChange={(e) => e.target.files[0] && onUpdatePhoto(e.target.files[0])}
        />
        {/* The avatar itself - tap to open the file picker */}
        <div
          onClick={() => photoInputRef.current.click()}
          style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
        >
          {/* Either show the uploaded photo, or a round initial-letter badge */}
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Profile"
              style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div className="avatar-circle">
              {regName ? regName.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : 'U')}
            </div>
          )}
          {/* Little camera badge overlay in the bottom-right of the avatar -
              visual cue that the avatar is tappable to change the photo */}
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            background: '#0056D2', borderRadius: '50%',
            width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
          }}>
            <Camera size={10} color="#fff" />
          </div>
        </div>

        {/* Name + email + (driver only) plate */}
        <div>
          <h3 style={{margin: '0 0 4px 0', fontSize: 20}}>{userMode === 'driver' ? 'Driver Account' : 'Host Account'}</h3>
          <p style={{margin: 0, color: '#8E8E93', fontSize: 14}}>{email || ''}</p>
          {regPlate && userMode === 'driver' && (
            <p style={{margin: '4px 0 0 0', color: '#0056D2', fontSize: 12, fontWeight: 700}}>Vehicle: {regPlate.toUpperCase()}</p>
          )}
        </div>
      </div>

      {/* ── Account Settings ─────────────────────────────────────────── */}
      <div className="settings-section-title">Account Settings</div>
      <div className="ios-input-group">
        <div className="settings-row" onClick={() => onNavigate('personalInfo')}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <User size={20} color="#0056D2" />
            <span style={{fontWeight: 500}}>Personal Information</span>
          </div>
          <ChevronRight size={20} color="#C7C7CC" />
        </div>

        {/* Vehicles row only makes sense for drivers - hosts don't park here */}
        {userMode === 'driver' && (
          <div className="settings-row" onClick={() => onNavigate('manageVehicles')}>
            <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
              <Car size={20} color="#0056D2" />
              <span style={{fontWeight: 500}}>Manage Vehicles</span>
            </div>
            <ChevronRight size={20} color="#C7C7CC" />
          </div>
        )}

        {/* Wording flips based on role - drivers PAY, hosts get PAID */}
        <div className="settings-row" onClick={() => onNavigate('paymentMethods')}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <CreditCard size={20} color="#0056D2" />
            <span style={{fontWeight: 500}}>{userMode === 'driver' ? 'Payment Methods' : 'Payout Methods'}</span>
          </div>
          <ChevronRight size={20} color="#C7C7CC" />
        </div>
      </div>

      {/* ── Preferences ─────────────────────────────────────────────── */}
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

      {/* ── Support & About ─────────────────────────────────────────── */}
      <div className="settings-section-title" style={{marginTop: 25}}>Support & About</div>
      <div className="ios-input-group">
        <div className="settings-row" onClick={() => onNavigate('helpCenter')}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <HelpCircle size={20} color="#0056D2" />
            <span style={{fontWeight: 500}}>Help Center</span>
          </div>
          <ChevronRight size={20} color="#C7C7CC" />
        </div>
        {/* "Report an Issue" is red to signal "something went wrong" without
            scaring the user too much */}
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

      {/* ── App Actions (mode switch + logout) ──────────────────────── */}
      <div className="settings-section-title" style={{marginTop: 25}}>App Actions</div>
      <div className="ios-input-group">
        {/* Label + target mode flip based on where the user currently is */}
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
        {/* Log Out - red to separate it visually from the other rows */}
        <div className="settings-row" onClick={onLogout}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <LogOut size={20} color="#FF3B30" />
            <span style={{fontWeight: 500, color: '#FF3B30'}}>Log Out</span>
          </div>
        </div>
      </div>

    </div>

    {/* Nav bar outside the scroll area - always visible at the bottom.
        We render DriverNav or HostNav depending on the current role */}
    {userMode === 'driver'
      ? <DriverNav currentScreen={currentScreen} onNavigate={onNavigate} />
      : <HostNav currentScreen={currentScreen} onNavigate={onNavigate} />
    }
  </div>
  );
};

export default ProfileView;
