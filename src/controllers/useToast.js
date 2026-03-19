/**
 * CONTROLLER: useToast.js
 * Provides in-app toast notifications — replaces all browser alert() calls.
 * Usage: const { toast, showToast } = useToast();
 *        showToast('Message here', 'success' | 'error' | 'info')
 */

import { useState, useCallback } from 'react';

export const useToast = () => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  return { toast, showToast };
};
