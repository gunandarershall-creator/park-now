/**
 * VIEW: OnboardingView.jsx
 * First-launch intro slides shown once before the login screen.
 */

import React, { useState } from 'react';
import { MapPin, Home, ShieldCheck } from 'lucide-react';

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
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  return (
    <div className="screen" style={{ padding: 0, background: '#fff' }}>
      {/* Slide area */}
      <div style={{
        background: slide.bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        flex: 1, padding: '60px 32px 40px', textAlign: 'center',
        transition: 'background 0.4s ease',
      }}>
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

      {/* Bottom controls */}
      <div style={{ padding: '32px 24px 48px', background: '#fff' }}>
        {/* Dot indicators */}
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

        <button
          className="primary-btn"
          onClick={() => isLast ? onDone() : setIdx(i => i + 1)}
          style={{ marginBottom: 12 }}
        >
          {isLast ? 'Get Started' : 'Next'}
        </button>

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
