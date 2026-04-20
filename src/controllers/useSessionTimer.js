// ============================================================================
//  CONTROLLER: useSessionTimer.js - the live countdown clock
// ============================================================================
//  While a booking is active, the app shows a big countdown timer ticking
//  down to the end of the session. This hook is what powers it.
//
//  You give it an endTime (ISO string) and it gives you back:
//    timeDisplay  - "HH:MM:SS" formatted for the UI
//    secondsLeft  - raw number of seconds remaining
//    isExpired    - true once the end time has passed
//    isWarning    - true in the last 5 minutes (UI goes orange)
//
//  Internally it just runs setInterval(1000) and recomputes the delta on
//  every tick. Very cheap.
// ============================================================================

import { useState, useEffect } from 'react';

// Turn a number of seconds into "HH:MM:SS" with zero-padding.
// 3700 -> "01:01:40"
const formatTime = (totalSeconds) => {
  if (totalSeconds <= 0) return '00:00:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
};

export const useSessionTimer = (endTime) => {
  // Math.ceil (not floor) is deliberate and the reason is worth
  // explaining. When a booking commits at, say, 14:33:47.234 for a
  // 2-hour window, the raw delta is 7199.995 seconds. floor() rounds
  // down to 7199 and shows "1:59:59" immediately, which looks wrong to
  // the user who expected a full 2:00:00. ceil() rounds up to 7200 so
  // they see "2:00:00" and it ticks down to 1:59:59 one real second
  // later, as expected. This was a defect I fixed in testing.
  const calcSeconds = () =>
    endTime ? Math.max(0, Math.ceil((new Date(endTime) - Date.now()) / 1000)) : 0;

  const [secondsLeft, setSecondsLeft] = useState(calcSeconds);

  useEffect(() => {
    if (!endTime) return;
    // Recompute once immediately so changing endTime is reflected
    // instantly, not after a 1-second delay.
    setSecondsLeft(calcSeconds());

    // Tick every second.
    const interval = setInterval(() => {
      setSecondsLeft(calcSeconds());
    }, 1000);

    // Cleanup: stop the timer when the component unmounts or endTime
    // changes. Otherwise we'd leak intervals.
    return () => clearInterval(interval);
  }, [endTime]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    timeDisplay: formatTime(secondsLeft),
    secondsLeft,
    isExpired:  secondsLeft <= 0 && !!endTime,
    isWarning:  secondsLeft > 0 && secondsLeft <= 300, // 300s = last 5 min
  };
};
