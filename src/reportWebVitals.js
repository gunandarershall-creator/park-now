// ============================================================================
//  reportWebVitals.js - measures how fast the app feels to users
// ============================================================================
//  Google publishes a set of "Core Web Vitals" metrics that capture real
//  user experience: how long it takes for the first paint, how much stuff
//  shifts around while loading, how quickly the page responds to clicks.
//  This file wires those measurements up.
//
//  It only does anything if you pass in a callback function, otherwise it
//  just exits. In my index.js I call reportWebVitals() with no argument,
//  so these measurements are silently discarded. Easy to flip on later
//  by passing console.log or an analytics endpoint.
// ============================================================================

const reportWebVitals = onPerfEntry => {
  // Only proceed if the caller actually gave me a function to call back with.
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Lazy-load the web-vitals library only when needed so it doesn't
    // bloat the initial page bundle. Then register all five metrics.
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);   // Cumulative Layout Shift (visual stability)
      getFID(onPerfEntry);   // First Input Delay (responsiveness)
      getFCP(onPerfEntry);   // First Contentful Paint (render speed)
      getLCP(onPerfEntry);   // Largest Contentful Paint (main content speed)
      getTTFB(onPerfEntry);  // Time to First Byte (server response)
    });
  }
};

export default reportWebVitals;
