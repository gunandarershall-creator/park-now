// ============================================================================
//  CONTROLLER: useToast.js - the little banner that pops up at the top
// ============================================================================
//  Browser alert() popups are ugly, blocking, and users ignore them. So
//  throughout this app I never call alert(). Instead every "hey, this
//  happened" message goes through this hook.
//
//  Usage from any component that has access to showToast:
//    showToast('Booking saved',  'success')
//    showToast('Payment failed', 'error')
//    showToast('Session ending', 'info')
//
//  The toast disappears on its own after 3.5 seconds.
// ============================================================================

import { useState, useCallback } from 'react';

export const useToast = () => {
  // null = no toast on screen. Otherwise { message, type }.
  const [toast, setToast] = useState(null);

  // useCallback pins this function across rerenders so effects that
  // depend on it don't fire endlessly.
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    // Clear it again after 3.5 seconds. A bit longer than I'd normally
    // want because some messages (like the payout notice) are two
    // sentences and need a reading beat.
    setTimeout(() => setToast(null), 3500);
  }, []);

  return { toast, showToast };
};
