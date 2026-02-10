/**
 * Tela Descobrir
 * Busca por pessoas + sugestões no mesmo local
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
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
import { useRouter } from 'expo-router';
import {
  fetchDrinkRelations,
  respondDrinkOffer,
  sendDrinkOffer,
  type DrinkRelation,
} from '../../src/services/drinks';

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
  const { activeCheckIn, fetchActiveCheckIn } = useCheckIn();

  const [searchQuery, setSearchQuery] = useState('');
  const [venueUsers, setVenueUsers] = useState<VenueUser[]>([]);
  const [searchResults, setSearchResults] = useState<BasicUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [drinkRelations, setDrinkRelations] = useState<Record<string, DrinkRelation>>({});
  const [actionTargetId, setActionTargetId] = useState<string | null>(null);

  const userId = user?.id;

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
      setVenueUsers((data ?? []) as VenueUser[]);
    } catch (err: any) {
      console.error('Erro ao buscar usuários no local:', err);
      Alert.alert('Erro', 'Não foi possível buscar pessoas no local.');
    } finally {
      setIsLoading(false);
    }
  }, [userId, activeCheckIn?.venue_id]);

  const refreshDrinkRelations = useCallback(async (targetIds: string[]) => {
    if (!userId || targetIds.length === 0) {
      setDrinkRelations({});
      return;
    }

    const uniqueIds = Array.from(new Set(targetIds));
    try {
      const next = await fetchDrinkRelations(userId, uniqueIds);
      setDrinkRelations(next);
    } catch (err) {
      console.error('Erro ao carregar status de drinks:', err);
    }
  }, [userId]);

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
      setSearchResults((data ?? []) as BasicUser[]);
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err);
      Alert.alert('Erro', 'Não foi possível buscar usuários.');
    } finally {
      setIsSearching(false);
    }
  }, [userId, searchQuery]);

  useEffect(() => {
    fetchActiveCheckIn();
  }, [fetchActiveCheckIn]);

  useEffect(() => {
    loadVenueUsers();
  }, [loadVenueUsers]);

  useEffect(() => {
    const handler = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(handler);
  }, [performSearch]);

  useEffect(() => {
    const targetIds = [
      ...venueUsers.map((profile) => profile.id),
      ...searchResults.map((profile) => profile.id),
    ];
    refreshDrinkRelations(targetIds);
  }, [venueUsers, searchResults, refreshDrinkRelations]);

  const handleSendDrink = useCallback(async (targetId: string) => {
    if (!userId) return;
    if (!activeCheckIn?.venue_id) {
      Alert.alert('Check-in necessário', 'Faça check-in para pagar um drink.');
      return;
    }

    setActionTargetId(targetId);
    try {
      await sendDrinkOffer({
        senderId: userId,
        receiverId: targetId,
        venueId: activeCheckIn.venue_id,
      });
      await refreshDrinkRelations([targetId]);
      Alert.alert('Drink enviado', 'Agora é só aguardar a resposta.');
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Não foi possível enviar o drink.');
    } finally {
      setActionTargetId(null);
    }
  }, [userId, activeCheckIn?.venue_id, refreshDrinkRelations]);

  const handleRespondDrink = useCallback(async (targetId: string, action: 'accepted' | 'declined') => {
    const relation = drinkRelations[targetId];
    if (!relation?.incomingDrinkId) return;

    setActionTargetId(targetId);
    try {
      await respondDrinkOffer({
        drinkId: relation.incomingDrinkId,
        action,
      });
      await refreshDrinkRelations([targetId]);
      if (action === 'accepted') {
        Alert.alert('Drink aceito', 'Se vocês dois aceitarem, a conexão será confirmada.');
      }
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Não foi possível responder o drink.');
    } finally {
      setActionTargetId(null);
    }
  }, [drinkRelations, refreshDrinkRelations]);

  const renderUserCard = (profile: BasicUser, ageOverride?: number, checkedInAt?: string) => {
    const age = typeof ageOverride === 'number'
      ? ageOverride
      : profile.birth_date
      ? Math.floor((Date.now() - new Date(profile.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    const relation = drinkRelations[profile.id]?.state ?? 'none';
    const isBusy = actionTargetId === profile.id;

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
          {relation === 'matched' ? (
            <Button title="Conectados" disabled style={styles.cardButton} />
          ) : relation === 'sent_pending' ? (
            <Button title="Drink enviado" disabled style={styles.cardButton} />
          ) : relation === 'received_pending' ? (
            <View style={styles.cardActionGroup}>
              <Button
                title="Aceitar drink"
                onPress={() => handleRespondDrink(profile.id, 'accepted')}
                style={styles.cardButton}
                loading={isBusy}
                disabled={isBusy}
              />
              <Button
                title="Recusar"
                variant="outline"
                onPress={() => handleRespondDrink(profile.id, 'declined')}
                style={styles.cardButton}
                disabled={isBusy}
              />
            </View>
          ) : relation === 'received_accepted' ? (
            <Button
              title="Retribuir drink"
              onPress={() => handleSendDrink(profile.id)}
              style={styles.cardButton}
              loading={isBusy}
              disabled={isBusy}
            />
          ) : relation === 'sent_accepted' ? (
            <Button title="Drink aceito" disabled style={styles.cardButton} />
          ) : (
            <Button
              title={activeCheckIn?.venue_id ? 'Pagar um drink' : 'Faça check-in para drink'}
              onPress={() => handleSendDrink(profile.id)}
              style={styles.cardButton}
              loading={isBusy}
              disabled={isBusy || !activeCheckIn?.venue_id}
            />
          )}
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
    flexWrap: 'wrap',
    gap: 8,
  },
  cardActionGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  cardButton: {
    flex: 1,
    minWidth: 120,
  },
});
