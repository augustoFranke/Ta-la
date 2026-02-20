/**
 * useVenues Hook
 * Fetches and manages nearby venues based on user location.
 * Implements automatic radius expansion (2km → 5km → 10km → 20km) when no venues found.
 *
 * Also exports useTrending — fetches top 5 venues by check-in count in the last 7 days.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVenueStore, isVenueCacheStale } from '../stores/venueStore';
import { useLocationStore } from '../stores/locationStore';
import { searchNearbyVenues, calculateDistance } from '../services/places';
import { enrichWithActiveUserCounts } from '../services/venueEnrichment';
import { supabase } from '../services/supabase';

// Trending item returned by useTrending
export interface TrendingVenue {
  venue_id: string;
  place_id: string | null;
  name: string;
  photo_url: string | null;
  total_checkins: number;
  /** Average check-ins per day over last 7 days (rounded to nearest integer) */
  per_day: number;
  rank: number;
}

const TRENDING_DAYS = 7;
const TRENDING_TOP_N = 5;

// Radius expansion steps in meters (spec 004: start 2km, expand through configured steps)
export const RADIUS_EXPANSION_STEPS = [2000, 5000, 10000, 20000];

interface UseVenuesOptions {
  radius?: number; // Initial search radius in meters (default: 2000)
  autoFetch?: boolean; // Auto-fetch when location available
}

export function useVenues(options: UseVenuesOptions = {}) {
  const { radius = RADIUS_EXPANSION_STEPS[0], autoFetch = true } = options;

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

  /**
   * Fetch venues with automatic radius expansion.
   * Starts at the configured initial radius, and expands through RADIUS_EXPANSION_STEPS
   * until at least one venue is found or the maximum radius is exhausted.
   */
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
      console.warn(`[useVenues] Cache miss — calling Places API with radius expansion (force=${force}, lat=${latitude}, lng=${longitude})`);
    }

    try {
      // Determine the starting step index from the configured initial radius
      const startStepIndex = RADIUS_EXPANSION_STEPS.indexOf(radius);
      const steps = startStepIndex >= 0
        ? RADIUS_EXPANSION_STEPS.slice(startStepIndex)
        : [radius, ...RADIUS_EXPANSION_STEPS.filter(r => r > radius)];

      let fetchedVenues: Awaited<ReturnType<typeof searchNearbyVenues>>['venues'] = [];
      let fetchError: string | null = null;

      for (const stepRadius of steps) {
        if (__DEV__) {
          console.warn(`[useVenues] Trying radius ${stepRadius}m`);
        }

        const result = await searchNearbyVenues(
          latitude,
          longitude,
          stepRadius,
          { openNowOnly: false }
        );

        if (result.error) {
          fetchError = result.error;
          break;
        }

        if (result.venues.length > 0) {
          fetchedVenues = result.venues;
          break; // Found venues — stop expanding
        }

        // No venues at this radius, expand to next step
        if (__DEV__) {
          console.warn(`[useVenues] No venues at ${stepRadius}m, expanding radius...`);
        }
      }

      if (fetchError) {
        setError(fetchError);
        return;
      }

      // Enrich with active user counts from Supabase
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

  // Recalculates distance for each venue from the user's current position (client-side, Haversine).
  // Ensures distance always reflects the current location, not the time of fetch.
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

// ---------------------------------------------------------------------------
// useTrending — top 5 venues by check-in count in last 7 days (Spec 004)
// ---------------------------------------------------------------------------

/**
 * Fetches trending venues: top N by check-in count over the last 7 days.
 * Returns empty array if no venues have check-ins in that window.
 */
export function useTrending() {
  const [trending, setTrending] = useState<TrendingVenue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const since = new Date(Date.now() - TRENDING_DAYS * 24 * 60 * 60 * 1000).toISOString();

      // Aggregate check-ins by venue in the last 7 days
      const { data, error: queryError } = await supabase
        .from('check_ins')
        .select('venue_id')
        .eq('is_active', false) // completed check-ins only
        .gte('checked_in_at', since);

      if (queryError) throw queryError;

      if (!data || data.length === 0) {
        setTrending([]);
        return;
      }

      // Count check-ins per venue
      const counts: Record<string, number> = {};
      for (const row of data) {
        if (row.venue_id) {
          counts[row.venue_id] = (counts[row.venue_id] ?? 0) + 1;
        }
      }

      // Sort descending, take top N
      const sorted = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, TRENDING_TOP_N);

      if (sorted.length === 0) {
        setTrending([]);
        return;
      }

      // Fetch venue details
      const venueIds = sorted.map(([id]) => id);
      const { data: venuesData } = await supabase
        .from('venues')
        .select('id, place_id, name, photo_url')
        .in('id', venueIds);

      const venueMap: Record<string, { place_id: string | null; name: string; photo_url: string | null }> = {};
      for (const v of venuesData ?? []) {
        venueMap[v.id] = { place_id: v.place_id ?? null, name: v.name, photo_url: v.photo_url ?? null };
      }

      const result: TrendingVenue[] = sorted.map(([venueId, total], index) => ({
        venue_id: venueId,
        place_id: venueMap[venueId]?.place_id ?? null,
        name: venueMap[venueId]?.name ?? 'Local desconhecido',
        photo_url: venueMap[venueId]?.photo_url ?? null,
        total_checkins: total,
        per_day: Math.round(total / TRENDING_DAYS),
        rank: index + 1,
      }));

      setTrending(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar trending';
      setError(message);
      setTrending([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { trending, isLoading, error, refresh: fetch };
}
