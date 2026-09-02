// Geo utilities for distance, route generation, and ETA math

// Haversine distance formula in kilometers
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

// Generate realistic polyline waypoints between start and end
export function generateRouteWaypoints(startLat, startLng, endLat, endLng, steps = 15) {
  const waypoints = [];
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    // Add slight jitter to simulate real road curve
    const jitterLat = i === 0 || i === steps ? 0 : (Math.sin(i) * 0.0015);
    const jitterLng = i === 0 || i === steps ? 0 : (Math.cos(i) * 0.0015);
    
    const lat = startLat + (endLat - startLat) * ratio + jitterLat;
    const lng = startLng + (endLng - startLng) * ratio + jitterLng;
    waypoints.push([lat, lng]);
  }
  return waypoints;
}

// Calculate ETA in minutes based on distance and average ambulance speed (45 km/h emergency speed)
export function calculateETA(distanceKm, speedKmh = 45) {
  if (distanceKm <= 0) return 0;
  const hours = distanceKm / speedKmh;
  const minutes = Math.ceil(hours * 60);
  return Math.max(1, minutes);
}
