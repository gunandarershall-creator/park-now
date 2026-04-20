// ============================================================================
//  VIEW: OnboardingView.jsx - the three-slide intro shown on first launch
// ============================================================================
//  Three slides that sell the app to a brand new user:
//    1. Find parking instantly     (blue)
//    2. Earn from your driveway    (green)
//    3. Safe and secure            (orange)
//
//  The user can either step through with Next / Next / Get Started, tap
//  a dot to jump to a specific slide, or hit Skip to jump straight to
//  the login screen.
//
//  Once onDone() fires, App.js saves a flag in localStorage so we never
//  show these slides again for this user on this device.
// ============================================================================

import React, { useState } from 'react';
import { MapPin, Home, ShieldCheck } from 'lucide-react';

// The three slides. Keeping them in an array makes it trivial to add a
// fourth one later without touching the JSX below.
const SLIDES = [
  {
    icon: <MapPin size={56} color="#fff" />,
    bg: 'linear-gradient(135deg, #0056D2 0%, #003A8C 100%)',
    title: 'Find Parking Instantly',
    body: 'Browse real driveways near you on a live map. Book in under 30 seconds — no app account needed to browse.',
  },
  {
    icon: <Home size={56} color="#fff" />,
    bg: 'linear-gradient(135deg, #34C759 0%, #1E8C3A 100%)',
    title: 'Earn From Your Driveway',
    body: 'Got a spare driveway? List it in minutes and start earning money from your empty space every day.',
  },
  {
    icon: <ShieldCheck size={56} color="#fff" />,
    bg: 'linear-gradient(135deg, #FF9500 0%, #CC7000 100%)',
    title: 'Safe & Secure',
    body: 'Every booking is verified. Optional Premium Protection covers your vehicle up to £1M during every stay.',
  },
];

const OnboardingView = ({ onDone }) => {
  // Which slide we're currently showing (0, 1, or 2).
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  // If we're on the last slide the button text changes to "Get Started".
  const isLast = idx === SLIDES.length - 1;

  return (
    <div className="screen" style={{ padding: 0, background: '#fff' }}>
      {/* Top half: the big coloured slide panel */}
      <div style={{
        background: slide.bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        flex: 1, padding: '60px 32px 40px', textAlign: 'center',
        transition: 'background 0.4s ease', // smooth colour fade between slides
      }}>
        {/* Icon in a translucent rounded square */}
        <div style={{
          width: 110, height: 110, borderRadius: 32,
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 32,
        }}>
          {slide.icon}
        </div>
        <h2 style={{ margin: '0 0 16px', fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
          {slide.title}
        </h2>
        <p style={{ margin: 0, fontSize: 16, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, maxWidth: 300 }}>
          {slide.body}
        </p>
      </div>

      {/* Bottom half: dots + buttons */}
      <div style={{ padding: '32px 24px 48px', background: '#fff' }}>
        {/* Page indicator dots. The current one stretches into a pill. */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
          {SLIDES.map((_, i) => (
            <div key={i} style={{
              width: i === idx ? 24 : 8, height: 8, borderRadius: 4,
              background: i === idx ? '#0056D2' : '#E5E5EA',
              transition: 'width 0.3s ease, background 0.3s ease',
              cursor: 'pointer',
            }} onClick={() => setIdx(i)} />
          ))}
        </div>

        {/* Main button: Next while there are more slides, Get Started on the last */}
        <button
          className="primary-btn"
          onClick={() => isLast ? onDone() : setIdx(i => i + 1)}
          style={{ marginBottom: 12 }}
        >
          {isLast ? 'Get Started' : 'Next'}
        </button>

        {/* Skip link - only shown while there are more slides to skip past */}
        {!isLast && (
          <button
            onClick={onDone}
            style={{ width: '100%', background: 'none', border: 'none', color: '#8E8E93', fontSize: 15, cursor: 'pointer', padding: '8px 0' }}
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingView;
