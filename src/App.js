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