import { supabase } from './supabase';
import type { NotificationPreferences } from '../types/database';

/** Fetch notification preferences for a user. Returns null if no row exists. */
export async function fetchNotificationPreferences(
  userId: string
): Promise<NotificationPreferences | null> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Upsert notification preferences. Creates row if missing, updates if exists. */
export async function upsertNotificationPreferences(
  userId: string,
  prefs: Partial<Pick<NotificationPreferences, 'social_drinks' | 'social_matches' | 'venue_offers'>>
): Promise<void> {
  const { error } = await supabase
    .from('notification_preferences')
    .upsert(
      { user_id: userId, ...prefs, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  if (error) throw error;
}
