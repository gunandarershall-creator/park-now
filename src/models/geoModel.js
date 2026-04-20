// ============================================================================
//  MODEL: geoModel.js - distance maths for "find me the nearest spot"
// ============================================================================
//  The Earth is roughly a sphere. If you want to measure the actual
//  walking distance between two GPS coordinates you can't just do simple
//  subtraction, because longitude lines squeeze together as you move
//  towards the poles and latitude lines are already curved.
//
//  The classic solution is the Haversine formula, which gives the
//  "great-circle distance" - the shortest distance over the surface of
//  a sphere. It's accurate to about 0.3% for distances up to a few
//  hundred kilometres, which is massively more precision than a parking
//  app needs.
//
//  Reference: Sinnott (1984), "Virtues of the Haversine", Sky and Telescope.
// ============================================================================

// Earth's radius in km. (Could use the exact 6371.0088 but 6371 is
// well within Haversine's accuracy anyway.)
const EARTH_RADIUS_KM = 6371;

// ─── Haversine formula ──────────────────────────────────────────────────────
// Inputs are decimal degrees (like -0.1276 for Westminster). Output is
// kilometres. The maths is standard textbook stuff so I won't explain
// each term, just know that it converts degrees to radians, plugs into
// the spherical-trig identity, and returns the arc length.
export const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat  = toRad(lat2 - lat1);
  const dLng  = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Pretty-print a distance ────────────────────────────────────────────────
// Turns a raw number of km into something humans actually read:
//   0.35  km  ->  "350 m away"
//   1.21  km  ->  "1.2 km away"
export const formatDistance = (km) => {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
};

// ─── Sort a list of spots by distance from the driver ──────────────────────
// For each spot: compute the real km distance, stash it in distanceKm
// (number for sorting) and distance (formatted string for the UI).
// Then sort nearest-first. The original distance field, if it existed,
// gets overwritten so stale values can't sneak through.
export const sortSpotsByProximity = (spots, driverLocation) => {
  const enriched = spots.map((spot) => {
    const km = haversineDistance(driverLocation.lat, driverLocation.lng, spot.lat, spot.lng);
    return { ...spot, distanceKm: km, distance: formatDistance(km) };
  });
  return enriched.sort((a, b) => a.distanceKm - b.distanceKm);
};
