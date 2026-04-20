// ============================================================================
//  VIEW: Toast.jsx - little banner that slides in at the top
// ============================================================================
//  This is what replaces the ugly browser alert() popups throughout the
//  app. Whenever the controllers want to say "saved!" or "something
//  went wrong", they push a toast via useToast() and this component
//  renders it as a coloured banner at the top of the phone frame.
//
//  Three flavours, each with its own colour + icon:
//    success (green tick)   - happy path (booking confirmed, card saved)
//    error   (red X)        - something failed (network, permission)
//    info    (blue info)    - neutral updates (session expiring soon)
//
//  pointerEvents: 'none' means the toast can't be tapped - it won't
//  block buttons underneath it. It auto-dismisses after ~3.5s; that
//  timing is handled by the useToast hook, not this component.
// ============================================================================

import React from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

// Look-up table so we don't repeat if/else for the three types.
const CONFIG = {
  success: { bg: '#34C759', icon: <CheckCircle size={18} /> }, // iOS green
  error:   { bg: '#FF3B30', icon: <XCircle size={18} /> },     // iOS red
  info:    { bg: '#0056D2', icon: <Info size={18} /> },        // brand blue
};

const Toast = ({ toast }) => {
  // Nothing to show? Render nothing - React will skip it entirely.
  if (!toast) return null;

  // Fall back to "info" style if someone passes an unknown type by mistake.
  const { bg, icon } = CONFIG[toast.type] || CONFIG.info;

  return (
    <div style={{
      // Pinned near the top of the phone frame
      position: 'absolute',
      top: 20,
      left: 16,
      right: 16,
      zIndex: 9999,                                    // on top of everything
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '14px 16px',
      borderRadius: 14,
      background: bg,                                   // colour picked above
      color: '#fff',
      fontSize: 14,
      fontWeight: 600,
      boxShadow: '0 4px 24px rgba(0,0,0,0.25)',         // soft drop shadow
      animation: 'toastSlideIn 0.3s ease',              // slide-in from top (keyframes in CSS)
      pointerEvents: 'none',                            // never blocks taps underneath
    }}>
      {icon}
      <span>{toast.message}</span>
    </div>
  );
};

export default Toast;
