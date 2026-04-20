// ============================================================================
//  index.js - the very first file that runs in the browser
// ============================================================================
//  When someone opens the site, this is literally the starting point of the
//  whole React app. It finds the empty <div id="root"></div> that lives in
//  public/index.html, and replaces it with the full <App /> component tree.
//  Everything else you see in the browser flows from this one file.
// ============================================================================

import React from 'react';
import ReactDOM from 'react-dom/client';

// The stylesheet with all the global CSS for the app.
import './index.css';

// The main component, which contains every screen and route.
import App from './App';

// A little utility for measuring performance (page load speed etc). Optional.
import reportWebVitals from './reportWebVitals';

// Find the empty div in index.html that React will take over.
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the app inside it. <React.StrictMode> is a dev-only helper that
// runs some extra checks to catch bugs early. It has no effect in production.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Start measuring web performance. Passing no function means the numbers
// just get discarded. If I wanted to log them I'd pass `console.log` here,
// or send them to an analytics service. See https://bit.ly/CRA-vitals.
reportWebVitals();
