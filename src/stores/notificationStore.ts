import { create } from 'zustand';
import type { NotificationPreferences, NotificationCategory } from '../types/database';
import { upsertNotificationPreferences } from '../services/notifications';

type NotificationState = {
  preferences: NotificationPreferences | null;
  isLoaded: boolean;
  setPreferences: (prefs: NotificationPreferences | null) => void;
  updateCategory: (userId: string, category: NotificationCategory, enabled: boolean) => void;
  reset: () => void;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  preferences: null,
  isLoaded: false,

  setPreferences: (prefs) => set({ preferences: prefs, isLoaded: true }),

  updateCategory: (userId, category, enabled) => {
    const current = get().preferences;
    if (!current) return;

    // Optimistic update
    const updated = { ...current, [category]: enabled, updated_at: new Date().toISOString() };
    set({ preferences: updated });

    // Persist to database
    upsertNotificationPreferences(userId, { [category]: enabled }).catch(() => {
      // Revert on failure
      set({ preferences: current });
    });
  },

  reset: () => set({ preferences: null, isLoaded: false }),
}));
