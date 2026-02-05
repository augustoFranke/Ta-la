/**
 * Venue Flags Service
 * Handles user flagging of venues for community curation
 */

import { supabase } from './supabase';
import type { VenueFlag, VenueFlagType } from '../types/database';

/**
 * Flag a venue as not fitting the nightlife context
 * @param placeId - Google Place ID
 * @param userId - User's auth ID
 * @param flagType - Type of flag
 * @param note - Optional note from user
 */
export async function flagVenue(
  placeId: string,
  userId: string,
  flagType: VenueFlagType,
  note?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.from('venue_flags').insert({
      place_id: placeId,
      user_id: userId,
      flag_type: flagType,
      note: note || null,
    });

    if (error) {
      // Handle unique constraint violation (already flagged)
      if (error.code === '23505') {
        return {
          success: false,
          error: 'Voce ja reportou este local',
        };
      }

      console.error('Error flagging venue:', error);
      return {
        success: false,
        error: 'Erro ao reportar local. Tente novamente.',
      };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error flagging venue:', err);
    return {
      success: false,
      error: 'Erro ao reportar local. Tente novamente.',
    };
  }
}

/**
 * Remove a flag from a venue (user changed their mind)
 */
export async function unflagVenue(
  placeId: string,
  userId: string,
  flagType: VenueFlagType
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('venue_flags')
      .delete()
      .eq('place_id', placeId)
      .eq('user_id', userId)
      .eq('flag_type', flagType);

    if (error) {
      console.error('Error removing venue flag:', error);
      return {
        success: false,
        error: 'Erro ao remover reporte. Tente novamente.',
      };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error removing venue flag:', err);
    return {
      success: false,
      error: 'Erro ao remover reporte. Tente novamente.',
    };
  }
}

/**
 * Check if user has already flagged a venue with a specific flag type
 */
export async function hasUserFlagged(
  placeId: string,
  userId: string,
  flagType: VenueFlagType
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('venue_flags')
      .select('id')
      .eq('place_id', placeId)
      .eq('user_id', userId)
      .eq('flag_type', flagType)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found, which is expected
      console.error('Error checking venue flag:', error);
    }

    return !!data;
  } catch {
    return false;
  }
}

/**
 * Get all flags submitted by a user
 */
export async function getUserVenueFlags(userId: string): Promise<VenueFlag[]> {
  try {
    const { data, error } = await supabase
      .from('venue_flags')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user venue flags:', error);
      return [];
    }

    return (data || []) as VenueFlag[];
  } catch {
    return [];
  }
}

/**
 * Get all flags for a specific venue (for admin/debugging)
 */
export async function getVenueFlags(placeId: string): Promise<VenueFlag[]> {
  try {
    const { data, error } = await supabase
      .from('venue_flags')
      .select('*')
      .eq('place_id', placeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching venue flags:', error);
      return [];
    }

    return (data || []) as VenueFlag[];
  } catch {
    return [];
  }
}

/**
 * Get flag count for a venue by type
 */
export async function getVenueFlagCounts(
  placeId: string
): Promise<Record<VenueFlagType, number>> {
  const counts: Record<VenueFlagType, number> = {
    not_nightlife: 0,
    closed: 0,
    wrong_category: 0,
  };

  try {
    const { data, error } = await supabase
      .from('venue_flags')
      .select('flag_type')
      .eq('place_id', placeId);

    if (error) {
      console.error('Error fetching venue flag counts:', error);
      return counts;
    }

    for (const flag of data || []) {
      const type = flag.flag_type as VenueFlagType;
      if (type in counts) {
        counts[type]++;
      }
    }

    return counts;
  } catch {
    return counts;
  }
}
