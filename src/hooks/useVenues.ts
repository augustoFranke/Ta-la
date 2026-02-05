/**
 * useVenues Hook
 * Fetches and manages nearby venues based on user location
 */

import { useCallback, useEffect, useRef } from 'react';
import { useVenueStore, isVenueCacheValid } from '../stores/venueStore';
import { useLocationStore } from '../stores/locationStore';
import { searchNearbyVenues } from '../services/places';
import { enrichWithActiveUserCounts } from '../services/venueEnrichment';

interface UseVenuesOptions {
  radius?: number; // Search radius in meters
  autoFetch?: boolean; // Auto-fetch when location available
}

export function useVenues(options: UseVenuesOptions = {}) {
  const { radius = 2000, autoFetch = true } = options;

  const {
    venues,
    isLoading,
    error,
    lastFetched,
    selectedVenue,
    setVenues,
    setLoading,
    setError,
    setLastFetched,
    setSelectedVenue,
    clearVenues,
    updateVenueActiveUsers,
  } = useVenueStore();

  const { latitude, longitude, permissionGranted } = useLocationStore();

  // Fetch venues from Google Places
  const fetchVenues = useCallback(async (force: boolean = false) => {
    if (!latitude || !longitude) {
      setError('Localização não disponível');
      return;
    }

    // Check if cache is still valid
    if (!force && isVenueCacheValid(lastFetched) && venues.length > 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { venues: fetchedVenues, error: fetchError } = await searchNearbyVenues(
        latitude,
        longitude,
        radius,
        { openNowOnly: true }
      );

      if (fetchError) {
        setError(fetchError);
        return;
      }

      // Optionally fetch active user counts from Supabase
      const venuesWithCounts = await enrichWithActiveUserCounts(fetchedVenues);

      setVenues(venuesWithCounts);
      setLastFetched(new Date());
    } catch (err) {
      console.error('Error in fetchVenues:', err);
      setError('Erro ao buscar venues próximos');
    } finally {
      setLoading(false);
    }
  }, [
    latitude,
    longitude,
    radius,
    lastFetched,
    venues.length,
    setVenues,
    setLoading,
    setError,
    setLastFetched,
  ]);

  // Force refresh (bypass cache)
  const refreshVenues = useCallback(() => {
    return fetchVenues(true);
  }, [fetchVenues]);

  // Track previous permission state to detect changes
  const prevPermissionRef = useRef<boolean | null>(null);

  // Clear venues when permission is revoked
  useEffect(() => {
    if (prevPermissionRef.current === true && !permissionGranted) {
      clearVenues();
    }
    prevPermissionRef.current = permissionGranted;
  }, [permissionGranted, clearVenues]);

  // Auto-fetch when location becomes available
  useEffect(() => {
    if (autoFetch && latitude && longitude && !isLoading && venues.length === 0) {
      fetchVenues(false);
    }
  }, [autoFetch, latitude, longitude, isLoading, venues.length, fetchVenues]);

  // Select a venue for check-in
  const selectVenue = useCallback((venue: typeof venues[0] | null) => {
    setSelectedVenue(venue);
  }, [setSelectedVenue]);

  return {
    // State
    venues,
    isLoading,
    error,
    lastFetched,
    selectedVenue,
    hasLocation: latitude !== null && longitude !== null,
    locationPermissionGranted: permissionGranted,

    // Actions
    fetchVenues: () => fetchVenues(false),
    refreshVenues,
    selectVenue,
    clearVenues,
    updateVenueActiveUsers,
  };
}
