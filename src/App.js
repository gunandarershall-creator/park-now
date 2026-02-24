/**
 * PROJECT: Park Now - Application
 * COMMIT: 9 (Interactive Map Integration - Prototype Version)
 * DESCRIPTION: Uses a pure-React prototype map to avoid 'leaflet' compilation errors.
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Mail, Lock, Menu, User } from 'lucide-react';

const styles = `
  /* --- LOGIN STYLES --- */
  body { margin: 0; padding: 0; background: #000; }
  .app-frame { max-width: 420px; height: 95vh; margin: 2vh auto; background: #ffffff; border-radius: 40px; border: 12px solid #1a1a1a; overflow: hidden; position: relative; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; }
  .screen { height: 100%; display: flex; flex-direction: column; background: #F2F2F7; padding: 20px; box-sizing: border-box; position: relative; flex: 1; }
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

  /* --- NEW MAP STYLES (Prototype Version) --- */
  .search-header { position: absolute; top: 20px; left: 20px; right: 20px; z-index: 1000; display: flex; gap: 10px; align-items: center; }
  .search-input { flex: 1; background: white; padding: 12px 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 8px; font-weight: 500; }
  .icon-btn { background: white; border-radius: 50%; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; }
  
  /* Prototype Map Area */
  .map-simulation { width: 100%; height: 100%; position: relative; background-color: #E2E2E0; overflow: hidden; }
  .fake-road-1 { position: absolute; top: 40%; left: -10%; right: -10%; height: 20px; background: #FFFFFF; transform: rotate(-10deg); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
  .fake-road-2 { position: absolute; top: -10%; bottom: -10%; left: 55%; width: 25px; background: #FFFFFF; transform: rotate(15deg); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
  
  /* Airbnb-style Price Marker */
  .price-marker { position: absolute; background: white; border-radius: 20px; padding: 6px 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); border: 1px solid #ddd; display: flex; justify-content: center; align-items: center; transition: all 0.2s; z-index: 10; cursor: pointer; }
  .price-marker:hover { transform: scale(1.1); background: #0056D2; color: white; border-color: #0056D2; z-index: 20; }
  .price-marker::after { content: ''; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); border-width: 6px 6px 0; border-style: solid; border-color: white transparent transparent transparent; }
  .price-marker:hover::after { border-color: #0056D2 transparent transparent transparent; }
`;

function App() {
  const [email, setEmail] = useState('');
  const [currentScreen, setCurrentScreen] = useState('login'); 
  
  // State to hold our mock database of parking spots
  const [spots, setSpots] = useState([]);

  // Load fake data when the app starts
  useEffect(() => {
    // Switched coordinates to percentage-based top/left values for the prototype map
    setSpots([
      { id: '1', top: '35%', left: '30%', price: 4.50, address: 'Kingston University' },
      { id: '2', top: '55%', left: '60%', price: 6.00, address: 'Penrhyn Road' },
      { id: '3', top: '65%', left: '20%', price: 5.25, address: 'High St Garage' }
    ]);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (email) {
      setCurrentScreen('map'); 
    } else {
      alert('Please enter an email address');
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app-frame">
        
        {currentScreen === 'login' ? (
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
                  <input 
                    className="ios-input" 
                    placeholder="Email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="ios-input-row">
                  <Lock size={20} color="#8E8E93" />
                  <input className="ios-input" placeholder="Password" type="password" />
                </div>
              </div>
              
              <button className="primary-btn" type="submit">Sign In</button>
              <button type="button" className="secondary-btn" onClick={() => alert('Coming soon')}>
                Forgot Password?
              </button>
            </form>

            <div className="signup-area">
              New to Park Now? 
              <button type="button" className="signup-link" onClick={() => alert('Coming soon')}>
                Create Account
              </button>
            </div>
          </div>
        ) : (
          <div className="screen" style={{padding: 0}}>
            
            {/* The Floating Search Bar */}
            <div className="search-header">
              <div className="icon-btn"><Menu size={24} color="#000" /></div>
              <div className="search-input">
                <MapPin size={16} color="#0056D2" />
                <span>Kingston, UK</span>
              </div>
              <div className="icon-btn" onClick={() => alert('Profile coming soon')}><User size={24} color="#000" /></div>
            </div>
            
            {/* Simulated Prototype Map (Fixes dependency errors) */}
            <div className="map-simulation">
              {/* Fake UI map roads */}
              <div className="fake-road-1"></div>
              <div className="fake-road-2"></div>

              {/* Placed Markers */}
              {spots.map(spot => (
                <div 
                  key={spot.id} 
                  className="price-marker"
                  style={{ top: spot.top, left: spot.left }}
                  onClick={() => alert(`You clicked ${spot.address} (£${spot.price.toFixed(2)}/hr)`)}
                >
                  £{spot.price.toFixed(2)}
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </>
  );
}
export default App;