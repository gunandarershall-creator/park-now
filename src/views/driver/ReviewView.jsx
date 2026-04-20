// ============================================================================
//  VIEW: ReviewView.jsx - rate the session after it ends
// ============================================================================
//  Shown automatically when a parking session wraps up. The user picks a
//  1-5 star rating by tapping a star, optionally types a review, and
//  submits. The submit button stays disabled until they pick a rating so
//  we never save a rating-less review.
//
//  The written text is optional but the stars are required - a host needs
//  to know how their spot was rated even if the driver doesn't feel like
//  writing a paragraph.
// ============================================================================

import React from 'react';
import { Star } from 'lucide-react';

const ReviewView = ({ selectedSpot, rating, setRating, reviewText, setReviewText, onSubmit }) => (
  <div className="screen" style={{background: '#ffffff'}}>
    {/* Header prompting the user to rate their stay */}
    <div className="review-header">
      <h2 style={{fontSize: 28, fontWeight: 800, margin: '0 0 10px 0'}}>Session Ended</h2>
      <p style={{color: '#8E8E93', fontSize: 16, margin: 0}}>
        How was your parking experience at <b>{selectedSpot.address}</b>?
      </p>
    </div>

    {/* The five star buttons. Tapping a star fills in that one plus all */}
    {/* the ones to its left, just like every star rating you've ever seen. */}
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
      {/* Optional written feedback */}
      <textarea
        className="review-textarea"
        placeholder="Leave a public review for the host (optional)..."
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
      ></textarea>
      {/* Submit button - disabled and faded until at least one star picked */}
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
