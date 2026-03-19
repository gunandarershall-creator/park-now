/**
 * MODEL: geoModel.js
 * Geospatial utility functions for proximity-based spot discovery.
 *
 * Implements the Haversine formula to calculate great-circle distances
 * between two GPS coordinates on a spherical Earth model.
 *
 * This forms the spatial dimension of the spatio-temporal query architecture
 * described in the FYP design chapter (Section 3.9.2).
 *
 * Reference: Sinnott (1984) — "Virtues of the Haversine", Sky and Telescope.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine Formula
 * Calculates the great-circle distance between two lat/lng points.
 * Accurate to ~0.3% for distances up to several hundred kilometres.
 *
 * @param {number} lat1 - Driver latitude  (decimal degrees)
 * @param {number} lng1 - Driver longitude (decimal degrees)
 * @param {number} lat2 - Spot latitude    (decimal degrees)
 * @param {number} lng2 - Spot longitude   (decimal degrees)
 * @returns {number} Distance in kilometres
 */
export const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat  = toRad(lat2 - lat1);
  const dLng  = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Formats a raw kilometre value into a human-readable distance string.
 *   < 1 km  →  "350 m away"
 *   >= 1 km →  "1.2 km away"
 *
 * @param {number} km
 * @returns {string}
 */
export const formatDistance = (km) => {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
};

/**
 * Spatio-Temporal Proximity Sort
 * Enriches each spot with a real calculated distance from the driver's position,
 * then sorts them nearest-first.
 *
 * The `distance` string field is overwritten so the UI always shows live data.
 * A `distanceKm` number field is attached for internal sorting / filtering logic.
 *
 * @param {Array}  spots          - Spot objects with { lat, lng, ...rest }
 * @param {{ lat: number, lng: number }} driverLocation
 * @returns {Array} Sorted spots with `distance` and `distanceKm` populated
 */
export const sortSpotsByProximity = (spots, driverLocation) => {
  const enriched = spots.map((spot) => {
    const km = haversineDistance(driverLocation.lat, driverLocation.lng, spot.lat, spot.lng);
    return { ...spot, distanceKm: km, distance: formatDistance(km) };
  });
  return enriched.sort((a, b) => a.distanceKm - b.distanceKm);
};
