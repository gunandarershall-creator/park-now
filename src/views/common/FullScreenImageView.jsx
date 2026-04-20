// ============================================================================
//  VIEW: FullScreenImageView.jsx - tap a spot photo, see it big
// ============================================================================
//  Tiny overlay component. When the driver taps the photo on the booking
//  confirmation screen (or anywhere else we want a zoomed view), we show
//  the image covering the whole screen with a dark backdrop and a close
//  button in the corner.
//
//  Clicking the backdrop dismisses it; clicking the close button also
//  dismisses it but we stopPropagation so it doesn't fire twice.
// ============================================================================

import React from 'react';
import { X } from 'lucide-react';

const FullScreenImageView = ({ imageUrl, onClose }) => (
  // Tapping anywhere on the dark overlay closes the image.
  <div className="fullscreen-overlay" onClick={onClose}>
    <button
      className="fullscreen-close"
      // stopPropagation prevents the overlay's onClick from ALSO firing.
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <X size={24} color="#FFF" />
    </button>
    <img src={imageUrl} alt="Full Screen View" className="fullscreen-img" />
  </div>
);

export default FullScreenImageView;
