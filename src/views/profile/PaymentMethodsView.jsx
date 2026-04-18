/**
 * VIEW: PaymentMethodsView.jsx
 * Saved cards list — data comes from Firebase via useCards hook in App.js.
 */

import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Plus, Trash2 } from 'lucide-react';

const PaymentMethodsView = ({ cards = [], onAddCard, onDeleteCard, onSetDefault }) => {
  const [confirmDelete, setConfirmDelete] = useState(null);

  return (
    <div className="screen" style={{ overflowY: 'auto', paddingBottom: 40 }}>
      <div className="checkout-header" style={{ marginTop: 10 }}>
        <button className="close-btn" onClick={onAddCard ? undefined : null}>
          <ArrowLeft size={20} color="#000" onClick={() => window.history.back()} />
        </button>
        <h2 className="checkout-title">Payment Methods</h2>
      </div>

      <div className="settings-section-title">Saved Cards</div>

      {cards.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#8E8E93', padding: '32px 20px', fontSize: 14 }}>
          No saved cards yet. Add one below.
        </div>
      ) : (
        <div className="ios-input-group">
          {cards.map((card, idx) => (
            <div key={card.id}>
              <div className="settings-row" style={{ alignItems: 'center' }}>
                {/* Tap to set as default */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: card.isDefault ? 'default' : 'pointer' }}
                  onClick={() => !card.isDefault && onSetDefault && onSetDefault(card.id)}
                >
                  <CreditCard size={20} color={card.isDefault ? '#0056D2' : '#8E8E93'} />
                  <div>
                    <span style={{ fontWeight: 500, display: 'block', marginBottom: 2 }}>{card.label}</span>
                    <span style={{ fontSize: 13, color: '#8E8E93' }}>
                      **** **** **** {card.last4}
                      {card.expiry ? `  ·  ${card.expiry}` : ''}
                    </span>
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
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
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
                  justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 13, color: '#FF3B30', fontWeight: 500 }}>Remove this card?</span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => { onDeleteCard && onDeleteCard(card.id); setConfirmDelete(null); }}
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

      {cards.length > 1 && (
        <p style={{ fontSize: 12, color: '#8E8E93', padding: '6px 16px' }}>
          Tap a card to set it as default.
        </p>
      )}

      <div className="settings-section-title" style={{ marginTop: 25 }}>Add New</div>
      <div className="ios-input-group">
        <div className="settings-row" onClick={onAddCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#0056D2' }}>
            <Plus size={20} />
            <span style={{ fontWeight: 500 }}>Enter Card Details</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodsView;
