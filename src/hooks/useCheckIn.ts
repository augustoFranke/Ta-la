import { useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useCheckInStore, type ActiveCheckIn } from '../stores/checkInStore';
import { useAuthStore } from '../stores/authStore';
import { useLocationStore } from '../stores/locationStore';

const DENIAL_MESSAGES: Record<string, string> = {
  not_authenticated: 'Voce precisa estar logado para fazer check-in.',
  too_far: 'Voce esta muito longe deste local. Aproxime-se para fazer check-in.',
  stale_location: 'Sua localizacao esta desatualizada. Aguarde a atualizacao do GPS e tente novamente.',
  cooldown: 'Voce fez check-out deste local recentemente. Aguarde alguns minutos para fazer check-in novamente.',
};

type CheckInToPlaceInput = {
  place_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  types: string[];
  photo_url: string | null;
  rating: number | null;
  open_to_meeting: boolean;
};

type CheckInV2Response = {
  success: boolean;
  check_in_id?: string;
  denial_reason?: string;
};

export function useCheckIn() {
  const { session } = useAuthStore();
  const { activeCheckIn, isLoading, error, denialReason, setActiveCheckIn, setLoading, setError, setDenialReason } = useCheckInStore();

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

      const venue = (data as any).venues ?? null;
      const mapped: ActiveCheckIn = {
        id: data.id,
        venue_id: data.venue_id,
        place_id: venue?.google_place_id ?? null,
        venue_name: venue?.name ?? null,
        checked_in_at: data.checked_in_at,
      };

      setActiveCheckIn(mapped);
      return mapped;
    } catch (err: any) {
      console.error('Erro ao buscar check-in ativo:', err);
      setError('Erro ao buscar check-in ativo');
      return null;
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, setActiveCheckIn, setLoading, setError]);

  const checkInToPlace = useCallback(
    async (input: CheckInToPlaceInput) => {
      if (!session?.user?.id) {
        return { success: false as const, error: 'Usuario nao autenticado' };
      }

      setLoading(true);
      setError(null);
      setDenialReason(null);

      try {
        // Get fresh GPS coordinates
        const coords = await useLocationStore.getState().getCurrentLocation();
        if (!coords) {
          return { success: false as const, error: 'Nao foi possivel obter sua localizacao. Verifique as permissoes.' };
        }

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
          p_user_lat: coords.latitude,
          p_user_lng: coords.longitude,
          p_user_accuracy: coords.accuracy,
          p_user_location_timestamp: new Date().toISOString(),
        });

        if (rpcError) throw rpcError;

        const response = data as CheckInV2Response;

        if (!response.success) {
          const reason = response.denial_reason || 'unknown';
          const message = DENIAL_MESSAGES[reason] || 'Nao foi possivel fazer check-in.';
          setDenialReason(reason);
          return { success: false as const, error: message };
        }

        // Success: clear denial, refresh active check-in
        setDenialReason(null);
        await fetchActiveCheckIn();
        return { success: true as const, check_in_id: response.check_in_id };
      } catch (err: any) {
        console.error('Erro ao fazer check-in:', err);
        const message = err?.message || 'Erro ao fazer check-in';
        setError(message);
        return { success: false as const, error: message };
      } finally {
        setLoading(false);
      }
    },
    [session?.user?.id, setLoading, setError, setDenialReason, fetchActiveCheckIn]
  );

  return {
    activeCheckIn,
    isLoading,
    error,
    denialReason,
    fetchActiveCheckIn,
    checkInToPlace,
  };
}
