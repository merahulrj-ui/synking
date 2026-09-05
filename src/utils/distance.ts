/**
 * Proximity and Distance Calculation Utilities for SYNKING
 * Complies with dating privacy standards (Tinder/Bumble):
 * Shows distance like "Less than 1 km away" or "2 km away" without revealing city or neighborhood coordinates.
 */

// Default Fallback Coordinates (Roorkee, UK - App Founding Origin)
export const DEFAULT_COORDINATES: [number, number] = [29.8644, 77.8881];

/**
 * Extracts [latitude, longitude] from any user location representation.
 */
export function getCoordinates(location: any): [number, number] | null {
  if (!location) return null;

  // 1. Direct object format { coordinates: [lat, lon] }
  if (typeof location === 'object') {
    if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
      const lat = Number(location.coordinates[0]);
      const lon = Number(location.coordinates[1]);
      if (!isNaN(lat) && !isNaN(lon) && (lat !== 0 || lon !== 0)) {
        return [lat, lon];
      }
    }
    if (location.latitude !== undefined && location.longitude !== undefined) {
      const lat = Number(location.latitude);
      const lon = Number(location.longitude);
      if (!isNaN(lat) && !isNaN(lon)) return [lat, lon];
    }
    if (location.lat !== undefined && location.lon !== undefined) {
      const lat = Number(location.lat);
      const lon = Number(location.lon);
      if (!isNaN(lat) && !isNaN(lon)) return [lat, lon];
    }
  }

  // 2. String representation that might be JSON
  if (typeof location === 'string' && (location.startsWith('{') || location.startsWith('['))) {
    try {
      const parsed = JSON.parse(location);
      return getCoordinates(parsed);
    } catch (e) {}
  }

  return null;
}

/**
 * Generate a deterministic offset coordinate based on profile ID
 * so every user without GPS gets a realistic, stable distance (1 - 10 km)
 */
export function getFallbackCoordinates(seedId: string = 'user', userCoords?: [number, number] | number[] | null): [number, number] {
  const baseLat = (userCoords && userCoords.length >= 2) ? userCoords[0] : DEFAULT_COORDINATES[0];
  const baseLon = (userCoords && userCoords.length >= 2) ? userCoords[1] : DEFAULT_COORDINATES[1];

  let hash = 0;
  for (let i = 0; i < seedId.length; i++) {
    hash = (hash << 5) - hash + seedId.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  // Deterministic distance between 0.8 km and 8.5 km
  const distKm = 0.8 + (positiveHash % 77) / 10;
  // Deterministic angle between 0 and 2*PI
  const angle = ((positiveHash % 360) * Math.PI) / 180;

  // Approximate offset in degrees
  const latOffset = (distKm * Math.cos(angle)) / 110.574;
  const lonOffset = (distKm * Math.sin(angle)) / (111.320 * Math.cos((baseLat * Math.PI) / 180));

  return [baseLat + latOffset, baseLon + lonOffset];
}

/**
 * Great-Circle Distance using the Haversine formula (Earth radius = 6371 km).
 */
export function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance in standard dating app format:
 * - "< 1 km" -> "Less than 1 km away"
 * - ">= 1 km" -> "X km away"
 */
export function formatDistanceString(km: number | null | undefined): string {
  if (km === null || km === undefined || isNaN(km)) return 'Nearby';
  if (km < 1) {
    return 'Less than 1 km away';
  }
  const rounded = Math.round(km);
  return `${rounded} km away`;
}

/**
 * Calculates distance in km and user-friendly distance string for a profile.
 */
export function calculateProfileDistance(
  profileLocation: any,
  userCoords?: [number, number] | number[] | null,
  profileId?: string
): { distanceKm: number; distanceLabel: string } {
  const baseLat = (userCoords && userCoords.length >= 2) ? userCoords[0] : DEFAULT_COORDINATES[0];
  const baseLon = (userCoords && userCoords.length >= 2) ? userCoords[1] : DEFAULT_COORDINATES[1];
  const baseCoords: [number, number] = [baseLat, baseLon];

  const targetCoords = getCoordinates(profileLocation) || getFallbackCoordinates(profileId || 'user', baseCoords);

  const km = calculateHaversineKm(baseCoords[0], baseCoords[1], targetCoords[0], targetCoords[1]);
  return {
    distanceKm: km,
    distanceLabel: formatDistanceString(km),
  };
}
