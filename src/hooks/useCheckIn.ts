/**
 * useCheckIn — Spec 005: Check-in lifecycle, presence & checkout
 *
 * Responsibilities:
 *   - Eligibility: permission granted, accuracy ≤ 50m, within 100m radius,
 *     user `is_verified`, location freshness ≤ 120s
 *   - Idempotent check-in via Supabase RPC (upsert/check-existing)
 *   - Checkout reasons: manual | out_of_range | stale_location | app_killed | signout
 *   - Auto-checkout: stale location (30 min no GPS) OR out-of-range (10 min continuous)
 *   - Background/kill: AppState listener marks background; heartbeat + server-side cron
 *     handles app-kill scenario (see docs/AGENT_CONTEXT_SUGGESTIONS.md)
 *   - Abuse prevention: max 5 check-in/out events per 10 minutes
 */

import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../services/supabase';
import {
  useCheckInStore,
  type ActiveCheckIn,
  type CheckoutReason,
  AUTO_CHECKOUT_STALE_MS,
  AUTO_CHECKOUT_OUT_OF_RANGE_MS,
} from '../stores/checkInStore';
import { useAuthStore } from '../stores/authStore';
import {
  useLocationStore,
  LOCATION_MAX_ACCURACY_M,
  CHECKIN_RADIUS_M,
} from '../stores/locationStore';
import type { CheckInVisibility } from '../types/database';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** User-facing denial messages in pt-BR. */
const DENIAL_MESSAGES: Record<string, string> = {
  not_authenticated: 'Você precisa estar logado para fazer check-in.',
  not_verified: 'Sua conta precisa estar verificada para fazer check-in.',
  permission_denied: 'Permissão de localização necessária para fazer check-in.',
  accuracy_too_low: `Precisão do GPS insuficiente (necessário ≤ ${LOCATION_MAX_ACCURACY_M}m). Aguarde e tente novamente.`,
  too_far: `Você está muito longe deste local (raio máximo ${CHECKIN_RADIUS_M}m). Aproxime-se para fazer check-in.`,
  stale_location: 'Sua localização está desatualizada. Aguarde a atualização do GPS e tente novamente.',
  cooldown: 'Você fez check-out deste local recentemente. Aguarde alguns minutos.',
  throttled: 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.',
  venue_unavailable: 'Local temporariamente indisponível para check-in.',
  unknown: 'Não foi possível fazer check-in. Tente novamente.',
};

/** Auto-checkout poll interval (checks eligibility and stale/range conditions). */
const AUTO_CHECKOUT_POLL_MS = 30_000; // 30 seconds

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Haversine distance in metres between two lat/lng pairs.
 */
export function haversineDistanceM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000; // Earth radius in metres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * R;
}

// ---------------------------------------------------------------------------
// Input / response types
// ---------------------------------------------------------------------------

export type CheckInToPlaceInput = {
  place_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  types: string[];
  photo_url: string | null;
  rating: number | null;
  open_to_meeting: boolean;
  visibility?: CheckInVisibility;
  /** Per-venue override for check-in radius (metres). Defaults to 100m. */
  check_in_radius?: number;
};

type CheckInV2Response = {
  success: boolean;
  check_in_id?: string;
  denial_reason?: string;
};

export type EligibilityResult =
  | { eligible: true }
  | { eligible: false; reason: string; message: string };

// ---------------------------------------------------------------------------
// Main hook
// ---------------------------------------------------------------------------

export function useCheckIn() {
  const { session, user } = useAuthStore();
  const {
    activeCheckIn,
    isLoading,
    error,
    denialReason,
    outOfRangeStartedAt,
    setActiveCheckIn,
    setLoading,
    setError,
    setDenialReason,
    setOutOfRangeStartedAt,
    recordEvent,
  } = useCheckInStore();

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const autoCheckoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeCheckInRef = useRef<ActiveCheckIn | null>(activeCheckIn);
  activeCheckInRef.current = activeCheckIn;

  // -------------------------------------------------------------------------
  // Eligibility check (client-side, all 5 criteria)
  // -------------------------------------------------------------------------

  const checkEligibility = useCallback(
    (input: {
      venueLat: number;
      venueLng: number;
      check_in_radius?: number;
    }): EligibilityResult => {
      const locationStore = useLocationStore.getState();
      const radius = input.check_in_radius ?? CHECKIN_RADIUS_M;

      // 1. Location permission
      if (!locationStore.permissionGranted) {
        return { eligible: false, reason: 'permission_denied', message: DENIAL_MESSAGES.permission_denied };
      }

      // 2. User must be verified
      if (!user?.is_verified) {
        return { eligible: false, reason: 'not_verified', message: DENIAL_MESSAGES.not_verified };
      }

      // 3. Location freshness ≤ 120s
      if (!locationStore.isLocationFresh()) {
        return { eligible: false, reason: 'stale_location', message: DENIAL_MESSAGES.stale_location };
      }

      // 4. Accuracy ≤ 50m
      if (!locationStore.isAccuracyGood()) {
        return { eligible: false, reason: 'accuracy_too_low', message: DENIAL_MESSAGES.accuracy_too_low };
      }

      // 5. Within venue radius
      const { latitude, longitude } = locationStore;
      if (latitude === null || longitude === null) {
        return { eligible: false, reason: 'stale_location', message: DENIAL_MESSAGES.stale_location };
      }
      const dist = haversineDistanceM(latitude, longitude, input.venueLat, input.venueLng);
      if (dist > radius) {
        return { eligible: false, reason: 'too_far', message: DENIAL_MESSAGES.too_far };
      }

      return { eligible: true };
    },
    [user],
  );

  // -------------------------------------------------------------------------
  // Fetch active check-in from Supabase
  // -------------------------------------------------------------------------

  const fetchActiveCheckIn = useCallback(async () => {
    if (!session?.user?.id) {
      setActiveCheckIn(null);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('check_ins')
        .select('id, venue_id, checked_in_at, venues (google_place_id, name)')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .is('checked_out_at', null)
        .order('checked_in_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setActiveCheckIn(null);
        return null;
      }

      const venue = (data as Record<string, unknown>).venues ?? null;
      const venueRecord = venue as { google_place_id?: string; name?: string } | null;
      const mapped: ActiveCheckIn = {
        id: data.id as string,
        venue_id: data.venue_id as string,
        place_id: venueRecord?.google_place_id ?? null,
        venue_name: venueRecord?.name ?? null,
        checked_in_at: data.checked_in_at as string,
        lastConfirmedAt: null,
      };

      setActiveCheckIn(mapped);
      return mapped;
    } catch (err: unknown) {
      console.error('Erro ao buscar check-in ativo:', err);
      setError('Erro ao buscar check-in ativo');
      return null;
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, setActiveCheckIn, setLoading, setError]);

  // -------------------------------------------------------------------------
  // Checkout (with reason recording)
  // -------------------------------------------------------------------------

  const checkOut = useCallback(
    async (reason: CheckoutReason = 'manual') => {
      const current = activeCheckInRef.current;
      if (!current?.id) return;

      // Abuse prevention (only for manual checkout; auto/system checkouts bypass)
      if (reason === 'manual') {
        const allowed = recordEvent();
        if (!allowed) {
          setDenialReason('throttled');
          setError(DENIAL_MESSAGES.throttled);
          return;
        }
      }

      setLoading(true);
      try {
        const { error: updateError } = await supabase
          .from('check_ins')
          .update({
            is_active: false,
            checked_out_at: new Date().toISOString(),
            checkout_reason: reason,
          })
          .eq('id', current.id);

        if (updateError) throw updateError;

        setActiveCheckIn(null);
        setOutOfRangeStartedAt(null);
      } catch (err: unknown) {
        console.error('Erro ao fazer check-out:', err);
        setError('Não foi possível fazer check-out. Tente novamente.');
      } finally {
        setLoading(false);
      }
    },
    [recordEvent, setLoading, setError, setDenialReason, setActiveCheckIn, setOutOfRangeStartedAt],
  );

  // -------------------------------------------------------------------------
  // Check-in to place (idempotent via RPC)
  // -------------------------------------------------------------------------

  const checkInToPlace = useCallback(
    async (input: CheckInToPlaceInput) => {
      if (!session?.user?.id) {
        return { success: false as const, error: DENIAL_MESSAGES.not_authenticated };
      }

      // Abuse prevention
      const allowed = recordEvent();
      if (!allowed) {
        setDenialReason('throttled');
        return { success: false as const, error: DENIAL_MESSAGES.throttled };
      }

      setLoading(true);
      setError(null);
      setDenialReason(null);

      try {
        // Refresh GPS coords
        const coords = await useLocationStore.getState().getCurrentLocation();
        if (!coords) {
          return { success: false as const, error: DENIAL_MESSAGES.permission_denied };
        }

        let userLat = coords.latitude;
        let userLng = coords.longitude;
        let userAccuracy: number | null = coords.accuracy ?? null;

        if (__DEV__) {
          const { devOverride } = useLocationStore.getState();
          if (devOverride) {
            // Send venue's own coords as user position — guarantees distance check passes
            userLat = input.latitude;
            userLng = input.longitude;
            userAccuracy = 5; // High accuracy
            console.log('[DEV] Check-in bypass active — sending venue coords as user position');
          }
        }

        // Client-side eligibility (spec 005 §4)
        const eligibility = checkEligibility({
          venueLat: input.latitude,
          venueLng: input.longitude,
          check_in_radius: input.check_in_radius,
        });

        if (!eligibility.eligible) {
          setDenialReason(eligibility.reason);
          return { success: false as const, error: eligibility.message };
        }

        const locationTimestamp = useLocationStore.getState().locationTimestamp;

        const { data, error: rpcError } = await supabase.rpc('check_in_to_place_v2', {
          p_place_id: input.place_id,
          p_name: input.name,
          p_address: input.address,
          p_lat: input.latitude,
          p_lng: input.longitude,
          p_types: input.types,
          p_photo_url: input.photo_url,
          p_rating: input.rating,
          p_open_to_meeting: input.open_to_meeting,
          p_user_lat: userLat,
          p_user_lng: userLng,
          p_user_accuracy: userAccuracy,
          p_user_location_timestamp: locationTimestamp
            ? new Date(locationTimestamp).toISOString()
            : new Date().toISOString(),
          p_visibility: input.visibility ?? 'public',
        });

        if (rpcError) throw rpcError;

        const response = data as CheckInV2Response;

        if (!response.success) {
          const reason = response.denial_reason ?? 'unknown';
          const message = DENIAL_MESSAGES[reason] ?? DENIAL_MESSAGES.unknown;
          setDenialReason(reason);
          return { success: false as const, error: message };
        }

        // Success: clear denial, refresh active check-in
        setDenialReason(null);
        setOutOfRangeStartedAt(null);
        await fetchActiveCheckIn();
        return { success: true as const, check_in_id: response.check_in_id };
      } catch (err: unknown) {
        console.error('Erro ao fazer check-in:', err);
        const message = err instanceof Error ? err.message : DENIAL_MESSAGES.unknown;
        setError(message);
        return { success: false as const, error: message };
      } finally {
        setLoading(false);
      }
    },
    [
      session?.user?.id,
      checkEligibility,
      fetchActiveCheckIn,
      recordEvent,
      setLoading,
      setError,
      setDenialReason,
      setOutOfRangeStartedAt,
    ],
  );

  // -------------------------------------------------------------------------
  // Auto-checkout logic
  //
  // Runs on a 30-second poll while checked in:
  //  - Stale location: no GPS update for ≥ 30 min → checkout(stale_location)
  //  - Out of range: outside 100m continuously for ≥ 10 min → checkout(out_of_range)
  //
  // On app kill: server-side cron detects missing heartbeat and auto-checks out.
  // On signout: caller must call checkOut('signout') explicitly.
  // -------------------------------------------------------------------------

  const runAutoCheckoutCheck = useCallback(
    async (venueLat: number, venueLng: number, radius: number) => {
      const locationState = useLocationStore.getState();
      const { locationTimestamp, latitude, longitude } = locationState;
      const now = Date.now();

      // --- Stale location check ---
      const lastGps = locationTimestamp ?? 0;
      if (now - lastGps >= AUTO_CHECKOUT_STALE_MS) {
        console.log('[AutoCheckout] Stale location detected — checking out.');
        await checkOut('stale_location');
        return;
      }

      // --- Out-of-range check ---
      if (latitude !== null && longitude !== null) {
        const dist = haversineDistanceM(latitude, longitude, venueLat, venueLng);
        const { outOfRangeStartedAt: rangeStart } = useCheckInStore.getState();

        if (dist > radius) {
          if (rangeStart === null) {
            // First detection — start the out-of-range timer
            setOutOfRangeStartedAt(now);
          } else if (now - rangeStart >= AUTO_CHECKOUT_OUT_OF_RANGE_MS) {
            console.log('[AutoCheckout] Out of range for ≥10 min — checking out.');
            await checkOut('out_of_range');
          }
        } else {
          // Back inside radius — reset timer
          if (outOfRangeStartedAt !== null) {
            setOutOfRangeStartedAt(null);
          }
        }
      }
    },
    [checkOut, setOutOfRangeStartedAt, outOfRangeStartedAt],
  );

  // Start/stop auto-checkout polling whenever activeCheckIn changes
  useEffect(() => {
    if (!activeCheckIn) {
      if (autoCheckoutTimerRef.current) {
        clearInterval(autoCheckoutTimerRef.current);
        autoCheckoutTimerRef.current = null;
      }
      return;
    }

    // We need venue coords to do radius checking. Fetch them from the venue list
    // or fall back to location-only stale check. For now we rely on the
    // venueStore if the venue id matches; otherwise only stale is checked.
    // The venue lat/lng are not stored in checkInStore. Passing a sentinel
    // radius that means "always in range" but still catches stale GPS.
    // Slice A (VenueCard) should call startAutoCheckout with venue coords.
    // For safety, auto-checkout still detects stale GPS regardless.
    const poll = () => {
      const locState = useLocationStore.getState();
      const { locationTimestamp } = locState;
      const now = Date.now();
      const lastGps = locationTimestamp ?? 0;
      if (now - lastGps >= AUTO_CHECKOUT_STALE_MS) {
        console.log('[AutoCheckout] Stale location — checking out.');
        checkOut('stale_location');
      }
    };

    autoCheckoutTimerRef.current = setInterval(poll, AUTO_CHECKOUT_POLL_MS);
    return () => {
      if (autoCheckoutTimerRef.current) {
        clearInterval(autoCheckoutTimerRef.current);
        autoCheckoutTimerRef.current = null;
      }
    };
  }, [activeCheckIn, checkOut]);

  // -------------------------------------------------------------------------
  // AppState listener: background/kill checkout
  //
  // When app goes to background (not killed), user stays checked in per spec.
  // When app is killed, a server-side heartbeat cron handles checkout.
  // We record the app-background time so the server-side cron can compute
  // the "last seen" window. On foreground resume, we re-check eligibility.
  // -------------------------------------------------------------------------

  const startAutoCheckoutWithVenueCoords = useCallback(
    (venueLat: number, venueLng: number, radius: number = CHECKIN_RADIUS_M) => {
      // Clear existing
      if (autoCheckoutTimerRef.current) {
        clearInterval(autoCheckoutTimerRef.current);
        autoCheckoutTimerRef.current = null;
      }

      if (!activeCheckInRef.current) return;

      autoCheckoutTimerRef.current = setInterval(() => {
        if (activeCheckInRef.current) {
          runAutoCheckoutCheck(venueLat, venueLng, radius);
        }
      }, AUTO_CHECKOUT_POLL_MS);
    },
    [runAutoCheckoutCheck],
  );

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      // App coming back to foreground: re-verify stale GPS
      if (prev.match(/inactive|background/) && nextState === 'active') {
        if (activeCheckInRef.current) {
          const locState = useLocationStore.getState();
          const { locationTimestamp } = locState;
          const now = Date.now();
          const lastGps = locationTimestamp ?? 0;
          if (now - lastGps >= AUTO_CHECKOUT_STALE_MS) {
            console.log('[AutoCheckout] Stale on foreground resume — checking out.');
            checkOut('stale_location');
          }
        }
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [checkOut]);

  // -------------------------------------------------------------------------
  // Derived helpers
  // -------------------------------------------------------------------------

  const getEligibilityMessage = useCallback(
    (input: { venueLat: number; venueLng: number; check_in_radius?: number }): string | null => {
      const result = checkEligibility(input);
      if (result.eligible) return null;
      return result.message;
    },
    [checkEligibility],
  );

  return {
    activeCheckIn,
    isLoading,
    error,
    denialReason,
    fetchActiveCheckIn,
    checkInToPlace,
    checkOut,
    checkEligibility,
    getEligibilityMessage,
    startAutoCheckoutWithVenueCoords,
    haversineDistanceM,
  };
}
