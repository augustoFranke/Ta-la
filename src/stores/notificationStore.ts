/**
 * Notification Zustand store — Spec 008
 * Holds notification preferences + in-app notification items.
 */

import { create } from 'zustand';
import type {
  NotificationPreferences,
  NotificationCategory,
  NotificationItem,
} from '../types/database';
import { upsertNotificationPreferences } from '../services/notifications';

type NotificationState = {
  // Preferences
  preferences: NotificationPreferences | null;
  isLoaded: boolean;

  // In-app notification items
  notifications: NotificationItem[];
  /** Count of unread items — shown on home bell icon */
  unreadCount: number;

  // Actions
  setPreferences: (prefs: NotificationPreferences | null) => void;
  updateCategory: (userId: string, category: NotificationCategory, enabled: boolean) => void;
  setNotifications: (items: NotificationItem[]) => void;
  markRead: (notifId: string) => void;
  markAllRead: () => void;
  reset: () => void;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  preferences: null,
  isLoaded: false,
  notifications: [],
  unreadCount: 0,

  setPreferences: (prefs) => set({ preferences: prefs, isLoaded: true }),

  updateCategory: (userId, category, enabled) => {
    const current = get().preferences;
    if (!current) return;

    const updated = { ...current, [category]: enabled, updated_at: new Date().toISOString() };
    set({ preferences: updated });

    upsertNotificationPreferences(userId, { [category]: enabled }).catch(() => {
      set({ preferences: current });
    });
  },

  setNotifications: (items) =>
    set({
      notifications: items,
      unreadCount: items.filter((n) => !n.is_read).length,
    }),

  markRead: (notifId) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === notifId ? { ...n, is_read: true } : n,
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.is_read).length,
      };
    }),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    })),

  reset: () => set({ preferences: null, isLoaded: false, notifications: [], unreadCount: 0 }),
}));
