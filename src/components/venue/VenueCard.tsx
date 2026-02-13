/**
 * VenueCard Component
 * Displays a venue with photo, info, and details button
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { getVenueTypeLabel, formatDistance } from '../../services/places';
import type { VenueWithDistance } from '../../stores/venueStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const CARD_WIDTH = SCREEN_WIDTH - 48; // 24px padding on each side
export const CARD_HEIGHT = 280;

interface VenueCardProps {
  venue: VenueWithDistance;
  cardWidth?: number;
  onPress?: (venue: VenueWithDistance) => void;
}

export function VenueCard({ venue, cardWidth, onPress }: VenueCardProps) {
  const { colors } = useTheme();
  const [heroPhotoIndex, setHeroPhotoIndex] = useState(0);
  const photoUrls = Array.isArray(venue.photo_urls) ? venue.photo_urls.filter(Boolean) : [];
  const fallbackPhotoUrls = venue.photo_url ? [venue.photo_url] : [];
  const availablePhotos = photoUrls.length > 0 ? photoUrls : fallbackPhotoUrls;
  const heroPhotoUrl = heroPhotoIndex >= 0 ? availablePhotos[heroPhotoIndex] : undefined;
  const openStatus = venue.open_now == null
    ? null
    : {
        label: venue.open_now ? 'Aberto agora' : 'Fechado',
        color: venue.open_now ? '#1b6b2b' : '#7a1b1b',
      };
  const distanceMeters = venue.distance * 1000;
  const isTooFar = distanceMeters > 50;

  const renderRatingStars = (rating: number | null) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      const name = i < fullStars || (i === fullStars && hasHalfStar)
        ? 'star'
        : 'star-outline';
      stars.push(<Ionicons key={`star-${i}`} name={name} size={14} color="#FFD700" />);
    }

    return (
      <View style={styles.ratingContainer}>
        <View style={styles.ratingStars}>{stars}</View>
        <Text style={styles.ratingNumber}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  const handlePress = () => {
    onPress?.(venue);
  };

  useEffect(() => {
    setHeroPhotoIndex(0);
  }, [venue.place_id]);

  const handleHeroImageError = useCallback(() => {
    setHeroPhotoIndex((currentIndex) => {
      const nextIndex = currentIndex + 1;
      return nextIndex < availablePhotos.length ? nextIndex : -1;
    });
  }, [availablePhotos.length]);

  const renderMedia = () => {
    const content = (
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      >
        {/* Top badges */}
        <View style={styles.topRow}>
          <View style={styles.badgeGroup}>
            <View style={[styles.typeBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.typeBadgeText, { color: colors.onPrimary }]}>
                {getVenueTypeLabel(venue.type)}
              </Text>
            </View>

            {openStatus && (
              <View style={[styles.statusBadge, { backgroundColor: openStatus.color }]}>
                <Text style={styles.statusText}>{openStatus.label}</Text>
              </View>
            )}
          </View>

          <View style={styles.rightBadges}>
            {venue.active_users_count > 0 && (
              <View style={[styles.activeUsersBadge, { backgroundColor: colors.success }]}>
                <View style={styles.activeUsersContent}>
                  <Ionicons name="people" size={14} color="#fff" />
                  <Text style={styles.activeUsersText}>{venue.active_users_count}</Text>
                </View>
              </View>
            )}

            {(venue.open_to_meeting_count ?? 0) > 0 && (
              <View style={styles.openToMeetingBadge}>
                <View style={styles.activeUsersContent}>
                  <Ionicons name="heart" size={14} color="#fff" />
                  <Text style={styles.activeUsersText}>{venue.open_to_meeting_count}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Bottom content */}
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={2}>
            {venue.name}
          </Text>

          <View style={styles.infoRow}>
            {renderRatingStars(venue.rating)}
            <View style={styles.distanceRow}>
              <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.distance}>{formatDistance(venue.distance)}</Text>
            </View>
          </View>

          <Text style={styles.address} numberOfLines={1}>
            {venue.address}
          </Text>

          <TouchableOpacity
            style={[
              styles.detailsButton,
              { backgroundColor: isTooFar ? colors.border : colors.primary },
            ]}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.detailsButtonText,
                { color: isTooFar ? colors.textSecondary : colors.onPrimary },
              ]}
            >
              {isTooFar ? 'Você está muito longe' : 'Ver detalhes'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );

    if (heroPhotoUrl) {
      return (
        <ImageBackground
          source={{ uri: heroPhotoUrl }}
          style={styles.imageBackground}
          imageStyle={styles.image}
          onError={handleHeroImageError}
        >
          {content}
        </ImageBackground>
      );
    }

    return (
      <View style={[styles.imageBackground, { backgroundColor: colors.card }]}>
        {content}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.container, { width: cardWidth ?? CARD_WIDTH }]}
      onPress={handlePress}
      activeOpacity={0.95}
    >
      {renderMedia()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  imageBackground: {
    flex: 1,
  },
  image: {
    borderRadius: 24,
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  rightBadges: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  activeUsersBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeUsersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeUsersText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  openToMeetingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e91e63',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    gap: 8,
  },
  name: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  distance: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  address: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 4,
  },
  detailsButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  detailsButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
