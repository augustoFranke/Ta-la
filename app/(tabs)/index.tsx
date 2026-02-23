/**
 * Tela Home — Spec 001 + 004
 * - Guest mode: loads without login, shows generic avatar + "Olá!"
 * - Venue carousel with verification-gated CTA states
 * - Trending section (top 5, last 7 days) shown only when data exists
 */

import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { useVenues, useTrending } from '../../src/hooks/useVenues';
import { useLocationStore } from '../../src/stores/locationStore';
import { useCheckIn } from '../../src/hooks/useCheckIn';
import { useProfile } from '../../src/hooks/useProfile';
import { VenueCarousel } from '../../src/components/venue/VenueCarousel';
import { CheckInModal } from '../../src/components/venue/CheckInModal';
import { Avatar } from '../../src/components/ui/Avatar';
import { useNotificationStore } from '../../src/stores/notificationStore';
import { fetchNotifications } from '../../src/services/notifications';
import type { VenueWithDistance } from '../../src/stores/venueStore';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, spacing, isDark } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { unreadCount, setNotifications } = useNotificationStore();
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

  const { trending } = useTrending();

  const { activeCheckIn, checkInToPlace, checkOut, fetchActiveCheckIn, isLoading: isCheckInLoading } = useCheckIn();
  const { primaryPhoto } = useProfile({ autoFetch: isAuthenticated });

  const [checkInVenue, setCheckInVenue] = useState<VenueWithDistance | null>(null);

  const isGuest = !isAuthenticated;
  const isVerified = user?.is_verified ?? false;

  // Bootstrap location exactly once
  const hasBootstrappedRef = useRef(false);
  useEffect(() => {
    if (!hasBootstrappedRef.current && !latitude && !longitude) {
      hasBootstrappedRef.current = true;
      bootstrap();
    }
  }, [latitude, longitude, bootstrap]);

  useEffect(() => {
    if (!isGuest) {
      fetchActiveCheckIn();
    }
  }, [fetchActiveCheckIn, isGuest]);

  // Load notifications to populate unread badge on bell icon
  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications(user.id).then(setNotifications).catch(() => {});
  }, [user?.id, setNotifications]);

  const isLoading = isVenuesLoading || isLocationLoading || !hasLocation;

  const handleGuestAction = () => {
    router.push('/(auth)/welcome');
  };

  const handleVerifyProfile = () => {
    router.push('/(auth)/onboarding/photos');
  };

  const firstName = user?.name?.split(' ')[0];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        {/* Left: greeting */}
        <Text style={[styles.greeting, { color: colors.text }]}>
          {firstName ? `Olá, ${firstName}!` : 'Olá!'}
        </Text>

        {/* Right: notification bell + profile avatar */}
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.notifButton, { backgroundColor: colors.card }]}
            onPress={() => {
              if (isGuest) {
                handleGuestAction();
              } else {
                router.push('/notifications');
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Notificações"
          >
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            {unreadCount > 0 && (
              <View style={[styles.notifBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.notifBadgeText, { color: colors.onPrimary }]}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Profile photo — tappable, navigates to Perfil tab */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            accessibilityRole="button"
            accessibilityLabel="Ver perfil"
          >
            <Avatar
              url={isAuthenticated ? primaryPhoto?.url : null}
              name={user?.name}
              size={44}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Location permission banner (non-blocking) */}
      {!permissionGranted && (
        <View style={[styles.banner, { backgroundColor: colors.card }]}>
          <Ionicons name="location-outline" size={20} color="#FF9800" />
          <Text style={[styles.bannerText, { color: colors.text }]}>
            Localização desativada. Ative para ver locais próximos.
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Near you section */}
        <Text style={[styles.sectionTitle, { color: colors.text, paddingHorizontal: spacing.lg }]}>
          Perto de você
        </Text>

        <VenueCarousel
          venues={venues}
          isLoading={isLoading}
          error={error}
          activeCheckInPlaceId={activeCheckIn?.place_id ?? null}
          onCheckIn={(v) => setCheckInVenue(v)}
          onCheckOut={async () => { await checkOut(); }}
          isGuest={isGuest}
          isVerified={isVerified}
          onGuestAction={handleGuestAction}
          onVerifyProfile={handleVerifyProfile}
        />

        {/* Trending section — only render if data exists (Spec 004) */}
        {trending.length > 0 && (
          <View style={[styles.trendingSection, { paddingHorizontal: spacing.lg }]}>
            <View style={styles.trendingHeader}>
              <Ionicons name="flame" size={22} color="#FF5722" />
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                Trending
              </Text>
            </View>

            {trending.map((item) => (
              <View
                key={item.venue_id}
                style={[styles.trendingItem, { backgroundColor: colors.card }]}
              >
                <Text style={[styles.trendingRank, { color: colors.primary }]}>
                  #{item.rank}
                </Text>

                {item.photo_url ? (
                  <Image
                    source={{ uri: item.photo_url }}
                    style={styles.trendingPhoto}
                  />
                ) : (
                  <View style={[styles.trendingPhoto, { backgroundColor: colors.border }]}>
                    <Ionicons name="business" size={18} color={colors.textSecondary} />
                  </View>
                )}

                <View style={styles.trendingInfo}>
                  <Text style={[styles.trendingName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.trendingCount, { color: colors.textSecondary }]}>
                    {item.per_day} / dia
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
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
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  trendingSection: {
    marginTop: 24,
    gap: 10,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  trendingRank: {
    fontSize: 16,
    fontWeight: '800',
    width: 28,
    textAlign: 'center',
  },
  trendingPhoto: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  trendingInfo: {
    flex: 1,
    gap: 2,
  },
  trendingName: {
    fontSize: 15,
    fontWeight: '600',
  },
  trendingCount: {
    fontSize: 13,
  },
});
