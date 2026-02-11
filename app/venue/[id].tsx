/**
 * Venue Details Page
 * Full-screen venue page with image slider and details
 */

import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/theme';
import { useVenueStore } from '../../src/stores/venueStore';
import type { VenueWithDistance } from '../../src/stores/venueStore';
import { getVenueTypeLabel, formatDistance, fetchPlacePhotos } from '../../src/services/places';
import { CheckInModal } from '../../src/components/venue/CheckInModal';
import { useCheckIn } from '../../src/hooks/useCheckIn';
import { useAuth } from '../../src/hooks/useAuth';
import { supabase } from '../../src/services/supabase';
import type { CheckInVisibility } from '../../src/types/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 320;

export default function VenueDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const { selectedVenue: venue } = useVenueStore();
  const { checkInToPlace, isLoading: isCheckInLoading } = useCheckIn();
  const { user } = useAuth();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [isCheckInModalVisible, setCheckInModalVisible] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isLoadingVenue, setIsLoadingVenue] = useState(false);
  const [fetchedPhotos, setFetchedPhotos] = useState<string[]>([]);

  // Deep link support: fetch venue from DB when store is empty but id param is present
  useEffect(() => {
    if (venue || !id) return;

    let cancelled = false;
    const fetchVenueByPlaceId = async () => {
      setIsLoadingVenue(true);
      try {
        const { data, error } = await supabase
          .from('venues')
          .select('*')
          .eq('google_place_id', id)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          Alert.alert('Erro', 'Nao foi possivel carregar o local.');
          router.back();
          return;
        }

        if (!data) {
          Alert.alert('Local nao encontrado', 'Este local nao esta cadastrado no app.');
          router.back();
          return;
        }

        const mappedVenue: VenueWithDistance = {
          id: data.id,
          place_id: data.google_place_id,
          name: data.name,
          address: data.address ?? '',
          latitude: data.latitude,
          longitude: data.longitude,
          type: data.type ?? '',
          photo_url: data.photo_url ?? null,
          photo_urls: data.photo_urls ?? [],
          rating: data.rating ?? null,
          price_level: data.price_level ?? null,
          open_now: data.open_now ?? null,
          active_users_count: 0,
          cached_at: data.cached_at ?? new Date().toISOString(),
          created_at: data.created_at ?? new Date().toISOString(),
          distance: 0,
        };

        useVenueStore.getState().setSelectedVenue(mappedVenue);
      } catch {
        if (!cancelled) {
          Alert.alert('Erro', 'Nao foi possivel carregar o local.');
          router.back();
        }
      } finally {
        if (!cancelled) {
          setIsLoadingVenue(false);
        }
      }
    };

    fetchVenueByPlaceId();
    return () => { cancelled = true; };
  }, [id, venue]);

  // Fetch photos from Foursquare when venue is available
  useEffect(() => {
    if (!venue?.place_id) return;
    let cancelled = false;
    fetchPlacePhotos(venue.place_id).then((urls) => {
      if (!cancelled && urls.length > 0) {
        setFetchedPhotos(urls);
      }
    });
    return () => { cancelled = true; };
  }, [venue?.place_id]);

  // No venue, not loading, no deep link id - go back
  if (!venue && !isLoadingVenue && !id) {
    router.back();
    return null;
  }

  // Loading venue from deep link
  if (!venue && (isLoadingVenue || id)) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.backButtonContainer} edges={['top']}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </SafeAreaView>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Carregando local...
        </Text>
      </View>
    );
  }

  // At this point venue is guaranteed to exist
  if (!venue) return null;

  const photoUrls = Array.isArray(venue.photo_urls) ? venue.photo_urls.filter(Boolean) : [];
  const fallbackPhotoUrls = venue.photo_url ? [venue.photo_url] : [];
  const storePhotos = photoUrls.length > 0 ? photoUrls : fallbackPhotoUrls;
  // Merge store photos with fetched photos, deduplicating by URL
  const availablePhotos = Array.from(new Set([...storePhotos, ...fetchedPhotos]));

  const openStatus = venue.open_now == null
    ? null
    : {
        label: venue.open_now ? 'Aberto agora' : 'Fechado',
        color: venue.open_now ? colors.success : colors.error,
      };

  const distanceMeters = venue.distance * 1000;
  const isDistanceWarning = distanceMeters > 100;

  const fetchFavoriteStatus = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('user_favorite_places')
        .select('id')
        .eq('user_id', user.id)
        .eq('place_id', venue.place_id)
        .maybeSingle();

      if (error) return;
      setIsFavorite(Boolean(data));
    } catch {
      setIsFavorite(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user?.id || isFavoriteLoading) return;
    setIsFavoriteLoading(true);
    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('user_favorite_places')
          .delete()
          .eq('user_id', user.id)
          .eq('place_id', venue.place_id);
        if (error) throw error;
        setIsFavorite(false);
      } else {
        const { error } = await supabase
          .from('user_favorite_places')
          .insert({
            user_id: user.id,
            place_id: venue.place_id,
            name: venue.name,
            address: venue.address || null,
            photo_url: venue.photo_url || null,
          });
        if (error) throw error;
        setIsFavorite(true);
      }
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Não foi possível atualizar favoritos.');
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  useEffect(() => {
    fetchFavoriteStatus();
  }, [venue.place_id, user?.id]);

  const handleCheckIn = () => {
    setCheckInModalVisible(true);
  };

  const handleConfirmCheckIn = async (openToMeeting: boolean, visibility: CheckInVisibility) => {
    const result = await checkInToPlace({
      place_id: venue.place_id,
      name: venue.name,
      address: venue.address || '',
      latitude: venue.latitude,
      longitude: venue.longitude,
      types: venue.types ?? [venue.type],
      photo_url: venue.photo_url || null,
      rating: venue.rating ?? null,
      open_to_meeting: openToMeeting,
      visibility,
    });

    if (result.success) {
      setCheckInModalVisible(false);
      Alert.alert(
        'Check-in realizado!',
        `Você está em ${venue.name}. Quer ver quem está por perto agora?`,
        [
          { text: 'Depois', onPress: () => router.back() },
          { text: 'Ver pessoas', onPress: () => router.replace('/(tabs)/discover') },
        ]
      );
      return;
    }

    Alert.alert('Check-in recusado', result.error || 'Nao foi possivel fazer check-in.');
  };

  const handleImageScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveImageIndex(slideIndex);
  };

  const renderImageItem = ({ item }: { item: string }) => (
    <Image source={{ uri: item }} style={styles.sliderImage} resizeMode="cover" />
  );

  const renderRatingStars = (rating: number | null) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      const name = i < fullStars || (i === fullStars && hasHalfStar)
        ? 'star'
        : 'star-outline';
      stars.push(<Ionicons key={`star-${i}`} name={name} size={16} color="#FFD700" />);
    }

    return (
      <View style={styles.ratingContainer}>
        <View style={styles.ratingStars}>{stars}</View>
        <Text style={[styles.ratingNumber, { color: colors.text }]}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <ScrollView style={styles.scrollView} bounces={false}>
        {/* Image Slider */}
        <View style={styles.imageSliderContainer}>
          {availablePhotos.length > 0 ? (
            <FlatList
              ref={flatListRef}
              data={availablePhotos}
              renderItem={renderImageItem}
              keyExtractor={(_, index) => `photo-${index}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleImageScroll}
              scrollEventThrottle={16}
            />
          ) : (
            <View style={[styles.sliderImage, { backgroundColor: colors.card }]}>
              <Ionicons name="image-outline" size={64} color={colors.textSecondary} />
            </View>
          )}

          {/* Gradient overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.6)']}
            locations={[0, 0.3, 1]}
            style={styles.imageGradient}
            pointerEvents="none"
          />

          {/* Back button */}
          <SafeAreaView style={styles.backButtonContainer} edges={['top']}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Pagination dots */}
          {availablePhotos.length > 1 && (
            <View style={styles.pagination}>
              {availablePhotos.map((_, index) => (
                <View
                  key={`dot-${index}`}
                  style={[
                    styles.paginationDot,
                    {
                      backgroundColor: index === activeImageIndex ? '#fff' : 'rgba(255,255,255,0.4)',
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Content */}
        <View style={[styles.content, { padding: spacing.lg }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={[styles.name, { color: colors.text }]}>{venue.name}</Text>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={toggleFavorite}
                disabled={isFavoriteLoading}
              >
                <Ionicons
                  name={isFavorite ? 'star' : 'star-outline'}
                  size={22}
                  color={isFavorite ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.badgeRow}>
              <View style={[styles.typeBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.typeBadgeText, { color: colors.onPrimary }]}>
                  {getVenueTypeLabel(venue.type)}
                </Text>
              </View>
              {openStatus && (
                <View style={[styles.statusBadge, { borderColor: openStatus.color }]}>
                  <Text style={[styles.statusText, { color: openStatus.color }]}>
                    {openStatus.label}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            {renderRatingStars(venue.rating)}

            <View style={styles.infoRow}>
              <Ionicons name="location" size={18} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {formatDistance(venue.distance)}
              </Text>
            </View>

            {venue.address && (
              <View style={styles.infoRow}>
                <Ionicons name="navigate" size={18} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  {venue.address}
                </Text>
              </View>
            )}
          </View>

          {/* Stats */}
          {(venue.active_users_count > 0 || (venue.open_to_meeting_count ?? 0) > 0) && (
            <View style={styles.statsSection}>
              {venue.active_users_count > 0 && (
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <Ionicons name="people" size={24} color={colors.primary} />
                  <Text style={[styles.statNumber, { color: colors.text }]}>
                    {venue.active_users_count}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    pessoas aqui
                  </Text>
                </View>
              )}
              {(venue.open_to_meeting_count ?? 0) > 0 && (
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <Ionicons name="heart" size={24} color="#e91e63" />
                  <Text style={[styles.statNumber, { color: colors.text }]}>
                    {venue.open_to_meeting_count}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    disponíveis
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <SafeAreaView edges={['bottom']} style={[styles.bottomAction, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[
            styles.checkInButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={handleCheckIn}
          disabled={isCheckInLoading}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle" size={22} color={colors.onPrimary} />
          <Text style={[styles.checkInButtonText, { color: colors.onPrimary }]}>
            Fazer check-in
          </Text>
        </TouchableOpacity>
        {isDistanceWarning ? (
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Voce parece estar longe deste local ({formatDistance(venue.distance)}).
          </Text>
        ) : null}
      </SafeAreaView>

      <CheckInModal
        visible={isCheckInModalVisible}
        venue={venue}
        onConfirm={handleConfirmCheckIn}
        onCancel={() => setCheckInModalVisible(false)}
        isLoading={isCheckInLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  imageSliderContainer: {
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  sliderImage: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagination: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    gap: 24,
  },
  header: {
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  favoriteButton: {
    padding: 6,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoSection: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingNumber: {
    fontSize: 15,
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 6,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  bottomAction: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  helperText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
  },
  checkInButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
