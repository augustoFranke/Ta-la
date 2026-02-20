/**
 * Chat service — Spec 007
 *
 * Provides:
 * - fetchChatMatches: enriched match list with partner info + last message
 * - fetchMessages: ordered message history for a match
 * - sendMessage: idempotent text/photo/voice send with optimistic ID
 * - unmatch: permanently removes match + chat for both users
 * - fetchMatchedProfile: profile data for matched partner (restricted access)
 */

import { supabase } from './supabase';
import type { ChatMatch, Message, MessageType } from '../types/database';

/** Max photo upload size (bytes) — Spec 007 §4 */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

// ---------------------------------------------------------------------------
// Match list
// ---------------------------------------------------------------------------

/**
 * Returns all active chat matches for the given user, ordered by most
 * recently active. Includes partner info and last message preview.
 */
export async function fetchChatMatches(userId: string): Promise<ChatMatch[]> {
  const { data, error } = await supabase.rpc('get_chat_matches', {
    p_user_id: userId,
  });

  if (error) throw error;
  return (data ?? []) as ChatMatch[];
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

/**
 * Fetches all messages for a match, ordered oldest → newest.
 * Only users who are part of the match can read messages.
 */
export async function fetchMessages(matchId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, match_id, sender_id, content, type, status, created_at')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Message[];
}

/**
 * Sends a message. Uses client-generated `clientId` for idempotency so that
 * retries do not create duplicates (Spec 007 §4 "no duplicate messages on retry").
 *
 * @param matchId   - The match (chat room) ID.
 * @param senderId  - The current user's ID.
 * @param content   - Text body or media URL.
 * @param type      - 'text' | 'photo' | 'voice'.
 * @param clientId  - Client-generated UUID for deduplication.
 */
export async function sendMessage(
  matchId: string,
  senderId: string,
  content: string,
  type: MessageType,
  clientId: string,
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .upsert(
      {
        id: clientId,
        match_id: matchId,
        sender_id: senderId,
        content,
        type,
        status: 'sent',
        created_at: new Date().toISOString(),
      },
      { onConflict: 'id', ignoreDuplicates: true },
    )
    .select('id, match_id, sender_id, content, type, status, created_at')
    .single();

  if (error) throw error;
  return data as Message;
}

// ---------------------------------------------------------------------------
// Unmatch
// ---------------------------------------------------------------------------

/**
 * Permanently removes the match and all associated messages for both users.
 * After this call, neither user can message the other or view the chat (Spec 007 §4).
 */
export async function unmatch(matchId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('unmatch', {
    p_match_id: matchId,
    p_user_id: userId,
  });

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Matched profile (restricted — Spec 007 §4)
// ---------------------------------------------------------------------------

export interface MatchedProfile {
  id: string;
  name: string;
  bio: string | null;
  occupation: string | null;
  photos: string[];
}

/**
 * Fetches the partner's profile for display inside the chat.
 * Access is restricted: only matched users can view each other's profile here.
 */
export async function fetchMatchedProfile(
  partnerId: string,
  viewerId: string,
): Promise<MatchedProfile | null> {
  // Verify the viewer is actually matched with the partner
  const { data: matchData, error: matchError } = await supabase
    .from('connections')
    .select('id')
    .or(
      `and(user1_id.eq.${viewerId},user2_id.eq.${partnerId}),` +
      `and(user1_id.eq.${partnerId},user2_id.eq.${viewerId})`,
    )
    .eq('confirmed', true)
    .maybeSingle();

  if (matchError) throw matchError;
  if (!matchData) return null; // not matched → no access

  const { data: profileData, error: profileError } = await supabase
    .from('users')
    .select('id, name, bio, occupation')
    .eq('id', partnerId)
    .single();

  if (profileError) throw profileError;

  const { data: photoData } = await supabase
    .from('photos')
    .select('url')
    .eq('user_id', partnerId)
    .order('order', { ascending: true })
    .limit(3);

  return {
    ...(profileData as Omit<MatchedProfile, 'photos'>),
    photos: (photoData ?? []).map((p: { url: string }) => p.url),
  };
}

// ---------------------------------------------------------------------------
// Photo upload helper
// ---------------------------------------------------------------------------

/**
 * Uploads a photo for a chat message.
 * Throws with a user-friendly message if the file exceeds MAX_PHOTO_BYTES.
 */
export async function uploadChatPhoto(
  matchId: string,
  senderId: string,
  fileUri: string,
  bytes: number,
): Promise<string> {
  if (bytes > MAX_PHOTO_BYTES) {
    throw new Error('Foto muito grande. O limite é 5 MB.');
  }

  const fileName = `chat/${matchId}/${senderId}/${Date.now()}.jpg`;
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from('chat-photos')
    .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from('chat-photos').getPublicUrl(fileName);
  return data.publicUrl;
}
