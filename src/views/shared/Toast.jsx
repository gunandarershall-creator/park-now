/**
 * VIEW: Toast.jsx
 * In-app notification banner — replaces browser alert() popups.
 * Appears at the top of the phone frame, auto-dismisses after 3.5s.
 * Types: 'success' (green) | 'error' (red) | 'info' (blue)
 */

import React from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

const CONFIG = {
  success: { bg: '#34C759', icon: <CheckCircle size={18} /> },
  error:   { bg: '#FF3B30', icon: <XCircle size={18} /> },
  info:    { bg: '#0056D2', icon: <Info size={18} /> },
};

const Toast = ({ toast }) => {
  if (!toast) return null;

  const { bg, icon } = CONFIG[toast.type] || CONFIG.info;

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 16,
      right: 16,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '14px 16px',
      borderRadius: 14,
      background: bg,
      color: '#fff',
      fontSize: 14,
      fontWeight: 600,
      boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      animation: 'toastSlideIn 0.3s ease',
      pointerEvents: 'none',
    }}>
      {icon}
      <span>{toast.message}</span>
    </div>
  );
};

export default Toast;
