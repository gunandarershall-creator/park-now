/**
 * PROJECT: Park Now - Login Module
 * COMMIT: 8 (Adding Sign Up & Forgot Password)
 */

import React, { useState } from 'react';
import { MapPin, Mail, Lock } from 'lucide-react';

const styles = `
  /* --- EXISTING STYLES (Unchanged) --- */
  body { margin: 0; padding: 0; background: #000; }
  .app-frame { max-width: 420px; height: 95vh; margin: 2vh auto; background: #ffffff; border-radius: 40px; border: 12px solid #1a1a1a; overflow: hidden; position: relative; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .screen { height: 100%; display: flex; flex-direction: column; background: #F2F2F7; padding: 20px; box-sizing: border-box; }
  .login-header { margin-top: 60px; text-align: center; margin-bottom: 40px; }
  .app-logo { width: 80px; height: 80px; background: #0056D2; border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px rgba(0,86,210,0.3); }
  .ios-input-group { background: white; border-radius: 12px; overflow: hidden; margin-bottom: 25px; }
  .ios-input-row { display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #E5E5EA; }
  .ios-input-row:last-child { border-bottom: none; }
  .ios-input { border: none; outline: none; font-size: 17px; flex: 1; margin-left: 10px; }
  .primary-btn { background: #0056D2; color: white; border: none; width: 100%; padding: 16px; border-radius: 14px; font-size: 17px; font-weight: 600; cursor: pointer; }

  /* --- NEW STYLES (Added for Commit 8) --- */
  .secondary-btn {
    background: transparent; color: #0056D2; border: none; width: 100%;
    padding: 10px; margin-top: 10px; font-size: 15px; font-weight: 500; cursor: pointer;
  }
  .signup-area {
    margin-top: auto; margin-bottom: 20px; text-align: center;
    font-size: 15px; color: #8E8E93;
  }
  .signup-link {
    color: #0056D2; font-weight: 600; border: none; background: none;
    cursor: pointer; font-size: 15px; padding: 0; margin-left: 5px;
  }
`;

function App() {
  const [email, setEmail] = useState('');
  
  // Navigation State (Kept from Commit 7)
  const [currentScreen, setCurrentScreen] = useState('login'); 

  const handleLogin = (e) => {
    e.preventDefault();
    if (email) {
      // Logic (Kept from Commit 7)
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

              {/* NEW BUTTON: Forgot Password */}
              <button type="button" className="secondary-btn" onClick={() => alert('Coming soon')}>
                Forgot Password?
              </button>
            </form>

            {/* NEW SECTION: Sign Up */}
            <div className="signup-area">
              New to Park Now? 
              <button type="button" className="signup-link" onClick={() => alert('Coming soon')}>
                Create Account
              </button>
            </div>

          </div>
        ) : (
          // MAP PLACEHOLDER (Kept from Commit 7)
          <div className="screen" style={{justifyContent: 'center', alignItems: 'center'}}>
            <h2>Map Module Loading...</h2>
            <p>Geospatial Module Loading...</p>
          </div>
        )}
      </div>
    </>
  );
}
export default App;