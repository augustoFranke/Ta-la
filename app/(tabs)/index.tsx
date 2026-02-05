/**
 * Tela Home
 * Check-in ativo + venues próximos
 */

import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { useVenues } from '../../src/hooks/useVenues';
import { useLocationStore } from '../../src/stores/locationStore';
import { useVenueStore, type VenueWithDistance } from '../../src/stores/venueStore';
import { VenueCarousel } from '../../src/components/venue';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, spacing, typography, isDark } = useTheme();
  const { user } = useAuth();
  const { setSelectedVenue } = useVenueStore();
  const {
    latitude,
    longitude,
    permissionGranted,
    errorMsg,
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

  useEffect(() => {
    if (!latitude || !longitude) {
      bootstrap();
    }
  }, [latitude, longitude, bootstrap]);

  // Get top 3 venues sorted by nightlife_score for "Em alta" section
  const trendingVenues = useMemo(() => {
    if (!venues || venues.length === 0) return [];
    
    // Sort by nightlife_score (descending), then by active_users_count
    return [...venues]
      .sort((a, b) => {
        const scoreA = (a as any).nightlife_score ?? 0;
        const scoreB = (b as any).nightlife_score ?? 0;
        
        // Primary sort by nightlife score
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        
        // Secondary sort by active users
        return (b.active_users_count ?? 0) - (a.active_users_count ?? 0);
      })
      .slice(0, 3);
  }, [venues]);

  const handleVenuePress = (venue: VenueWithDistance) => {
    setSelectedVenue(venue);
    router.push(`/venue/${venue.place_id}`);
  };

  const getSubtitle = () => {
    if (!permissionGranted) {
      return 'Permita acesso à localização para ver locais próximos';
    }
    if (errorMsg) {
      return errorMsg;
    }
    if (isLocationLoading || !hasLocation) {
      return 'Obtendo sua localização...';
    }
    if (isVenuesLoading) {
      return 'Buscando locais próximos...';
    }
    if (venues.length === 0) {
      return 'Nenhum local encontrado por perto';
    }
    return `${venues.length} locais encontrados perto de você`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { padding: spacing.lg }]}>
        <Text style={[styles.greeting, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
          Olá, {user?.name?.split(' ')[0] || 'Usuário'}!
        </Text>
        <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xl }]}>
          Rolês recomendados
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.sm }]}>
          {getSubtitle()}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Venue Carousel */}
        <View style={styles.carouselContainer}>
          {!permissionGranted ? (
            <View style={[styles.permissionContainer, { backgroundColor: colors.card }]}>
              <Ionicons
                name="location"
                size={48}
                color={colors.textSecondary}
                style={styles.permissionIcon}
              />
              <Text style={[styles.permissionText, { color: colors.text }]}>
                Localização necessária
              </Text>
              <Text style={[styles.permissionSubtext, { color: colors.textSecondary }]}>
                Para ver bares e baladas perto de você, permita o acesso à sua localização nas configurações do app.
              </Text>
            </View>
          ) : (
            <VenueCarousel
              venues={venues}
              isLoading={isVenuesLoading || isLocationLoading || !hasLocation}
              error={error}
              onVenuePress={handleVenuePress}
              onRetry={refreshVenues}
            />
          )}
        </View>

        {/* Trending Places - Ranked by Nightlife Score */}
        {trendingVenues.length > 0 && (
          <View style={[styles.trendingSection, { paddingHorizontal: spacing.lg }]}>
            <View style={styles.trendingHeader}>
              <Ionicons name="flame" size={20} color="#FF6B35" />
              <Text style={[styles.trendingTitle, { color: colors.text, marginLeft: spacing.xs }]}>
                Em alta
              </Text>
            </View>

            <View style={styles.trendingList}>
              {trendingVenues.map((venue, index) => (
                <TouchableOpacity
                  key={venue.place_id}
                  style={[styles.trendingItem, { backgroundColor: colors.card }]}
                  activeOpacity={0.7}
                  onPress={() => handleVenuePress(venue)}
                >
                  <View style={styles.trendingImageContainer}>
                    <Image 
                      source={{ uri: venue.photo_url || 'https://via.placeholder.com/100x100.png?text=Venue' }} 
                      style={styles.trendingImage} 
                    />
                    <View style={[styles.trendingRank, { backgroundColor: colors.primary }]}>
                      <Text style={styles.rankNumber}>
                        {index + 1}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.trendingInfo}>
                    <Text style={[styles.trendingName, { color: colors.text }]} numberOfLines={1}>
                      {venue.name}
                    </Text>
                    <Text style={[styles.trendingUsers, { color: colors.textSecondary }]}>
                      {venue.active_users_count > 0 
                        ? `${venue.active_users_count} pessoas agora`
                        : `Score: ${(venue as any).nightlife_score ?? '-'}`
                      }
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
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
  header: {
    paddingBottom: 8,
  },
  greeting: {
    marginBottom: 4,
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  carouselContainer: {
    minHeight: 280,
  },
  permissionContainer: {
    flex: 1,
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionIcon: {
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  trendingSection: {
    paddingTop: 24,
    paddingBottom: 32,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendingTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  trendingList: {
    gap: 10,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  trendingImageContainer: {
    position: 'relative',
  },
  trendingImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  trendingRank: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
  },
  trendingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trendingName: {
    fontSize: 16,
    fontWeight: '600',
  },
  trendingUsers: {
    fontSize: 13,
    marginTop: 2,
  },
});
