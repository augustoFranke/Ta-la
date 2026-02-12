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

  // Fetch venues from Radar Places
  const fetchVenues = useCallback(async (force: boolean = false) => {
    if (!latitude || !longitude) {
      setError('Localização não disponível');
      return;
    }

    // Read cache state directly from store to avoid stale closure issues
    const currentLastFetched = useVenueStore.getState().lastFetched;
    const currentVenueCount = useVenueStore.getState().venues.length;

    // Check if cache is still valid
    if (!force && isVenueCacheValid(currentLastFetched) && currentVenueCount > 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { venues: fetchedVenues, error: fetchError } = await searchNearbyVenues(
        latitude,
        longitude,
        radius,
        { openNowOnly: false }
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
  }, [latitude, longitude, radius, setVenues, setLoading, setError, setLastFetched]);

  // Force refresh (bypass cache)
  const refreshVenues = useCallback(() => {
    return fetchVenues(true);
  }, [fetchVenues]);

  // Track whether initial fetch has been done — guards against re-fetch loops
  const hasFetchedRef = useRef(false);

  // Track previous permission state to detect changes
  const prevPermissionRef = useRef<boolean | null>(null);

  // Clear venues when permission is revoked
  useEffect(() => {
    if (prevPermissionRef.current === true && !permissionGranted) {
      clearVenues();
      hasFetchedRef.current = false;
    }
    prevPermissionRef.current = permissionGranted;
  }, [permissionGranted, clearVenues]);

  // Auto-fetch when location becomes available — runs exactly once per mount cycle
  useEffect(() => {
    if (autoFetch && latitude && longitude && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchVenues(false);
    }
  }, [autoFetch, latitude, longitude]);

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
