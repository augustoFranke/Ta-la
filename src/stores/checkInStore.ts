import { create } from 'zustand';

export type ActiveCheckIn = {
  id: string;
  venue_id: string;
  place_id: string | null;
  venue_name: string | null;
  checked_in_at: string;
  lastConfirmedAt: string | null;
};

type CheckInState = {
  activeCheckIn: ActiveCheckIn | null;
  lastConfirmedAt: string | null;
  isLoading: boolean;
  error: string | null;
  denialReason: string | null;
  setActiveCheckIn: (checkIn: ActiveCheckIn | null) => void;
  setLastConfirmedAt: (timestamp: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDenialReason: (reason: string | null) => void;
  reset: () => void;
};

export const useCheckInStore = create<CheckInState>((set) => ({
  activeCheckIn: null,
  lastConfirmedAt: null,
  isLoading: false,
  error: null,
  denialReason: null,

  setActiveCheckIn: (activeCheckIn) =>
    set({
      activeCheckIn,
      lastConfirmedAt: activeCheckIn ? new Date().toISOString() : null,
    }),
  setLastConfirmedAt: (lastConfirmedAt) => set({ lastConfirmedAt }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setDenialReason: (denialReason) => set({ denialReason }),
  reset: () =>
    set({
      activeCheckIn: null,
      lastConfirmedAt: null,
      isLoading: false,
      error: null,
      denialReason: null,
    }),
}));

