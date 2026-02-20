/**
 * Notifications Screen — Spec 008
 * Shows all in-app notifications with timestamp, type label, and deep-link tap action.
 * Accessible from the home bell icon.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme';
import { useAuth } from '../src/hooks/useAuth';
import { useNotificationStore } from '../src/stores/notificationStore';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  NOTIFICATION_EVENT_LABELS,
} from '../src/services/notifications';
import type { NotificationItem } from '../src/types/database';

const EVENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  mutual_like: 'heart',
  offer_accepted: 'wine',
  offer_rejected: 'close-circle',
  like_received: 'heart-outline',
};

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function NotificationsScreen() {
  const { colors, spacing, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const { notifications, unreadCount, setNotifications, markRead, markAllRead } =
    useNotificationStore();

  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await fetchNotifications(user.id);
      setNotifications(data);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, setNotifications]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleTap = useCallback(
    async (item: NotificationItem) => {
      // Mark read optimistically
      markRead(item.id);
      markNotificationRead(item.id).catch(() => {/* silent */});

      if (item.deep_link) {
        router.push(item.deep_link as any);
      }
    },
    [markRead, router],
  );

  const handleMarkAllRead = useCallback(async () => {
    if (!user?.id) return;
    markAllRead();
    markAllNotificationsRead(user.id).catch(() => {/* silent */});
  }, [user?.id, markAllRead]);

  const renderItem = useCallback(
    ({ item }: { item: NotificationItem }) => {
      const iconName = EVENT_ICONS[item.event_type] ?? 'notifications-outline';
      return (
        <TouchableOpacity
          style={[
            styles.notifRow,
            {
              backgroundColor: item.is_read ? colors.background : colors.card,
              borderBottomColor: colors.border,
            },
          ]}
          onPress={() => handleTap(item)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '22' }]}>
            <Ionicons name={iconName} size={20} color={colors.primary} />
          </View>
          <View style={styles.notifContent}>
            <Text style={[styles.eventLabel, { color: colors.textSecondary }]}>
              {NOTIFICATION_EVENT_LABELS[item.event_type]}
            </Text>
            <Text style={[styles.bodyText, { color: colors.text }]} numberOfLines={2}>
              {item.body}
            </Text>
            <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
              {formatTime(item.created_at)}
            </Text>
          </View>
          {!item.is_read && (
            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
          )}
        </TouchableOpacity>
      );
    },
    [colors, handleTap],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Notificações</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={[styles.markAllText, { color: colors.primary }]}>
              Marcar tudo como lido
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={52} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Sem notificações</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Suas interações e conexões aparecerão aqui.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    gap: 8,
  },
  backButton: { padding: 4 },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: {
    flex: 1,
    gap: 2,
  },
  eventLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 19,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
