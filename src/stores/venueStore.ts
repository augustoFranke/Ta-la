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

  // Localização no momento do último fetch (para invalidação por cidade/raio)
  cachedLocation: { latitude: number; longitude: number } | null;

  // Venue selecionado para check-in
  selectedVenue: VenueWithDistance | null;

  // Actions
  setVenues: (venues: VenueWithDistance[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastFetched: (date: Date | null) => void;
  setSelectedVenue: (venue: VenueWithDistance | null) => void;
  setCachedLocation: (location: { latitude: number; longitude: number } | null) => void;
  clearVenues: () => void;
  updateVenueActiveUsers: (venueId: string, count: number) => void;
}

// Cache duration in milliseconds (30 days)
export const VENUE_CACHE_DURATION = 30 * 24 * 60 * 60 * 1000;

export const useVenueStore = create<VenueState>((set) => ({
  // Estado inicial
  venues: [],
  isLoading: false,
  error: null,
  lastFetched: null,
  cachedLocation: null,
  selectedVenue: null,

  // Setters
  setVenues: (venues) => set({ venues, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastFetched: (lastFetched) => set({ lastFetched }),
  setSelectedVenue: (selectedVenue) => set({ selectedVenue }),
  setCachedLocation: (cachedLocation) => set({ cachedLocation }),

  // Limpa venues (ex: logout ou mudança de localização significativa)
  clearVenues: () =>
    set({
      venues: [],
      error: null,
      lastFetched: null,
      cachedLocation: null,
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
 * Helper para verificar se o cache está válido (retrocompatibilidade)
 */
export function isVenueCacheValid(lastFetched: Date | null): boolean {
  if (!lastFetched) return false;
  return Date.now() - lastFetched.getTime() < VENUE_CACHE_DURATION;
}

/**
 * Helper para verificar se o cache está stale por tempo OU por deslocamento geográfico.
 * O cache é invalidado se:
 *  - Passou mais de 30 dias desde o último fetch, OU
 *  - O usuário se moveu mais de `radiusMeters` desde o último fetch (mudança de cidade/bairro)
 */
export function isVenueCacheStale(
  lastFetched: Date | null,
  cachedLocation: { latitude: number; longitude: number } | null,
  currentLat: number,
  currentLng: number,
  radiusMeters: number = 2000
): boolean {
  if (!lastFetched || !cachedLocation) return true;
  // Time check: 30-day expiry
  if (Date.now() - lastFetched.getTime() > VENUE_CACHE_DURATION) return true;
  // City-radius check: if user has moved more than radiusMeters since last fetch, invalidate
  const R = 6371000; // Earth radius in meters
  const dLat = ((currentLat - cachedLocation.latitude) * Math.PI) / 180;
  const dLon = ((currentLng - cachedLocation.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((cachedLocation.latitude * Math.PI) / 180) *
      Math.cos((currentLat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const distanceMeters = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * R;
  return distanceMeters > radiusMeters;
}
