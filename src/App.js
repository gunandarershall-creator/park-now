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