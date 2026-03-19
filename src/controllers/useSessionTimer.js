/**
 * CONTROLLER: useSessionTimer.js
 * Live countdown timer for an active parking session.
 *
 * Calculates remaining seconds from a fixed endTime ISO string,
 * ticking every second via setInterval. Returns a formatted HH:MM:SS
 * string, a warning flag for the last 5 minutes, and an expiry flag.
 */

import { useState, useEffect } from 'react';

const formatTime = (totalSeconds) => {
  if (totalSeconds <= 0) return '00:00:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
};

/**
 * @param {string|null} endTime - ISO date string of when the session ends
 * @returns {{ timeDisplay: string, secondsLeft: number, isExpired: boolean, isWarning: boolean }}
 */
export const useSessionTimer = (endTime) => {
  const calcSeconds = () =>
    endTime ? Math.max(0, Math.floor((new Date(endTime) - Date.now()) / 1000)) : 0;

  const [secondsLeft, setSecondsLeft] = useState(calcSeconds);

  useEffect(() => {
    if (!endTime) return;
    setSecondsLeft(calcSeconds());

    const interval = setInterval(() => {
      setSecondsLeft(calcSeconds());
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    timeDisplay: formatTime(secondsLeft),
    secondsLeft,
    isExpired:  secondsLeft <= 0 && !!endTime,
    isWarning:  secondsLeft > 0 && secondsLeft <= 300, // last 5 minutes
  };
};
