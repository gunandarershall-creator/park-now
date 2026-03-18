/**
 * VIEW: AddCardView.jsx
 * Manual card entry form.
 */

import React from 'react';
import { ArrowLeft, User, CreditCard } from 'lucide-react';

const AddCardView = ({ onBack }) => (
  <div className="screen" style={{overflowY: 'auto'}}>
    <div className="checkout-header" style={{marginTop: 10}}>
      <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
      <h2 className="checkout-title">Add Card</h2>
    </div>

    <form onSubmit={(e) => {
      e.preventDefault();
      alert('Card details securely encrypted and saved!');
      onBack();
    }}>
      <div className="form-section">
        <div className="input-label">Card Information</div>
        <div className="ios-input-group">
          <div className="ios-input-row">
            <User size={20} color="#8E8E93" />
            <input className="ios-input" placeholder="Cardholder Name" required />
          </div>
          <div className="ios-input-row">
            <CreditCard size={20} color="#8E8E93" />
            <input className="ios-input" placeholder="Card Number" type="text" maxLength="19" required />
          </div>
          <div style={{display: 'flex'}}>
            <div className="ios-input-row" style={{flex: 1, borderRight: '1px solid #E5E5EA'}}>
              <input className="ios-input" placeholder="MM/YY" type="text" maxLength="5" required style={{marginLeft: 0, textAlign: 'center'}} />
            </div>
            <div className="ios-input-row" style={{flex: 1}}>
              <input className="ios-input" placeholder="CVV" type="text" maxLength="4" required style={{marginLeft: 0, textAlign: 'center'}} />
            </div>
          </div>
        </div>
      </div>

      <button className="primary-btn" type="submit" style={{marginTop: 20}}>Save Card</button>
    </form>
  </div>
);

export default AddCardView;
