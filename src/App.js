/**
 * PROJECT: Park Now - Application
 * COMMIT: 11 (Checkout & Booking Flow)
 * DESCRIPTION: Adds a checkout screen to simulate the atomic booking transaction.
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Mail, Lock, Menu, User, Star, X, ArrowLeft, CreditCard } from 'lucide-react'; // Added ArrowLeft and CreditCard

const styles = `
  /* --- LOGIN STYLES --- */
  body { margin: 0; padding: 0; background: #000; }
  .app-frame { max-width: 420px; height: 95vh; margin: 2vh auto; background: #ffffff; border-radius: 40px; border: 12px solid #1a1a1a; overflow: hidden; position: relative; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; }
  .screen { height: 100%; display: flex; flex-direction: column; background: #F2F2F7; padding: 20px; box-sizing: border-box; position: relative; flex: 1; overflow: hidden; }
  .login-header { margin-top: 60px; text-align: center; margin-bottom: 40px; }
  .app-logo { width: 80px; height: 80px; background: #0056D2; border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px rgba(0,86,210,0.3); }
  .ios-input-group { background: white; border-radius: 12px; overflow: hidden; margin-bottom: 25px; }
  .ios-input-row { display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #E5E5EA; }
  .ios-input-row:last-child { border-bottom: none; }
  .ios-input { border: none; outline: none; font-size: 17px; flex: 1; margin-left: 10px; }
  .primary-btn { background: #0056D2; color: white; border: none; width: 100%; padding: 16px; border-radius: 14px; font-size: 17px; font-weight: 600; cursor: pointer; }
  .secondary-btn { background: transparent; color: #0056D2; border: none; width: 100%; padding: 10px; margin-top: 10px; font-size: 15px; font-weight: 500; cursor: pointer; }
  .signup-area { margin-top: auto; margin-bottom: 20px; text-align: center; font-size: 15px; color: #8E8E93; }
  .signup-link { color: #0056D2; font-weight: 600; border: none; background: none; cursor: pointer; font-size: 15px; padding: 0; margin-left: 5px; }

  /* --- MAP STYLES --- */
  .search-header { position: absolute; top: 20px; left: 20px; right: 20px; z-index: 1000; display: flex; gap: 10px; align-items: center; }
  .search-input { flex: 1; background: white; padding: 12px 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 8px; font-weight: 500; }
  .icon-btn { background: white; border-radius: 50%; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; }
  
  .map-simulation { width: 100%; height: 100%; position: relative; background-color: #E2E2E0; overflow: hidden; }
  .fake-road-1 { position: absolute; top: 40%; left: -10%; right: -10%; height: 20px; background: #FFFFFF; transform: rotate(-10deg); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
  .fake-road-2 { position: absolute; top: -10%; bottom: -10%; left: 55%; width: 25px; background: #FFFFFF; transform: rotate(15deg); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
  
  .price-marker { position: absolute; background: white; border-radius: 20px; padding: 6px 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); border: 1px solid #ddd; display: flex; justify-content: center; align-items: center; transition: all 0.2s; z-index: 10; cursor: pointer; }
  .price-marker:hover, .price-marker.active { transform: scale(1.1); background: #0056D2; color: white; border-color: #0056D2; z-index: 20; }
  .price-marker::after { content: ''; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); border-width: 6px 6px 0; border-style: solid; border-color: white transparent transparent transparent; }
  .price-marker:hover::after, .price-marker.active::after { border-color: #0056D2 transparent transparent transparent; }

  /* --- BOTTOM SHEET STYLES --- */
  .bottom-sheet { position: absolute; bottom: 0; left: 0; right: 0; background: white; border-radius: 24px 24px 0 0; padding: 24px; box-shadow: 0 -10px 25px rgba(0,0,0,0.15); z-index: 2000; display: flex; flex-direction: column; gap: 16px; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .sheet-header { display: flex; justify-content: space-between; align-items: flex-start; }
  .sheet-title { font-size: 22px; font-weight: 800; margin: 0 0 4px 0; }
  .sheet-subtitle { color: #8E8E93; font-size: 15px; margin: 0; display: flex; align-items: center; gap: 4px; }
  .close-btn { background: #F2F2F7; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; }
  .sheet-image { width: 100%; height: 140px; border-radius: 12px; background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%); display: flex; align-items: center; justify-content: center; color: #0056D2; font-weight: 600; }
  .price-row { display: flex; justify-content: space-between; align-items: flex-end; }
  .price-label { margin: 0; color: #8E8E93; font-size: 14px; margin-bottom: 4px; }
  .sheet-price { font-size: 28px; font-weight: 800; color: #000; margin: 0; }
  .spots-left { color: #FF3B30; font-weight: 600; font-size: 14px; margin: 0; background: #FFEBEA; padding: 4px 10px; border-radius: 8px; }

  /* --- NEW STYLES: CHECKOUT SCREEN --- */
  .checkout-header { display: flex; align-items: center; padding-bottom: 15px; border-bottom: 1px solid #E5E5EA; margin-bottom: 20px; margin-top: 30px;}
  .checkout-title { flex: 1; text-align: center; font-size: 20px; font-weight: 700; margin: 0; padding-right: 24px;}
  .receipt-box { background: white; border-radius: 16px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
  .receipt-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px; color: #333; }
  .receipt-row.total { font-weight: 800; font-size: 18px; border-top: 1px solid #E5E5EA; padding-top: 12px; margin-top: 4px; margin-bottom: 0; color: #000;}
  .apple-pay-btn { background: #000; color: white; border: none; width: 100%; padding: 16px; border-radius: 14px; font-size: 18px; font-weight: 600; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: auto; margin-bottom: 10px; }
  .payment-method-row { display: flex; align-items: center; gap: 10px; padding: 15px; background: white; border-radius: 12px; margin-bottom: 20px; border: 1px solid #E5E5EA;}
`;

function App() {
  const [email, setEmail] = useState('');
  // NEW: State can now be 'login', 'map', or 'checkout'
  const [currentScreen, setCurrentScreen] = useState('login'); 
  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);

  useEffect(() => {
    setSpots([
      { id: '1', top: '35%', left: '30%', price: 4.50, address: 'Kingston University', rating: 4.8, distance: '2 min walk', spotsLeft: 3 },
      { id: '2', top: '55%', left: '60%', price: 6.00, address: 'Penrhyn Road', rating: 4.5, distance: '5 min walk', spotsLeft: 1 },
      { id: '3', top: '65%', left: '20%', price: 5.25, address: 'High St Garage', rating: 4.9, distance: '1 min walk', spotsLeft: 8 }
    ]);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (email) setCurrentScreen('map'); 
    else alert('Please enter an email address');
  };

  // NEW: Function to simulate the atomic transaction from your report
  const handlePayment = () => {
    alert(`Success! Simulating atomic transaction...\n\nYour spot at ${selectedSpot.address} is secured. Database locked & updated.`);
    setSelectedSpot(null); // Clear the selected spot
    setCurrentScreen('map'); // Send user back to map
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app-frame">
        
        {/* --- LOGIN SCREEN --- */}
        {currentScreen === 'login' && (
          <div className="screen">
            <div className="login-header">
              <div className="app-logo"><MapPin size={40} color="white" /></div>
              <h1 style={{fontSize: 32, fontWeight: 800, margin: '5px 0'}}>Park Now</h1>
              <p style={{color: '#8E8E93', margin: 0}}>Find a spot in 30 seconds.</p>
            </div>
            
            <form onSubmit={handleLogin}>
              <div className="ios-input-group">
                <div className="ios-input-row">
                  <Mail size={20} color="#8E8E93" />
                  <input className="ios-input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="ios-input-row">
                  <Lock size={20} color="#8E8E93" />
                  <input className="ios-input" placeholder="Password" type="password" />
                </div>
              </div>
              
              <button className="primary-btn" type="submit">Sign In</button>
              <button type="button" className="secondary-btn" onClick={() => alert('Coming soon')}>Forgot Password?</button>
            </form>

            <div className="signup-area">
              New to Park Now? 
              <button type="button" className="signup-link" onClick={() => alert('Coming soon')}>Create Account</button>
            </div>
          </div>
        )}

        {/* --- MAP SCREEN --- */}
        {currentScreen === 'map' && (
          <div className="screen" style={{padding: 0}}>
            <div className="search-header">
              <div className="icon-btn" onClick={() => setCurrentScreen('login')}><Menu size={24} color="#000" /></div>
              <div className="search-input"><MapPin size={16} color="#0056D2" /><span>Kingston, UK</span></div>
              <div className="icon-btn"><User size={24} color="#000" /></div>
            </div>
            
            <div className="map-simulation" onClick={() => setSelectedSpot(null)}>
              <div className="fake-road-1"></div>
              <div className="fake-road-2"></div>

              {spots.map(spot => (
                <div 
                  key={spot.id} 
                  className={`price-marker ${selectedSpot?.id === spot.id ? 'active' : ''}`}
                  style={{ top: spot.top, left: spot.left }}
                  onClick={(e) => { e.stopPropagation(); setSelectedSpot(spot); }}
                >
                  £{spot.price.toFixed(2)}
                </div>
              ))}
            </div>

            {/* Bottom Sheet */}
            {selectedSpot && (
              <div className="bottom-sheet">
                <div className="sheet-header">
                  <div>
                    <h3 className="sheet-title">{selectedSpot.address}</h3>
                    <p className="sheet-subtitle">
                      <Star size={16} fill="#FFCC00" color="#FFCC00" /> {selectedSpot.rating} • <span style={{marginLeft: 8}}>{selectedSpot.distance}</span>
                    </p>
                  </div>
                  <button className="close-btn" onClick={() => setSelectedSpot(null)}><X size={18} color="#000" /></button>
                </div>

                <div className="sheet-image">Street View Image</div>

                <div className="price-row">
                  <div>
                    <p className="price-label">Total per hour</p>
                    <p className="sheet-price">£{selectedSpot.price.toFixed(2)}</p>
                  </div>
                  <p className="spots-left" style={selectedSpot.spotsLeft > 3 ? {color: '#34C759', background: '#E8F8EE'} : {}}>
                    {selectedSpot.spotsLeft} spots left
                  </p>
                </div>

                {/* NEW: This button now switches the screen to 'checkout' */}
                <button className="primary-btn" onClick={() => setCurrentScreen('checkout')}>
                  Book Spot
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- NEW: CHECKOUT SCREEN --- */}
        {currentScreen === 'checkout' && selectedSpot && (
          <div className="screen">
            <div className="checkout-header">
              {/* Back Button */}
              <button className="close-btn" onClick={() => setCurrentScreen('map')}>
                <ArrowLeft size={20} color="#000" />
              </button>
              <h2 className="checkout-title">Confirm Booking</h2>
            </div>

            {/* Receipt details simulating a 2-hour booking */}
            <div className="receipt-box">
              <h3 style={{marginTop: 0, marginBottom: 15}}>{selectedSpot.address}</h3>
              <div className="receipt-row">
                <span style={{color: '#8E8E93'}}>Date</span>
                <span>Today</span>
              </div>
              <div className="receipt-row">
                <span style={{color: '#8E8E93'}}>Duration</span>
                <span>2 Hours (14:00 - 16:00)</span>
              </div>
              <div className="receipt-row">
                <span style={{color: '#8E8E93'}}>Rate</span>
                <span>£{selectedSpot.price.toFixed(2)} / hr</span>
              </div>
              <div className="receipt-row total">
                <span>Total Due</span>
                {/* Math logic: multiplies hourly rate by 2 */}
                <span>£{(selectedSpot.price * 2).toFixed(2)}</span>
              </div>
            </div>

            <h4 style={{marginBottom: 10, color: '#666'}}>Payment Method</h4>
            <div className="payment-method-row">
              <CreditCard size={24} color="#0056D2" />
              <div style={{flex: 1}}>
                <div style={{fontWeight: 600}}>Personal Card</div>
                <div style={{fontSize: 13, color: '#8E8E93'}}>Visa ending in 4242</div>
              </div>
            </div>

            {/* Simulates the final transaction */}
            <button className="apple-pay-btn" onClick={handlePayment}>
              Pay & Confirm
            </button>
          </div>
        )}

      </div>
    </>
  );
}
export default App;