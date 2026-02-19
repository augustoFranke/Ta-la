import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribes to Supabase Realtime postgres_changes on interactions
 * filtered by venue_id. Debounces events at 300ms before calling
 * the onInteractionChange callback.
 *
 * The callback triggers a refetch of received interactions — we do NOT
 * parse the realtime payload. The server RPC handles all filtering.
 */
export function useInteractionRealtime(
  venueId: string | null,
  onInteractionChange: () => void,
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onInteractionChange);

  // Keep callback ref current without triggering effect re-runs
  onChangeRef.current = onInteractionChange;

  const debouncedCallback = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChangeRef.current();
    }, 300);
  }, []);

  useEffect(() => {
    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (!venueId) return;

    const channel = supabase
      .channel(`venue-interactions:${venueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interactions',
          filter: `venue_id=eq.${venueId}`,
        },
        () => {
          debouncedCallback();
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [venueId, debouncedCallback]);
}
