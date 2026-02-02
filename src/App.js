import React from 'react';

// Basic Container Styles
const styles = `
  body { margin: 0; padding: 0; background: #000; }
  .app-frame { 
    max-width: 420px; height: 95vh; margin: 2vh auto; 
    background: #ffffff; border-radius: 40px; border: 12px solid #1a1a1a; 
    overflow: hidden; position: relative; font-family: sans-serif; 
  }
  .screen { height: 100%; display: flex; flex-direction: column; background: #F2F2F7; }
  .status-bar { height: 44px; display: flex; justify-content: space-between; padding: 0 20px; align-items: center; font-weight: 600; background: white; }
`;

function App() {
  return (
    <>
      <style>{styles}</style>
      <div className="app-frame">
        <div className="status-bar"><span>9:41</span><span>Signal</span></div>
        <div className="screen">
          <p style={{textAlign: 'center', marginTop: 100}}>Initializing App...</p>
        </div>
      </div>
    </>
  );
}
export default App;
import React from 'react';
import { MapPin } from 'lucide-react';

const styles = `
  body { margin: 0; padding: 0; background: #000; }
  .app-frame { max-width: 420px; height: 95vh; margin: 2vh auto; background: #ffffff; border-radius: 40px; border: 12px solid #1a1a1a; overflow: hidden; position: relative; font-family: sans-serif; }
  .screen { height: 100%; display: flex; flex-direction: column; background: #F2F2F7; padding: 20px; }
  
  /* Branding Styles */
  .login-header { margin-top: 60px; text-align: center; margin-bottom: 40px; }
  .app-logo {
    width: 80px; height: 80px; background: #0056D2; border-radius: 20px; 
    margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 10px 20px rgba(0,86,210,0.3);
  }
`;

function App() {
  return (
    <>
      <style>{styles}</style>
      <div className="app-frame">
        <div className="screen">
          <div className="login-header">
            <div className="app-logo">
              <MapPin size={40} color="white" />
            </div>
            <h1>Park Now</h1>
            <p style={{color: '#8E8E93'}}>Find a spot in 30 seconds.</p>
          </div>
        </div>
      </div>
    </>
  );
}
export default App;
import React from 'react';
import { MapPin } from 'lucide-react';

const styles = `
  body { margin: 0; padding: 0; background: #000; }
  .app-frame { max-width: 420px; height: 95vh; margin: 2vh auto; background: #ffffff; border-radius: 40px; border: 12px solid #1a1a1a; overflow: hidden; position: relative; font-family: sans-serif; }
  .screen { height: 100%; display: flex; flex-direction: column; background: #F2F2F7; padding: 20px; }
  .login-header { margin-top: 60px; text-align: center; margin-bottom: 40px; }
  .app-logo { width: 80px; height: 80px; background: #0056D2; border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px rgba(0,86,210,0.3); }
`;

function App() {
  return (
    <>
      <style>{styles}</style>
      <div className="app-frame">
        <div className="screen">
          <div className="login-header">
            <div className="app-logo"><MapPin size={40} color="white" /></div>
            <h1>Park Now</h1>
            <p style={{color: '#8E8E93'}}>Find a spot in 30 seconds.</p>
          </div>
          
          {/* Basic Form Structure */}
          <form>
            <input type="email" placeholder="Email Address" />
            <br />
            <input type="password" placeholder="Password" />
            <br />
            <button>Sign In</button>
          </form>
        </div>
      </div>
    </>
  );
}
export default App;
import React from 'react';
import { MapPin } from 'lucide-react';

const styles = `
  body { margin: 0; padding: 0; background: #000; }
  .app-frame { max-width: 420px; height: 95vh; margin: 2vh auto; background: #ffffff; border-radius: 40px; border: 12px solid #1a1a1a; overflow: hidden; position: relative; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .screen { height: 100%; display: flex; flex-direction: column; background: #F2F2F7; padding: 20px; box-sizing: border-box; }
  .login-header { margin-top: 60px; text-align: center; margin-bottom: 40px; }
  .app-logo { width: 80px; height: 80px; background: #0056D2; border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px rgba(0,86,210,0.3); }

  /* New Input Styles */
  .ios-input-group { background: white; border-radius: 12px; overflow: hidden; margin-bottom: 25px; }
  .ios-input-row { display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #E5E5EA; }
  .ios-input-row:last-child { border-bottom: none; }
  .ios-input { border: none; outline: none; font-size: 17px; flex: 1; margin-left: 10px; }
  .primary-btn { background: #0056D2; color: white; border: none; width: 100%; padding: 16px; border-radius: 14px; font-size: 17px; font-weight: 600; cursor: pointer; }
`;

function App() {
  return (
    <>
      <style>{styles}</style>
      <div className="app-frame">
        <div className="screen">
          <div className="login-header">
            <div className="app-logo"><MapPin size={40} color="white" /></div>
            <h1 style={{fontSize: 32, fontWeight: 800, margin: '5px 0'}}>Park Now</h1>
            <p style={{color: '#8E8E93', margin: 0}}>Find a spot in 30 seconds.</p>
          </div>

          <form>
            <div className="ios-input-group">
              <div className="ios-input-row">
                <input className="ios-input" placeholder="Email" />
              </div>
              <div className="ios-input-row">
                <input className="ios-input" placeholder="Password" type="password" />
              </div>
            </div>
            <button className="primary-btn">Sign In</button>
          </form>
        </div>
      </div>
    </>
  );
}
export default App;
import React from 'react';
import { MapPin, Mail, Lock } from 'lucide-react'; // Added Mail and Lock icons

const styles = `
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
`;

function App() {
  return (
    <>
      <style>{styles}</style>
      <div className="app-frame">
        <div className="screen">
          <div className="login-header">
            <div className="app-logo"><MapPin size={40} color="white" /></div>
            <h1 style={{fontSize: 32, fontWeight: 800, margin: '5px 0'}}>Park Now</h1>
            <p style={{color: '#8E8E93', margin: 0}}>Find a spot in 30 seconds.</p>
          </div>

          <form>
            <div className="ios-input-group">
              <div className="ios-input-row">
                <Mail size={20} color="#8E8E93" /> {/* Added Icon */}
                <input className="ios-input" placeholder="Email" />
              </div>
              <div className="ios-input-row">
                <Lock size={20} color="#8E8E93" /> {/* Added Icon */}
                <input className="ios-input" placeholder="Password" type="password" />
              </div>
            </div>
            <button className="primary-btn">Sign In</button>
          </form>
        </div>
      </div>
    </>
  );
}
export default App;
import React, { useState } from 'react'; // Added useState
import { MapPin, Mail, Lock } from 'lucide-react';

const styles = `
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
`;

function App() {
  // Logic to handle typing
  const [email, setEmail] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (email) {
      alert('Validation successful. Redirecting...');
    } else {
      alert('Please enter an email address');
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app-frame">
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
          </form>
        </div>
      </div>
    </>
  );
}
export default App;