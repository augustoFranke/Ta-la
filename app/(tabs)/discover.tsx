/**
 * Tela Descobrir
 * Busca por pessoas + sugestões no mesmo local
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Input } from '../../src/components/ui/Input';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Avatar } from '../../src/components/ui/Avatar';
import { useAuth } from '../../src/hooks/useAuth';
import { supabase } from '../../src/services/supabase';
import { useCheckIn } from '../../src/hooks/useCheckIn';
import { useVenueRealtime } from '../../src/hooks/useVenueRealtime';
import { usePresenceConfirmation } from '../../src/hooks/usePresenceConfirmation';
import { PresenceConfirmationModal } from '../../src/components/PresenceConfirmationModal';
import { useRouter } from 'expo-router';
import { sendInteraction, fetchReceivedInteractions } from '../../src/services/interactions';
import { useInteractionRealtime } from '../../src/hooks/useInteractionRealtime';
import { InteractionButtons } from '../../src/components/interaction/InteractionButtons';
import { ConfirmationDialog } from '../../src/components/interaction/ConfirmationDialog';
import { MatchCelebration } from '../../src/components/interaction/MatchCelebration';
import { ReceivedInteractions } from '../../src/components/interaction/ReceivedInteractions';
import type { InteractionType, ReceivedInteraction } from '../../src/types/database';
import { blockUser, fetchBlockedIds } from '../../src/services/moderation';
import { useBlockStore } from '../../src/stores/blockStore';

type VenueUser = {
  id: string;
  name: string;
  bio: string | null;
  occupation: string | null;
  age: number;
  checked_in_at: string;
};

type BasicUser = {
  id: string;
  name: string;
  bio: string | null;
  occupation: string | null;
  birth_date?: string;
};

function formatRecency(checkedInAt: string): string {
  const diffMs = Date.now() - new Date(checkedInAt).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora mesmo';
  if (diffMin < 60) return `ha ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return 'ha 1h';
  return `ha ${diffHours}h`;
}

export default function DiscoverScreen() {
  const { colors, spacing, typography, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { activeCheckIn, fetchActiveCheckIn, checkOut } = useCheckIn();

  const { blockedIds, setBlockedIds, addBlockedId } = useBlockStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [venueUsers, setVenueUsers] = useState<VenueUser[]>([]);
  const [searchResults, setSearchResults] = useState<BasicUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Interaction state
  const [pendingInteraction, setPendingInteraction] = useState<{
    type: InteractionType;
    userId: string;
    userName: string;
  } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [matchData, setMatchData] = useState<{
    matchedUserName: string;
    matchedUserPhotoUrl: string | null;
  } | null>(null);
  const [receivedInteractions, setReceivedInteractions] = useState<ReceivedInteraction[]>([]);
  const [sentInteractions, setSentInteractions] = useState<Record<string, Set<InteractionType>>>({});

  const userId = user?.id;
  const currentUserName = user?.name ?? 'Voce';

  const loadVenueUsers = useCallback(async () => {
    if (!userId || !activeCheckIn?.venue_id) {
      setVenueUsers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_users_at_venue', {
        p_venue_id: activeCheckIn.venue_id,
        p_user_id: userId,
      });

      if (error) throw error;
      const filtered = (data ?? []).filter((u: any) => !blockedIds.has(u.id));
      setVenueUsers(filtered as VenueUser[]);
    } catch (err: any) {
      console.error('Erro ao buscar usuários no local:', err);
      Alert.alert('Erro', 'Não foi possível buscar pessoas no local.');
    } finally {
      setIsLoading(false);
    }
  }, [userId, activeCheckIn?.venue_id, blockedIds]);

  // Load received interactions
  const loadReceivedInteractions = useCallback(async () => {
    if (!userId || !activeCheckIn?.venue_id) {
      setReceivedInteractions([]);
      return;
    }

    try {
      const data = await fetchReceivedInteractions(userId, activeCheckIn.venue_id);
      setReceivedInteractions(data);
    } catch (err) {
      console.error('Erro ao carregar interacoes recebidas:', err);
    }
  }, [userId, activeCheckIn?.venue_id]);

  // Realtime: auto-refetch venue roster on check-in/out changes
  useVenueRealtime(activeCheckIn?.venue_id ?? null, loadVenueUsers);

  // Realtime: auto-refetch received interactions on new interaction events
  useInteractionRealtime(activeCheckIn?.venue_id ?? null, loadReceivedInteractions);

  // Presence confirmation: periodic "Ainda esta aqui?" prompt
  const { showPrompt, confirmPresence, denyPresence } = usePresenceConfirmation(!!activeCheckIn);

  const handleDenyPresence = useCallback(async () => {
    denyPresence();
    await checkOut();
  }, [denyPresence, checkOut]);

  // Interaction handlers
  const handleInteract = useCallback((type: InteractionType, userProfile: { id: string; name: string }) => {
    setPendingInteraction({ type, userId: userProfile.id, userName: userProfile.name });
  }, []);

  const handleConfirmInteraction = useCallback(async () => {
    if (!pendingInteraction || !activeCheckIn?.venue_id) return;

    setIsSending(true);
    try {
      const result = await sendInteraction({
        receiverId: pendingInteraction.userId,
        venueId: activeCheckIn.venue_id,
        type: pendingInteraction.type,
      });

      // Update sent interactions for button feedback
      setSentInteractions((prev) => {
        const existing = prev[pendingInteraction.userId] ?? new Set<InteractionType>();
        const next = new Set(existing);
        next.add(pendingInteraction.type);
        return { ...prev, [pendingInteraction.userId]: next };
      });

      // Check for match
      if (result.is_match) {
        setMatchData({
          matchedUserName: pendingInteraction.userName,
          matchedUserPhotoUrl: null, // photos not in BasicUser/VenueUser; Avatar uses name fallback
        });
      }

      // Refresh received interactions
      await loadReceivedInteractions();
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    } finally {
      setIsSending(false);
      setPendingInteraction(null);
    }
  }, [pendingInteraction, activeCheckIn?.venue_id, loadReceivedInteractions]);

  const handleCancelInteraction = useCallback(() => {
    setPendingInteraction(null);
  }, []);

  const handleDismissMatch = useCallback(() => {
    setMatchData(null);
  }, []);

  const performSearch = useCallback(async () => {
    if (!userId || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, bio, occupation, birth_date')
        .ilike('name', `%${searchQuery.trim()}%`)
        .eq('is_verified', true)
        .neq('id', userId)
        .limit(20);

      if (error) throw error;
      const filtered = (data ?? []).filter((u: any) => !blockedIds.has(u.id));
      setSearchResults(filtered as BasicUser[]);
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err);
      Alert.alert('Erro', 'Não foi possível buscar usuários.');
    } finally {
      setIsSearching(false);
    }
  }, [userId, searchQuery, blockedIds]);

  const handleBlockFromCard = useCallback(async (targetId: string, targetName: string) => {
    if (!userId) return;
    Alert.alert(
      'Bloquear usuario',
      `Voce nao vera mais ${targetName} e ${targetName.split(' ')[0]} nao vera voce. Deseja continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(userId, targetId);
              addBlockedId(targetId);
              setVenueUsers(prev => prev.filter(u => u.id !== targetId));
              setSearchResults(prev => prev.filter(u => u.id !== targetId));
            } catch {
              Alert.alert('Erro', 'Nao foi possivel bloquear este usuario.');
            }
          },
        },
      ]
    );
  }, [userId, addBlockedId]);

  useEffect(() => {
    fetchActiveCheckIn();
  }, [fetchActiveCheckIn]);

  useEffect(() => {
    if (!userId) return;
    fetchBlockedIds(userId).then(setBlockedIds).catch(console.error);
  }, [userId, setBlockedIds]);

  useEffect(() => {
    loadVenueUsers();
  }, [loadVenueUsers]);

  useEffect(() => {
    loadReceivedInteractions();
  }, [loadReceivedInteractions]);

  useEffect(() => {
    const handler = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(handler);
  }, [performSearch]);

  const renderUserCard = (profile: BasicUser, ageOverride?: number, checkedInAt?: string) => {
    const age = typeof ageOverride === 'number'
      ? ageOverride
      : profile.birth_date
      ? Math.floor((Date.now() - new Date(profile.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    return (
      <Card key={profile.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Avatar name={profile.name} size={56} />
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: colors.text }]}>
              {profile.name}{age ? `, ${age}` : ''}
            </Text>
            {checkedInAt && (
              <View style={styles.recencyRow}>
                <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.recencyText, { color: colors.textSecondary }]}>
                  {formatRecency(checkedInAt)}
                </Text>
              </View>
            )}
            {profile.bio ? (
              <Text style={[styles.cardBio, { color: colors.textSecondary }]} numberOfLines={2}>
                {profile.bio}
              </Text>
            ) : (
              <Text style={[styles.cardBio, { color: colors.textSecondary }]}>Sem bio</Text>
            )}
          </View>
        </View>

        <View style={styles.cardActions}>
          <Button
            title="Ver perfil"
            variant="outline"
            onPress={() => router.push(`/user/${profile.id}`)}
            style={styles.cardButton}
          />
          <InteractionButtons
            onInteract={(type) => handleInteract(type, profile)}
            sentTypes={sentInteractions[profile.id]}
            disabled={!activeCheckIn?.venue_id}
          />
          <TouchableOpacity
            onPress={() => handleBlockFromCard(profile.id, profile.name)}
            style={styles.blockIconButton}
          >
            <Ionicons name="ban-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const venueUsersList = useMemo(() => venueUsers, [venueUsers]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={[styles.header, { padding: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xl }]}>Descobrir</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>Encontre pessoas no mesmo local</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        <Input
          label="Buscar pessoas"
          placeholder="Digite um nome"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {searchQuery.trim().length >= 2 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Resultados</Text>
            {isSearching ? (
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>Buscando usuários...</Text>
            ) : searchResults.length === 0 ? (
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>Nenhum usuário encontrado.</Text>
            ) : (
              searchResults.map((profile) => renderUserCard(profile))
            )}
          </View>
        ) : null}

        {/* Quem te curtiu — above venue users */}
        <ReceivedInteractions
          interactions={receivedInteractions}
          onInteractBack={(senderId) => router.push(`/user/${senderId}`)}
        />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Pessoas no mesmo local</Text>
          {!activeCheckIn ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Ionicons name="location" size={28} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Faça check-in para ver quem está no local.</Text>
            </View>
          ) : isLoading ? (
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>Buscando pessoas no local...</Text>
          ) : venueUsersList.length === 0 ? (
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>Ninguém disponível no momento.</Text>
          ) : (
            venueUsersList.map((profile) =>
              renderUserCard(
                {
                  id: profile.id,
                  name: profile.name,
                  bio: profile.bio,
                  occupation: profile.occupation,
                },
                profile.age,
                profile.checked_in_at
              )
            )
          )}
        </View>
      </ScrollView>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        visible={pendingInteraction !== null}
        userName={pendingInteraction?.userName ?? ''}
        interactionType={pendingInteraction?.type ?? 'drink'}
        onConfirm={handleConfirmInteraction}
        onCancel={handleCancelInteraction}
        loading={isSending}
      />

      {/* Match Celebration */}
      <MatchCelebration
        visible={matchData !== null}
        currentUserName={currentUserName}
        currentUserPhotoUrl={null}
        matchedUserName={matchData?.matchedUserName ?? ''}
        matchedUserPhotoUrl={matchData?.matchedUserPhotoUrl ?? null}
        onDismiss={handleDismissMatch}
      />

      {/* Presence Confirmation */}
      <PresenceConfirmationModal
        visible={showPrompt}
        venueName={activeCheckIn?.venue_name ?? ''}
        onConfirm={confirmPresence}
        onDeny={handleDenyPresence}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 8,
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {},
  content: {
    paddingBottom: 48,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  helperText: {
    fontSize: 14,
  },
  emptyState: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
  },
  card: {
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
  },
  recencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  recencyText: {
    fontSize: 11,
  },
  cardBio: {
    fontSize: 13,
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardButton: {
    flex: 1,
    minWidth: 100,
  },
  blockIconButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
