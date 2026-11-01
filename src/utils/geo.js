/**
 * Geolocation & Route Calculation Utilities
 */

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Calculates Haversine distance between two coordinates in kilometers
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Filters out GPS noise: returns true if coordinate displacement is reliable
 */
export function isReliableGpsPoint(prevPoint, newPoint, minDistanceMeters = 2, maxSpeedKmh = 45) {
  if (!prevPoint) return true;

  // Check accuracy: reject points with poor accuracy (> 35 meters)
  if (newPoint.accuracy && newPoint.accuracy > 35) {
    return false;
  }

  const distKm = calculateHaversineDistance(
    prevPoint.latitude,
    prevPoint.longitude,
    newPoint.latitude,
    newPoint.longitude
  );
  const distMeters = distKm * 1000;

  // Ignore stationary GPS jitter
  if (distMeters < minDistanceMeters) {
    return false;
  }

  // Calculate speed between points to reject GPS teleports
  const timeDiffHours = (newPoint.timestamp - prevPoint.timestamp) / 3600000;
  if (timeDiffHours > 0) {
    const speedKmh = distKm / timeDiffHours;
    if (speedKmh > maxSpeedKmh) {
      return false;
    }
  }

  return true;
}

/**
 * Calculates pace in seconds per kilometer, formatted as "mm'ss\"/km"
 */
export function formatPace(totalSeconds, distanceKm) {
  if (!distanceKm || distanceKm <= 0.05 || totalSeconds <= 0) {
    return "--'--\"/km";
  }
  const paceSecondsPerKm = totalSeconds / distanceKm;
  if (paceSecondsPerKm > 3600) {
    return "> 60'00\"/km";
  }
  const minutes = Math.floor(paceSecondsPerKm / 60);
  const seconds = Math.floor(paceSecondsPerKm % 60);
  return `${minutes.toString().padStart(2, '0')}'${seconds.toString().padStart(2, '0')}"/km`;
}

/**
 * Calculates average speed in km/h
 */
export function calculateSpeedKmh(distanceKm, totalSeconds) {
  if (!distanceKm || totalSeconds <= 0) return 0;
  const hours = totalSeconds / 3600;
  return Number((distanceKm / hours).toFixed(1));
}

/**
 * Calculates calories burned based on steps, distance, duration, and user weight (kg)
 * Standard MET for brisk walking is ~3.8 - 4.5
 */
export function calculateWalkingCalories(distanceKm, steps, totalSeconds, userWeightKg = 70) {
  if (distanceKm > 0.05) {
    // Distance-based calculation (~0.75 kcal per kg per km)
    const kcal = distanceKm * userWeightKg * 0.75;
    return Math.round(kcal);
  }
  // Fallback to step-based calculation
  return Math.round(steps * 0.04);
}

/**
 * Formats duration in seconds to "HH:MM:SS" or "MM:SS"
 */
export function formatStopwatchTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');

  if (hours > 0) {
    const hh = hours.toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}
