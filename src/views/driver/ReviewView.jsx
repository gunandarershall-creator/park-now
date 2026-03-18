/**
 * VIEW: ReviewView.jsx
 * Post-session star rating and review submission screen.
 */

import React from 'react';
import { Star } from 'lucide-react';

const ReviewView = ({ selectedSpot, rating, setRating, onSubmit }) => (
  <div className="screen" style={{background: '#ffffff'}}>
    <div className="review-header">
      <h2 style={{fontSize: 28, fontWeight: 800, margin: '0 0 10px 0'}}>Session Ended</h2>
      <p style={{color: '#8E8E93', fontSize: 16, margin: 0}}>
        How was your parking experience at <b>{selectedSpot.address}</b>?
      </p>
    </div>

    <div className="star-row">
      {[1, 2, 3, 4, 5].map((starValue) => (
        <button key={starValue} className="star-btn" onClick={() => setRating(starValue)}>
          <Star
            size={40}
            color={rating >= starValue ? "#FFCC00" : "#E5E5EA"}
            fill={rating >= starValue ? "#FFCC00" : "transparent"}
          />
        </button>
      ))}
    </div>

    <form onSubmit={onSubmit} style={{display: 'flex', flexDirection: 'column', flex: 1}}>
      <textarea
        className="review-textarea"
        placeholder="Leave a public review for the host (optional)..."
      ></textarea>
      <button
        className="primary-btn"
        type="submit"
        style={{marginTop: 'auto', marginBottom: 20, opacity: rating === 0 ? 0.5 : 1}}
        disabled={rating === 0}
      >
        Submit Feedback
      </button>
    </form>
  </div>
);

export default ReviewView;
