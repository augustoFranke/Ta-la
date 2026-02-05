import { create } from 'zustand';

export type ActiveCheckIn = {
  id: string;
  venue_id: string;
  place_id: string | null;
  venue_name: string | null;
  checked_in_at: string;
};

type CheckInState = {
  activeCheckIn: ActiveCheckIn | null;
  isLoading: boolean;
  error: string | null;
  setActiveCheckIn: (checkIn: ActiveCheckIn | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

export const useCheckInStore = create<CheckInState>((set) => ({
  activeCheckIn: null,
  isLoading: false,
  error: null,

  setActiveCheckIn: (activeCheckIn) => set({ activeCheckIn }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ activeCheckIn: null, isLoading: false, error: null }),
}));

