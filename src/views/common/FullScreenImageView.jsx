/**
 * VIEW: FullScreenImageView.jsx
 * Fullscreen overlay for viewing spot images.
 */

import React from 'react';
import { X } from 'lucide-react';

const FullScreenImageView = ({ imageUrl, onClose }) => (
  <div className="fullscreen-overlay" onClick={onClose}>
    <button
      className="fullscreen-close"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <X size={24} color="#FFF" />
    </button>
    <img src={imageUrl} alt="Full Screen View" className="fullscreen-img" />
  </div>
);

export default FullScreenImageView;
