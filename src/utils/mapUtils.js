/**
 * Map utility functions
 */

/**
 * Calculate bearing (direction in degrees 0-360) between two lat/lng points
 * @param {number} fromLat - Starting latitude
 * @param {number} fromLng - Starting longitude
 * @param {number} toLat - Ending latitude
 * @param {number} toLng - Ending longitude
 * @returns {number} Bearing in degrees (0-360)
 */
export function computeBearing(fromLat, fromLng, toLat, toLng) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  
  const phi1 = toRad(fromLat);
  const phi2 = toRad(toLat);
  const dLambda = toRad(toLng - fromLng);
  
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.cos(phi2) * Math.cos(dLambda) - Math.sin(phi1) * Math.sin(phi2);
  
  let bearing = toDeg(Math.atan2(y, x));
  bearing = (bearing + 360) % 360;
  
  return bearing;
}

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} radians
 */
export function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 * @param {number} radians
 * @returns {number} degrees
 */
export function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

export default { computeBearing, toRadians, toDegrees };
