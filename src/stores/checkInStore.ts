import { create } from 'zustand';

export type CheckoutReason =
  | 'manual'
  | 'out_of_range'
  | 'stale_location'
  | 'app_killed'
  | 'signout';

export type ActiveCheckIn = {
  id: string;
  venue_id: string;
  place_id: string | null;
  venue_name: string | null;
  checked_in_at: string;
  lastConfirmedAt: string | null;
};

/** A timestamped check-in/out event used for abuse-prevention counting. */
type CheckInEvent = {
  timestamp: number; // Date.now()
};

/** Max events allowed in the abuse-prevention window. */
export const ABUSE_MAX_EVENTS = 5;
/** Abuse-prevention window in milliseconds (10 minutes). */
export const ABUSE_WINDOW_MS = 10 * 60 * 1000;

/** Stale-location auto-checkout: no GPS update for 30 minutes. */
export const AUTO_CHECKOUT_STALE_MS = 30 * 60 * 1000;
/** Out-of-range auto-checkout: continuously outside 100m for 10 minutes. */
export const AUTO_CHECKOUT_OUT_OF_RANGE_MS = 10 * 60 * 1000;

type CheckInState = {
  activeCheckIn: ActiveCheckIn | null;
  lastConfirmedAt: string | null;
  isLoading: boolean;
  error: string | null;
  denialReason: string | null;

  /**
   * Ring-buffer of recent check-in/out events for abuse prevention.
   * Trimmed to only keep events within ABUSE_WINDOW_MS on each write.
   */
  eventHistory: CheckInEvent[];

  /**
   * Timestamp (Date.now()) when the user was first detected continuously
   * outside the venue radius. Null when inside radius.
   */
  outOfRangeStartedAt: number | null;

  // Actions
  setActiveCheckIn: (checkIn: ActiveCheckIn | null) => void;
  setLastConfirmedAt: (timestamp: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDenialReason: (reason: string | null) => void;
  setOutOfRangeStartedAt: (ts: number | null) => void;

  /**
   * Appends a new event to eventHistory (trimming old ones) and returns
   * whether the event is allowed (not throttled).
   */
  recordEvent: () => boolean;

  reset: () => void;
};

const initialState = {
  activeCheckIn: null as ActiveCheckIn | null,
  lastConfirmedAt: null as string | null,
  isLoading: false,
  error: null as string | null,
  denialReason: null as string | null,
  eventHistory: [] as CheckInEvent[],
  outOfRangeStartedAt: null as number | null,
};

export const useCheckInStore = create<CheckInState>((set, get) => ({
  ...initialState,

  setActiveCheckIn: (activeCheckIn) =>
    set({
      activeCheckIn,
      lastConfirmedAt: activeCheckIn ? new Date().toISOString() : null,
    }),

  setLastConfirmedAt: (lastConfirmedAt) => set({ lastConfirmedAt }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setDenialReason: (denialReason) => set({ denialReason }),
  setOutOfRangeStartedAt: (outOfRangeStartedAt) => set({ outOfRangeStartedAt }),

  recordEvent: () => {
    const now = Date.now();
    const windowStart = now - ABUSE_WINDOW_MS;
    const { eventHistory } = get();
    // Trim events outside the window
    const recent = eventHistory.filter((e) => e.timestamp > windowStart);
    if (recent.length >= ABUSE_MAX_EVENTS) {
      // Throttled — do NOT append, just update trimmed list
      set({ eventHistory: recent });
      return false;
    }
    set({ eventHistory: [...recent, { timestamp: now }] });
    return true;
  },

  reset: () => set({ ...initialState }),
}));
