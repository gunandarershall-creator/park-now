/**
 * VIEW: PaymentMethodsView.jsx
 * Saved cards list with option to add or delete cards.
 */

import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Plus, Trash2 } from 'lucide-react';

const INITIAL_CARDS = [
  { id: 1, label: 'Personal Visa',       last4: '4242', isDefault: true  },
  { id: 2, label: 'Business Mastercard', last4: '8899', isDefault: false },
];

const PaymentMethodsView = ({ onBack, onAddCard, showToast }) => {
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [confirmDelete, setConfirmDelete] = useState(null); // id of card pending delete

  const handleDelete = (id) => {
    setCards(prev => {
      const remaining = prev.filter(c => c.id !== id);
      // If we deleted the default card, promote the first remaining card
      const deletedWasDefault = prev.find(c => c.id === id)?.isDefault;
      if (deletedWasDefault && remaining.length > 0) {
        remaining[0] = { ...remaining[0], isDefault: true };
      }
      return remaining;
    });
    setConfirmDelete(null);
    showToast('Card removed.', 'success');
  };

  const handleSetDefault = (id) => {
    setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === id })));
    showToast('Default card updated.', 'success');
  };

  return (
    <div className="screen" style={{ overflowY: 'auto', paddingBottom: 40 }}>
      <div className="checkout-header" style={{ marginTop: 10 }}>
        <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
        <h2 className="checkout-title">Payment Methods</h2>
      </div>

      <div className="settings-section-title">Saved Cards</div>

      {cards.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#8E8E93', padding: '32px 20px', fontSize: 14 }}>
          No saved cards. Add one below.
        </div>
      ) : (
        <div className="ios-input-group">
          {cards.map((card, idx) => (
            <div key={card.id}>
              <div className="settings-row" style={{ alignItems: 'center' }}>
                {/* Card info — tap to set as default if not already */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: card.isDefault ? 'default' : 'pointer' }}
                  onClick={() => !card.isDefault && handleSetDefault(card.id)}
                >
                  <CreditCard size={20} color={card.isDefault ? '#0056D2' : '#8E8E93'} />
                  <div>
                    <span style={{ fontWeight: 500, display: 'block', marginBottom: 2 }}>{card.label}</span>
                    <span style={{ fontSize: 13, color: '#8E8E93' }}>**** **** **** {card.last4}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {card.isDefault && (
                    <div style={{ fontSize: 12, color: '#34C759', fontWeight: 600, background: '#E8F8EE', padding: '4px 8px', borderRadius: 6 }}>
                      Default
                    </div>
                  )}
                  <button
                    onClick={() => setConfirmDelete(card.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                  >
                    <Trash2 size={18} color="#FF3B30" />
                  </button>
                </div>
              </div>

              {/* Inline delete confirmation */}
              {confirmDelete === card.id && (
                <div style={{
                  background: '#FFF5F5', borderTop: '1px solid #FFD0CE',
                  padding: '12px 16px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 12,
                }}>
                  <span style={{ fontSize: 13, color: '#FF3B30', fontWeight: 500 }}>
                    Remove this card?
                  </span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(card.id)}
                      style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: '#FF3B30', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {idx < cards.length - 1 && (
                <div style={{ height: 1, background: '#E5E5EA', marginLeft: 52 }} />
              )}
            </div>
          ))}
        </div>
      )}

      {!cards.every(c => c.isDefault) && cards.length > 1 && (
        <div style={{ fontSize: 12, color: '#8E8E93', padding: '6px 16px' }}>
          Tap a card to set it as default.
        </div>
      )}

      <div className="settings-section-title" style={{ marginTop: 25 }}>Add New</div>
      <div className="ios-input-group">
        <div className="settings-row" onClick={onAddCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#0056D2' }}>
            <Plus size={20} />
            <span style={{ fontWeight: 500 }}>Enter Card Details Manually</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodsView;
