/**
 * Tela Home
 * Header com avatar + saudação, busca, venues perto de você, em alta
 */

import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { useVenues } from '../../src/hooks/useVenues';
import { useLocationStore } from '../../src/stores/locationStore';
import { useVenueStore, type VenueWithDistance } from '../../src/stores/venueStore';
import { formatDistance } from '../../src/services/places';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, spacing, isDark } = useTheme();
  const { user } = useAuth();
  const { setSelectedVenue } = useVenueStore();
  const {
    latitude,
    longitude,
    permissionGranted,
    isLoading: isLocationLoading,
    bootstrap,
  } = useLocationStore();

  const {
    venues,
    isLoading: isVenuesLoading,
    error,
    hasLocation,
    refreshVenues,
  } = useVenues({ autoFetch: true });

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!latitude || !longitude) {
      bootstrap();
    }
  }, [latitude, longitude, bootstrap]);

  // Top 3 by nightlife score for "Em alta"
  const trendingVenues = useMemo(() => {
    if (!venues || venues.length === 0) return [];
    return [...venues]
      .sort((a, b) => {
        const scoreA = (a as any).nightlife_score ?? 0;
        const scoreB = (b as any).nightlife_score ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return (b.active_users_count ?? 0) - (a.active_users_count ?? 0);
      })
      .slice(0, 3);
  }, [venues]);

  // Filter venues by search
  const filteredVenues = useMemo(() => {
    if (!searchQuery.trim()) return venues;
    const q = searchQuery.toLowerCase();
    return venues.filter((v) => v.name.toLowerCase().includes(q));
  }, [venues, searchQuery]);

  const handleVenuePress = (venue: VenueWithDistance) => {
    setSelectedVenue(venue);
    router.push(`/venue/${venue.place_id}`);
  };

  const isLoading = isVenuesLoading || isLocationLoading || !hasLocation;

  const renderNearbyCard = ({ item }: { item: VenueWithDistance }) => {
    const distanceMeters = item.distance * 1000;
    const isTooFar = distanceMeters > 50;
    const photoUrl = item.photo_url || item.photo_urls?.[0];

    return (
      <TouchableOpacity
        style={[styles.nearbyCard, { backgroundColor: colors.card }]}
        activeOpacity={0.85}
        onPress={() => handleVenuePress(item)}
      >
        <View style={styles.nearbyImageContainer}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.nearbyImage} />
          ) : (
            <View style={[styles.nearbyImage, styles.nearbyImagePlaceholder, { backgroundColor: colors.border }]}>
              <Ionicons name="business" size={32} color={colors.textSecondary} />
            </View>
          )}
        </View>
        <View style={styles.nearbyInfo}>
          <Text style={[styles.nearbyName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.nearbyDistance, { color: colors.textSecondary }]}>
            {formatDistance(item.distance)}
          </Text>
        </View>
        <View
          style={[
            styles.nearbyButton,
            { backgroundColor: isTooFar ? colors.border : colors.primary },
          ]}
        >
          <Text
            style={[
              styles.nearbyButtonText,
              { color: isTooFar ? colors.textSecondary : colors.onPrimary },
            ]}
            numberOfLines={1}
          >
            {isTooFar ? 'Você está muito longe' : 'Ver detalhes'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
                {(user?.name || 'U')[0].toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={[styles.greeting, { color: colors.text }]}>
                Olá, {user?.name?.split(' ')[0] || 'Usuário'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.notifButton, { backgroundColor: colors.card }]}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={[styles.searchContainer, { paddingHorizontal: spacing.lg }]}>
          <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar bares, festas, boates..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Perto de você section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { paddingHorizontal: spacing.lg }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Perto de você</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>Ver todos</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {!permissionGranted ? (
            <View style={[styles.emptyState, { marginHorizontal: spacing.lg, backgroundColor: colors.card }]}>
              <Ionicons name="location" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Localização necessária
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Permita acesso à localização para descobrir locais perto de você.
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openSettings()}
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionButtonText, { color: colors.background }]}>
                  Abrir Configurações
                </Text>
              </TouchableOpacity>
              <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                Nas configurações, selecione "Localização" e escolha "Permitir sempre" ou "Permitir ao usar o app".
              </Text>
            </View>
          ) : isLoading ? (
            <View style={[styles.loadingContainer, { marginHorizontal: spacing.lg }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Descobrindo locais próximos...
              </Text>
            </View>
          ) : error ? (
            <View style={[styles.emptyState, { marginHorizontal: spacing.lg, backgroundColor: colors.card }]}>
              <Ionicons name="alert-circle" size={48} color={colors.error} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Erro ao buscar locais
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                {error}
              </Text>
              <TouchableOpacity
                onPress={refreshVenues}
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={18} color={colors.background} style={{ marginRight: 6 }} />
                <Text style={[styles.actionButtonText, { color: colors.background }]}>
                  Tentar Novamente
                </Text>
              </TouchableOpacity>
            </View>
          ) : filteredVenues.length === 0 ? (
            <View style={[styles.emptyState, { marginHorizontal: spacing.lg, backgroundColor: colors.card }]}>
              {searchQuery.length > 0 ? (
                <>
                  <Ionicons name="search" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.text }]}>
                    Nenhum resultado para "{searchQuery}"
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                    Tente buscar por "bar", "pub" ou "restaurante".
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="map" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.text }]}>
                    Nenhum local próximo
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                    Não há bares ou restaurantes cadastrados perto de você no momento.
                  </Text>
                </>
              )}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 14 }}
              decelerationRate="fast"
              snapToInterval={220 + 14}
            >
              {filteredVenues.map((item) => (
                <View key={item.place_id}>
                  {renderNearbyCard({ item })}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Em alta section */}
        {trendingVenues.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: spacing.lg, paddingBottom: 32 }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="flame" size={20} color="#FF6B35" />
                <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 6 }]}>
                  Em alta
                </Text>
              </View>
            </View>

            <View style={styles.trendingList}>
              {trendingVenues.map((venue, index) => {
                const photoUrl = venue.photo_url || venue.photo_urls?.[0];
                return (
                  <TouchableOpacity
                    key={venue.place_id}
                    style={[styles.trendingItem, { backgroundColor: colors.card }]}
                    activeOpacity={0.7}
                    onPress={() => handleVenuePress(venue)}
                  >
                    <View style={styles.trendingLeft}>
                      <Text style={[styles.trendingRank, { color: colors.primary }]}>
                        {index + 1}
                      </Text>
                      <View style={styles.trendingInfo}>
                        <Text style={[styles.trendingName, { color: colors.text }]} numberOfLines={1}>
                          {venue.name}
                        </Text>
                        <Text style={[styles.trendingMeta, { color: colors.textSecondary }]}>
                          {venue.active_users_count > 0
                            ? `${venue.active_users_count} pessoas agora`
                            : formatDistance(venue.distance)}
                        </Text>
                      </View>
                    </View>
                    {photoUrl ? (
                      <Image source={{ uri: photoUrl }} style={styles.trendingImage} />
                    ) : (
                      <View style={[styles.trendingImage, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="business" size={18} color={colors.textSecondary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 17,
    fontWeight: '700',
  },
  notifButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Search
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  // Sections
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Nearby cards
  nearbyCard: {
    width: 220,
    borderRadius: 18,
    overflow: 'hidden',
  },
  nearbyImageContainer: {
    width: '100%',
    height: 140,
  },
  nearbyImage: {
    width: '100%',
    height: '100%',
  },
  nearbyImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  nearbyInfo: {
    padding: 12,
    gap: 4,
  },
  nearbyName: {
    fontSize: 15,
    fontWeight: '600',
  },
  nearbyDistance: {
    fontSize: 13,
  },
  nearbyButton: {
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  nearbyButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Trending
  trendingList: {
    gap: 10,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  trendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  trendingRank: {
    fontSize: 18,
    fontWeight: '800',
    width: 24,
    textAlign: 'center',
  },
  trendingInfo: {
    flex: 1,
  },
  trendingName: {
    fontSize: 15,
    fontWeight: '600',
  },
  trendingMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  trendingImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginLeft: 12,
  },
  // Empty / Loading states
  emptyState: {
    padding: 28,
    borderRadius: 18,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  helpText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  actionButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
});
