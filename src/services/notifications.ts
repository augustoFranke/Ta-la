/**
 * Notifications service — Spec 008
 *
 * Handles:
 * - In-app notification CRUD (fetch, mark read, mark all read)
 * - Push token registration / unregistration
 * - Push preference guard (no push failures surface to user when permission denied)
 */

import { supabase } from './supabase';
import type {
  NotificationPreferences,
  NotificationItem,
  NotificationEventType,
} from '../types/database';

// ---------------------------------------------------------------------------
// Notification preferences
// ---------------------------------------------------------------------------

/** Fetch notification preferences for a user. Returns null if no row exists. */
export async function fetchNotificationPreferences(
  userId: string,
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
  prefs: Partial<
    Pick<NotificationPreferences, 'social_drinks' | 'social_matches' | 'venue_offers'>
  >,
): Promise<void> {
  const { error } = await supabase
    .from('notification_preferences')
    .upsert(
      { user_id: userId, ...prefs, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// In-app notification items (Spec 008 §4)
// ---------------------------------------------------------------------------

/** Fetch all in-app notifications for a user, newest first. */
export async function fetchNotifications(userId: string): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, event_type, body, deep_link, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as NotificationItem[];
}

/** Mark a single notification as read. */
export async function markNotificationRead(notifId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notifId);
  if (error) throw error;
}

/** Mark all notifications for a user as read. */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Push token registration (Spec 008 §4 — idempotent, no user-visible errors)
// ---------------------------------------------------------------------------

/**
 * Registers a push token for this device.
 * Silently swallows errors so push issues never surface to the user (Spec 008 §4).
 */
export async function registerPushToken(userId: string, token: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        { user_id: userId, token, updated_at: new Date().toISOString() },
        { onConflict: 'token' },
      );
    if (error) throw error;
  } catch (err) {
    // Intentionally swallowed — push failures must not be user-visible (Spec 008 §4)
    console.warn('[push] Failed to register token:', err);
  }
}

/** Unregisters a push token (called on sign-out). Silently swallows errors. */
export async function unregisterPushToken(token: string): Promise<void> {
  try {
    const { error } = await supabase.from('push_tokens').delete().eq('token', token);
    if (error) throw error;
  } catch (err) {
    console.warn('[push] Failed to unregister token:', err);
  }
}

// ---------------------------------------------------------------------------
// Event-type helpers (Spec 008 §2)
// ---------------------------------------------------------------------------

/** pt-BR labels for each notification event type. */
export const NOTIFICATION_EVENT_LABELS: Record<NotificationEventType, string> = {
  mutual_like: 'Conexão mútua',
  offer_accepted: 'Convite aceito',
  offer_rejected: 'Convite recusado',
  like_received: 'Curtida recebida',
};

/**
 * Returns the deep-link route for a notification.
 * `relatedId` is the match_id (mutual_like, offer_*) or sender_id (like_received).
 */
export function buildDeepLink(
  eventType: NotificationEventType,
  relatedId: string,
): string {
  switch (eventType) {
    case 'mutual_like':
    case 'offer_accepted':
    case 'offer_rejected':
      return `/chat/${relatedId}`;
    case 'like_received':
      return `/user/${relatedId}`;
  }
}
