/**
 * Store de venues usando Zustand
 * Gerencia estado de venues próximos
 */

import { create } from 'zustand';
import type { Venue } from '../types/database';

export interface VenueWithDistance extends Venue {
  distance: number;
  open_to_meeting_count?: number;
}

interface VenueState {
  // Lista de venues
  venues: VenueWithDistance[];

  // Estado de loading
  isLoading: boolean;

  // Mensagem de erro
  error: string | null;

  // Timestamp da última busca
  lastFetched: Date | null;

  // Venue selecionado para check-in
  selectedVenue: VenueWithDistance | null;

  // Actions
  setVenues: (venues: VenueWithDistance[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastFetched: (date: Date | null) => void;
  setSelectedVenue: (venue: VenueWithDistance | null) => void;
  clearVenues: () => void;
  updateVenueActiveUsers: (venueId: string, count: number) => void;
}

// Cache duration in milliseconds (5 minutes)
export const VENUE_CACHE_DURATION = 5 * 60 * 1000;

export const useVenueStore = create<VenueState>((set) => ({
  // Estado inicial
  venues: [],
  isLoading: false,
  error: null,
  lastFetched: null,
  selectedVenue: null,

  // Setters
  setVenues: (venues) => set({ venues, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastFetched: (lastFetched) => set({ lastFetched }),
  setSelectedVenue: (selectedVenue) => set({ selectedVenue }),

  // Limpa venues (ex: logout ou mudança de localização significativa)
  clearVenues: () =>
    set({
      venues: [],
      error: null,
      lastFetched: null,
      selectedVenue: null,
    }),

  // Atualiza contagem de usuários ativos em um venue específico
  updateVenueActiveUsers: (venueId, count) =>
    set((state) => ({
      venues: state.venues.map((venue) =>
        venue.id === venueId ? { ...venue, active_users_count: count } : venue
      ),
    })),
}));

/**
 * Helper para verificar se o cache está válido
 */
export function isVenueCacheValid(lastFetched: Date | null): boolean {
  if (!lastFetched) return false;
  return Date.now() - lastFetched.getTime() < VENUE_CACHE_DURATION;
}
