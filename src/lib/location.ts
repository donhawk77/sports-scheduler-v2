import { geohashForLocation, geohashQueryBounds, distanceBetween } from 'geofire-common';

/**
 * Calculates the geohash for a given latitude and longitude.
 */
export const getGeohash = (lat: number, lng: number): string => {
    return geohashForLocation([lat, lng]);
};

/**
 * Calculates the distance between two points in miles.
 */
export const calculateDistanceInMiles = (
    point1: [number, number],
    point2: [number, number]
): number => {
    // geofire-common returns km
    const distanceKm = distanceBetween(point1, point2);
    return distanceKm * 0.621371;
};

/**
 * Gets the geohash query bounds for a specific radius in miles.
 */
export const getGeohashRange = (
    center: [number, number],
    radiusInMiles: number
) => {
    const radiusInMeters = radiusInMiles * 1609.34;
    return geohashQueryBounds(center, radiusInMeters);
};

/**
 * Formats a distance for display.
 */
export const formatDistance = (miles: number): string => {
    if (miles < 1) return `${(miles * 5280).toFixed(0)} ft`;
    return `${miles.toFixed(1)} mi`;
};
