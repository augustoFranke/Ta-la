import { supabase } from './supabase';
import type { ReportReason } from '../types/database';

/** Block a user. RLS enforces blocker_id = auth.uid(). */
export async function blockUser(blockerId: string, blockedId: string) {
  const { error } = await supabase
    .from('blocks')
    .insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error) throw error;
}

/** Submit a report. UNIQUE(reporter_id, reported_id) prevents duplicates. */
export async function reportUser(params: {
  reporterId: string;
  reportedId: string;
  reason: ReportReason;
  details?: string;
}) {
  const { error } = await supabase
    .from('reports')
    .insert({
      reporter_id: params.reporterId,
      reported_id: params.reportedId,
      reason: params.reason,
      details: params.details ?? null,
    });
  if (error) throw error;
}

/** Fetch all user IDs that the current user has blocked. */
export async function fetchBlockedIds(blockerId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', blockerId);
  if (error) throw error;
  return new Set((data ?? []).map((row: { blocked_id: string }) => row.blocked_id));
}
