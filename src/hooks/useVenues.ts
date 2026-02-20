/**
 * useVenues Hook
 * Fetches and manages nearby venues based on user location
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useVenueStore, isVenueCacheStale } from '../stores/venueStore';
import { useLocationStore } from '../stores/locationStore';
import { searchNearbyVenues, calculateDistance } from '../services/places';
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
    setCachedLocation,
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
    const currentCachedLocation = useVenueStore.getState().cachedLocation;

    // Check if cache is still valid (time + city-radius)
    if (!force && !isVenueCacheStale(currentLastFetched, currentCachedLocation, latitude, longitude) && currentVenueCount > 0) {
      return;
    }

    setLoading(true);
    setError(null);

    if (__DEV__) {
      console.warn(`[useVenues] Cache miss — calling Places API (force=${force}, lat=${latitude}, lng=${longitude})`);
    }

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
      setCachedLocation({ latitude, longitude });
    } catch (err) {
      console.error('Error in fetchVenues:', err);
      setError('Erro ao buscar venues próximos');
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, radius, setVenues, setLoading, setError, setLastFetched, setCachedLocation]);

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

  // Reset hasFetchedRef when venues are cleared (e.g. after dev override or location change)
  // This allows the auto-fetch effect to re-trigger with new coords
  useEffect(() => {
    if (lastFetched === null) {
      if (__DEV__ && hasFetchedRef.current) {
        console.warn('[useVenues] Cache cleared — fetch guard reset. Next coordinate update will trigger a Places API call.');
      }
      hasFetchedRef.current = false;
    }
  }, [lastFetched]);

  // Auto-fetch when location becomes available — debounced to prevent rapid GPS updates
  // from stacking API calls during the brief window when cache is cold
  useEffect(() => {
    if (!autoFetch || !latitude || !longitude || hasFetchedRef.current) return;

    const timer = setTimeout(() => {
      if (!hasFetchedRef.current) {
        hasFetchedRef.current = true;
        fetchVenues(false);
      }
    }, 1500); // 1.5s debounce — wait for GPS to settle before calling Places API

    return () => clearTimeout(timer);
  }, [autoFetch, latitude, longitude, fetchVenues]);

  // Recalcula distância de cada venue a partir da posição atual do usuário (client-side, Haversine)
  // Garante que a distância exibida sempre reflita a localização atual, não a do momento do fetch
  const venuesWithDistance = useMemo(() => {
    if (!latitude || !longitude) return venues;
    return venues.map((venue) => ({
      ...venue,
      distance: calculateDistance(latitude, longitude, venue.latitude, venue.longitude),
    }));
  }, [venues, latitude, longitude]);

  // Select a venue for check-in
  const selectVenue = useCallback((venue: typeof venues[0] | null) => {
    setSelectedVenue(venue);
  }, [setSelectedVenue]);

  return {
    // State
    venues: venuesWithDistance,
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
