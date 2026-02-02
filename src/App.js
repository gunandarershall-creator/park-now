/**
 * PROJECT: Park Now - Login Module
 * FILE: src/App.js
 * DESCRIPTION: This file handles the initial authentication view.
 * It uses React State to manage user input and validation.
 */

import React, { useState } from 'react'; // 'useState' allows us to store data (like email) in memory
import { MapPin, Mail, Lock } from 'lucide-react'; // Import icons for better User Experience (UX)

/**
 * CSS STYLES (Internal Stylesheet)
 * We define styles here to keep the component self-contained.
 * Design Standard: iOS Human Interface Guidelines (clean, white, rounded corners).
 */
const styles = `
  /* Reset default browser margins and set background to black */
  body { margin: 0; padding: 0; background: #000; }
  
  /* The Main App Container - Simulates an iPhone 14 Pro dimensions */
  .app-frame { 
    max-width: 420px; 
    height: 95vh; 
    margin: 2vh auto; 
    background: #ffffff; 
    border-radius: 40px; 
    border: 12px solid #1a1a1a; /* The bezel */
    overflow: hidden; 
    position: relative; 
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
  }

  /* The Content Screen inside the phone */
  .screen { 
    height: 100%; 
    display: flex; 
    flex-direction: column; 
    background: #F2F2F7; /* Apple System Gray 6 */
    padding: 20px; 
    box-sizing: border-box; 
  }

  /* Header Section Styling */
  .login-header { margin-top: 60px; text-align: center; margin-bottom: 40px; }
  
  /* Logo Styling - The Blue Box */
  .app-logo { 
    width: 80px; height: 80px; 
    background: #0056D2; /* Trust Blue color */
    border-radius: 20px; 
    margin: 0 auto 20px; 
    display: flex; align-items: center; justify-content: center; 
    box-shadow: 0 10px 20px rgba(0,86,210,0.3); /* Soft shadow for depth */
  }

  /* Input Group Container - Grouped style like iOS Settings */
  .ios-input-group { 
    background: white; 
    border-radius: 12px; 
    overflow: hidden; 
    margin-bottom: 25px; 
  }
  
  /* Individual Input Row */
  .ios-input-row { 
    display: flex; 
    align-items: center; 
    padding: 15px; 
    border-bottom: 1px solid #E5E5EA; /* Separator line */
  }
  .ios-input-row:last-child { border-bottom: none; } /* Remove line on last item */

  /* The actual typing field */
  .ios-input { 
    border: none; 
    outline: none; 
    font-size: 17px; 
    flex: 1; /* Takes up remaining space */
    margin-left: 10px; 
  }

  /* Main Action Button */
  .primary-btn { 
    background: #0056D2; 
    color: white; 
    border: none; 
    width: 100%; 
    padding: 16px; 
    border-radius: 14px; 
    font-size: 17px; 
    font-weight: 600; 
    cursor: pointer; 
  }
`;

/**
 * COMPONENT: App
 * This is the main function that builds the UI.
 */
function App() {
  // STATE VARIABLE: 'email'
  // 1. email: variable that holds the text the user types.
  // 2. setEmail: function we call to update that variable.
  // 3. useState(''): initializes it as an empty string.
  const [email, setEmail] = useState('');

  // NAVIGATION STATE
  // 'currentScreen' determines which view is shown. 
  // Default is 'login'. logic will switch this to 'map'.
  const [currentScreen, setCurrentScreen] = useState('login');
  
  /**
   * FUNCTION: handleLogin
   * This runs when the user clicks the "Sign In" button.
   */
  const handleLogin = (e) => {
    e.preventDefault(); // Stop the page from reloading (default HTML behavior)
    
    // Check if the user typed anything
    if (email.length > 0) {
      // Success: Switch state to 'map' to trigger re-render
      setCurrentScreen('map');
    } else {
      // Error: User left the field empty
      alert('Please enter an email address');
    }
  };

  // RENDER: This is the HTML that appears on screen
  return (
    <>
      <style>{styles}</style> {/* Loads the CSS */}
      
      <div className="app-frame">
        {/* CONDITIONAL RENDERING: Check which screen to show */}
        {currentScreen === 'login' ? (
          <div className="screen">
            
            {/* 1. Header with Logo */}
            <div className="login-header">
              <div className="app-logo"><MapPin size={40} color="white" /></div>
              <h1 style={{fontSize: 32, fontWeight: 800, margin: '5px 0'}}>Park Now</h1>
              <p style={{color: '#8E8E93', margin: 0}}>Find a spot in 30 seconds.</p>
            </div>
            
            {/* 2. Login Form */}
            <form onSubmit={handleLogin}>
              <div className="ios-input-group">
                
                {/* Email Field */}
                <div className="ios-input-row">
                  <Mail size={20} color="#8E8E93" />
                  <input 
                    className="ios-input" 
                    placeholder="Email" 
                    value={email} // Connects input to our State
                    onChange={(e) => setEmail(e.target.value)} // Updates State when typing
                  />
                </div>

                {/* Password Field (Static for now) */}
                <div className="ios-input-row">
                  <Lock size={20} color="#8E8E93" />
                  <input className="ios-input" placeholder="Password" type="password" />
                </div>

              </div>
              
              {/* 3. Submit Button */}
              <button className="primary-btn" type="submit">Sign In</button>
            </form>
          </div>
        ) : (
          // PLACEHOLDER: This shows if currentScreen is NOT 'login' (i.e., 'map')
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