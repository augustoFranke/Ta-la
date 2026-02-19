/**
 * Tela Home
 * Header com avatar + saudação, vertical list of VenueCards, skeleton loading, empty state, location banner
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { useVenues } from '../../src/hooks/useVenues';
import { useLocationStore } from '../../src/stores/locationStore';
import { useCheckIn } from '../../src/hooks/useCheckIn';
import { VenueCard } from '../../src/components/venue/VenueCard';
import { VenueCardSkeleton } from '../../src/components/venue/VenueCardSkeleton';
import { CheckInModal } from '../../src/components/venue/CheckInModal';
import type { VenueWithDistance } from '../../src/stores/venueStore';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 32; // 16px margin each side

export default function HomeScreen() {
  const { colors, spacing, isDark } = useTheme();
  const { user } = useAuth();
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
  } = useVenues({ autoFetch: true });

  const { activeCheckIn, checkInToPlace, checkOut, fetchActiveCheckIn, isLoading: isCheckInLoading } = useCheckIn();

  const [checkInVenue, setCheckInVenue] = useState<VenueWithDistance | null>(null);

  useEffect(() => {
    if (!latitude || !longitude) {
      bootstrap();
    }
  }, [latitude, longitude, bootstrap]);

  useEffect(() => {
    fetchActiveCheckIn();
  }, []);

  const isLoading = isVenuesLoading || isLocationLoading || !hasLocation;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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

        {/* Location error banner (non-blocking) */}
        {(!permissionGranted || error) && (
          <View style={[styles.banner, { backgroundColor: colors.card }]}>
            <Ionicons name="alert-circle-outline" size={20} color="#FF9800" />
            <Text style={[styles.bannerText, { color: colors.text }]}>
              {!permissionGranted
                ? 'Localização desativada. Ative para ver locais próximos.'
                : error}
            </Text>
          </View>
        )}

        {/* Venue list area */}
        <View style={styles.listContainer}>
          {isLoading ? (
            // Skeleton loading state
            <>
              <VenueCardSkeleton cardWidth={CARD_WIDTH} />
              <VenueCardSkeleton cardWidth={CARD_WIDTH} />
              <VenueCardSkeleton cardWidth={CARD_WIDTH} />
            </>
          ) : venues.length === 0 && !error ? (
            // Empty state
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Nenhum lugar encontrado por aqui
              </Text>
            </View>
          ) : (
            // Venue cards
            venues.map((venue) => (
              <VenueCard
                key={venue.place_id}
                venue={venue}
                cardWidth={CARD_WIDTH}
                activeCheckInPlaceId={activeCheckIn?.place_id ?? null}
                onCheckIn={(v) => setCheckInVenue(v)}
                onCheckOut={async () => { await checkOut(); }}
              />
            ))
          )}
        </View>
      </ScrollView>

      <CheckInModal
        visible={checkInVenue !== null}
        venue={checkInVenue}
        onConfirm={async () => {
          if (!checkInVenue) return;
          const result = await checkInToPlace({
            place_id: checkInVenue.place_id,
            name: checkInVenue.name,
            address: checkInVenue.address || '',
            latitude: checkInVenue.latitude,
            longitude: checkInVenue.longitude,
            types: checkInVenue.types ?? [checkInVenue.type],
            photo_url: checkInVenue.photo_url || null,
            rating: checkInVenue.rating ?? null,
            open_to_meeting: false,
            visibility: 'public',
          });
          if (result.success) {
            setCheckInVenue(null);
          } else {
            Alert.alert('Erro', result.error || 'Nao foi possivel fazer check-in.');
          }
        }}
        onCancel={() => setCheckInVenue(null)}
        isLoading={isCheckInLoading}
      />
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
  scrollContent: {
    paddingBottom: 32,
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
  // Location error banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  // Venue list
  listContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
