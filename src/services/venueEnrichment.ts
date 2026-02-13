/**
 * Venue Enrichment Service
 * Enriches venues with active check-in counts from Supabase
 */

import { supabase } from './supabase';

/**
 * Enrich venues with active user counts and open_to_meeting counts
 * Queries check_ins table for active check-ins within the last 4 hours
 */
export async function enrichWithActiveUserCounts<
  T extends {
    place_id: string;
    active_users_count: number;
  }
>(venues: T[]): Promise<(T & { open_to_meeting_count: number })[]> {
  if (venues.length === 0) return [];

  // Initialize default counts
  const countsByPlaceId = new Map<string, { activeCount: number; openToMeetingCount: number }>();
  venues.forEach((v) => {
    countsByPlaceId.set(v.place_id, { activeCount: 0, openToMeetingCount: 0 });
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
      return applyEnrichment(venues, countsByPlaceId);
    }

    const placeIdByVenueId = new Map<string, string>();
    const venueIds: string[] = [];

    venueRows?.forEach((row) => {
      if (!placeIdByVenueId.has(row.id)) {
        placeIdByVenueId.set(row.id, row.google_place_id);
        venueIds.push(row.id);
      }
    });

    if (venueIds.length === 0) {
      return applyEnrichment(venues, countsByPlaceId);
    }

    // Query active check-ins (within last 4 hours)
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
          const data = countsByPlaceId.get(placeId)!;
          data.activeCount += 1;
          if (checkIn.open_to_meeting) {
            data.openToMeetingCount += 1;
          }
        }
      });
    }
  } catch (err) {
    console.error('Error enriching venues with counts:', err);
  }

  return applyEnrichment(venues, countsByPlaceId);
}

/**
 * Apply enrichment data to venues
 */
function applyEnrichment<
  T extends {
    place_id: string;
    active_users_count: number;
  }
>(
  venues: T[],
  countsByPlaceId: Map<string, { activeCount: number; openToMeetingCount: number }>
): (T & { open_to_meeting_count: number })[] {
  return venues.map((venue) => {
    const data = countsByPlaceId.get(venue.place_id) || {
      activeCount: 0,
      openToMeetingCount: 0,
    };

    return {
      ...venue,
      active_users_count: data.activeCount,
      open_to_meeting_count: data.openToMeetingCount,
    };
  });
}
