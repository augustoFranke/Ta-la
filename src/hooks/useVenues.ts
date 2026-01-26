/**
 * useVenues Hook
 * Fetches and manages nearby venues based on user location
 */

import { useCallback, useEffect, useRef } from 'react';
import { useVenueStore, isVenueCacheValid } from '../stores/venueStore';
import { useLocationStore } from '../stores/locationStore';
import { searchNearbyVenues, getVenueTypeScore } from '../services/places';
import { supabase } from '../services/supabase';
import { calculateDatingScore } from '../services/venueScoring';
import type { VibeType } from '../types/database';

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
  const fetchVenues = useCallback(async () => {
    if (!latitude || !longitude) {
      setError('Localização não disponível');
      return;
    }

    // Check if cache is still valid
    if (isVenueCacheValid(lastFetched) && venues.length > 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { venues: fetchedVenues, error: fetchError } = await searchNearbyVenues(
        latitude,
        longitude,
        radius
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
  }, [latitude, longitude, radius, lastFetched, venues.length, setVenues, setLoading, setError, setLastFetched]);

  // Force refresh (bypass cache)
  const refreshVenues = useCallback(async () => {
    if (!latitude || !longitude) {
      setError('Localização não disponível');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { venues: fetchedVenues, error: fetchError } = await searchNearbyVenues(
        latitude,
        longitude,
        radius
      );

      if (fetchError) {
        setError(fetchError);
        return;
      }

      const venuesWithCounts = await enrichWithActiveUserCounts(fetchedVenues);

      setVenues(venuesWithCounts);
      setLastFetched(new Date());
    } catch (err) {
      console.error('Error in refreshVenues:', err);
      setError('Erro ao atualizar venues');
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, radius, setVenues, setLoading, setError, setLastFetched]);

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
      fetchVenues();
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
    fetchVenues,
    refreshVenues,
    selectVenue,
    clearVenues,
    updateVenueActiveUsers,
  };
}

interface VenueEnrichmentData {
  activeCount: number;
  openToMeetingCount: number;
  topVibes: VibeType[];
  vibeCount: number;
}

/**
 * Enrich venues with active user counts, open_to_meeting counts, vibes, and dating scores
 * Queries check_ins and venue_vibes tables for dating-relevant data
 */
async function enrichWithActiveUserCounts<
  T extends {
    place_id: string;
    active_users_count: number;
    rating: number | null;
    price_level: number | null;
    distance: number;
  }
>(venues: T[]): Promise<(T & { open_to_meeting_count: number; top_vibes: VibeType[]; dating_score: number })[]> {
  if (venues.length === 0) return [];

  // Initialize default enrichment data
  const enrichmentByPlaceId = new Map<string, VenueEnrichmentData>();
  venues.forEach((v) => {
    enrichmentByPlaceId.set(v.place_id, {
      activeCount: 0,
      openToMeetingCount: 0,
      topVibes: [],
      vibeCount: 0,
    });
  });

  try {
    const placeIds = venues.map((v) => v.place_id);

    // Fetch venue IDs from Supabase
    const { data: venueRows, error: venueError } = await supabase
      .from('venues')
      .select('id, google_place_id')
      .in('google_place_id', placeIds);

    if (venueError) {
      console.error('Error fetching venue ids:', venueError);
      return applyEnrichmentAndScore(venues, enrichmentByPlaceId);
    }

    const venueIdByPlaceId = new Map<string, string>();
    const placeIdByVenueId = new Map<string, string>();
    const venueIds: string[] = [];

    venueRows?.forEach((row) => {
      if (!venueIdByPlaceId.has(row.google_place_id)) {
        venueIdByPlaceId.set(row.google_place_id, row.id);
        placeIdByVenueId.set(row.id, row.google_place_id);
        venueIds.push(row.id);
      }
    });

    if (venueIds.length === 0) {
      return applyEnrichmentAndScore(venues, enrichmentByPlaceId);
    }

    // Query active check-ins with open_to_meeting status (within last 4 hours)
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

    const { data: checkIns, error: checkInError } = await supabase
      .from('check_ins')
      .select('venue_id, open_to_meeting')
      .in('venue_id', venueIds)
      .eq('is_active', true)
      .is('checked_out_at', null)
      .gte('checked_in_at', fourHoursAgo);

    if (!checkInError && checkIns) {
      checkIns.forEach((checkIn) => {
        const placeId = placeIdByVenueId.get(checkIn.venue_id);
        if (placeId) {
          const data = enrichmentByPlaceId.get(placeId)!;
          data.activeCount += 1;
          if (checkIn.open_to_meeting) {
            data.openToMeetingCount += 1;
          }
        }
      });
    }

    // Query venue vibes and aggregate by venue
    const { data: vibes, error: vibeError } = await supabase
      .from('venue_vibes')
      .select('venue_id, vibe')
      .in('venue_id', venueIds);

    if (!vibeError && vibes) {
      // Count vibes per venue and track which vibes are most common
      const vibesByVenue = new Map<string, Map<string, number>>();

      vibes.forEach((v) => {
        if (!vibesByVenue.has(v.venue_id)) {
          vibesByVenue.set(v.venue_id, new Map());
        }
        const vibeMap = vibesByVenue.get(v.venue_id)!;
        vibeMap.set(v.vibe, (vibeMap.get(v.vibe) || 0) + 1);
      });

      // Get top 2 vibes for each venue
      vibesByVenue.forEach((vibeMap, venueId) => {
        const placeId = placeIdByVenueId.get(venueId);
        if (placeId) {
          const data = enrichmentByPlaceId.get(placeId)!;
          const sortedVibes = Array.from(vibeMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([vibe]) => vibe as VibeType);
          data.topVibes = sortedVibes;
          data.vibeCount = vibeMap.size;
        }
      });
    }
  } catch (err) {
    console.error('Error enriching venues with counts:', err);
  }

  return applyEnrichmentAndScore(venues, enrichmentByPlaceId);
}

/**
 * Apply enrichment data and calculate dating scores, then sort by score
 */
function applyEnrichmentAndScore<
  T extends {
    place_id: string;
    active_users_count: number;
    rating: number | null;
    price_level: number | null;
    distance: number;
  }
>(
  venues: T[],
  enrichmentByPlaceId: Map<string, VenueEnrichmentData>
): (T & { open_to_meeting_count: number; top_vibes: VibeType[]; dating_score: number })[] {
  const enrichedVenues = venues.map((venue) => {
    const data = enrichmentByPlaceId.get(venue.place_id) || {
      activeCount: 0,
      openToMeetingCount: 0,
      topVibes: [],
      vibeCount: 0,
    };

    // Get venue types for scoring (use type field as fallback)
    const types = (venue as any).types || [(venue as any).type || 'bar'];

    const datingScore = calculateDatingScore({
      types,
      name: (venue as any).name || '',
      rating: venue.rating,
      priceLevel: venue.price_level,
      distance: venue.distance,
      openToMeetingCount: data.openToMeetingCount,
      positiveVibeCount: data.vibeCount,
    });

    return {
      ...venue,
      active_users_count: data.activeCount,
      open_to_meeting_count: data.openToMeetingCount,
      top_vibes: data.topVibes,
      dating_score: datingScore,
    };
  });

  // Sort by dating score (highest first)
  enrichedVenues.sort((a, b) => b.dating_score - a.dating_score);

  return enrichedVenues;
}
