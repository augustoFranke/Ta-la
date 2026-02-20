/**
 * Chat List Tab — Spec 007
 * Shows all active chats with matched users.
 * Only authenticated + verified users see their matches.
 */

import { useCallback, useEffect } from 'react';
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
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { useChat } from '../../src/hooks/useChat';
import { Avatar } from '../../src/components/ui/Avatar';
import type { ChatMatch } from '../../src/types/database';

function formatMatchTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function ChatScreen() {
  const { colors, spacing, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { matches, isLoadingMatches, loadMatches } = useChat(user?.id ?? null);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const renderMatch = useCallback(
    ({ item }: { item: ChatMatch }) => (
      <TouchableOpacity
        style={[styles.matchRow, { borderBottomColor: colors.border }]}
        onPress={() => router.push(`/chat/${item.match_id}`)}
        activeOpacity={0.7}
      >
        <Avatar name={item.partner_name} url={item.partner_photo_url} size={52} />
        <View style={styles.matchInfo}>
          <View style={styles.matchTopRow}>
            <Text style={[styles.partnerName, { color: colors.text }]} numberOfLines={1}>
              {item.partner_name}
            </Text>
            {item.last_message_at && (
              <Text style={[styles.timeStamp, { color: colors.textSecondary }]}>
                {formatMatchTime(item.last_message_at)}
              </Text>
            )}
          </View>
          <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.last_message ?? 'Iniciaram uma conexão'}
          </Text>
        </View>
        {item.unread_count > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.unreadCount, { color: colors.onPrimary }]}>
              {item.unread_count > 9 ? '9+' : item.unread_count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    ),
    [colors, router],
  );

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Faça login para ver seus chats</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text }]}>Conexões</Text>
      </View>

      {isLoadingMatches ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={52} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhuma conexão ainda</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Faça check-in e interaja com pessoas para criar conexões.
          </Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.match_id}
          renderItem={renderMatch}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  matchInfo: {
    flex: 1,
    gap: 4,
  },
  matchTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  timeStamp: {
    fontSize: 12,
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 14,
  },
  unreadBadge: {
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 11,
    fontWeight: '700',
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
    textAlign: 'center',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
