/**
 * VIEW: PaymentMethodsView.jsx
 * Saved cards list with option to add a new card.
 */

import React from 'react';
import { ArrowLeft, CreditCard, Plus } from 'lucide-react';

const PaymentMethodsView = ({ onBack, onAddCard }) => (
  <div className="screen" style={{overflowY: 'auto'}}>
    <div className="checkout-header" style={{marginTop: 10}}>
      <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
      <h2 className="checkout-title">Payment Methods</h2>
    </div>

    <div className="settings-section-title">Saved Cards</div>
    <div className="ios-input-group">
      <div className="settings-row">
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <CreditCard size={20} color="#0056D2" />
          <div>
            <span style={{fontWeight: 500, display: 'block', marginBottom: 2}}>Personal Visa</span>
            <span style={{fontSize: 13, color: '#8E8E93'}}>**** **** **** 4242</span>
          </div>
        </div>
        <div style={{fontSize: 12, color: '#34C759', fontWeight: 600, background: '#E8F8EE', padding: '4px 8px', borderRadius: 6}}>Default</div>
      </div>

      <div className="settings-row">
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <CreditCard size={20} color="#8E8E93" />
          <div>
            <span style={{fontWeight: 500, display: 'block', marginBottom: 2}}>Business Mastercard</span>
            <span style={{fontSize: 13, color: '#8E8E93'}}>**** **** **** 8899</span>
          </div>
        </div>
      </div>
    </div>

    <div className="settings-section-title" style={{marginTop: 25}}>Add New</div>
    <div className="ios-input-group">
      <div className="settings-row" onClick={onAddCard}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, color: '#0056D2'}}>
          <Plus size={20} />
          <span style={{fontWeight: 500}}>Enter Card Details Manually</span>
        </div>
      </div>
    </div>
  </div>
);

export default PaymentMethodsView;
