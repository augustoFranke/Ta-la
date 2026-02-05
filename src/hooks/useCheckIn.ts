import { useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useCheckInStore, type ActiveCheckIn } from '../stores/checkInStore';
import { useAuthStore } from '../stores/authStore';

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

export function useCheckIn() {
  const { session } = useAuthStore();
  const { activeCheckIn, isLoading, error, setActiveCheckIn, setLoading, setError } = useCheckInStore();

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
        return { success: false as const, error: 'Usuário não autenticado' };
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: rpcError } = await supabase.rpc('check_in_to_place', {
          p_place_id: input.place_id,
          p_name: input.name,
          p_address: input.address,
          p_lat: input.latitude,
          p_lng: input.longitude,
          p_types: input.types,
          p_photo_url: input.photo_url,
          p_rating: input.rating,
          p_open_to_meeting: input.open_to_meeting,
        });

        if (rpcError) throw rpcError;

        // Atualiza check-in ativo no store (buscando venue_id/place_id corretamente)
        await fetchActiveCheckIn();

        return { success: true as const, check_in_id: data as string };
      } catch (err: any) {
        console.error('Erro ao fazer check-in:', err);
        const message = err?.message || 'Erro ao fazer check-in';
        setError(message);
        return { success: false as const, error: message };
      } finally {
        setLoading(false);
      }
    },
    [session?.user?.id, setLoading, setError, fetchActiveCheckIn]
  );

  return {
    activeCheckIn,
    isLoading,
    error,
    fetchActiveCheckIn,
    checkInToPlace,
  };
}

