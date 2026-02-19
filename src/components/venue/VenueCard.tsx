/**
 * VenueCard Component
 * Full-width hero photo, venue name + distance below, check-in button at bottom.
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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import type { VenueWithDistance } from '../../stores/venueStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const CARD_WIDTH = SCREEN_WIDTH - 48; // 24px padding on each side
export const CARD_HEIGHT = 320;

interface VenueCardProps {
  venue: VenueWithDistance;
  cardWidth?: number;
  activeCheckInPlaceId?: string | null;
  onCheckIn?: (venue: VenueWithDistance) => void;
  onCheckOut?: (venue: VenueWithDistance) => void;
}

export function VenueCard({
  venue,
  cardWidth,
  activeCheckInPlaceId,
  onCheckIn,
  onCheckOut,
}: VenueCardProps) {
  const { colors } = useTheme();
  const [heroPhotoIndex, setHeroPhotoIndex] = useState(0);

  const photoUrls = Array.isArray(venue.photo_urls) ? venue.photo_urls.filter(Boolean) : [];
  const fallbackPhotoUrls = venue.photo_url ? [venue.photo_url] : [];
  const availablePhotos = photoUrls.length > 0 ? photoUrls : fallbackPhotoUrls;
  const heroPhotoUrl = heroPhotoIndex >= 0 ? availablePhotos[heroPhotoIndex] : undefined;

  const distanceMeters = venue.distance * 1000;
  const isAlreadyCheckedIn = activeCheckInPlaceId === venue.place_id;
  const isTooFar = !isAlreadyCheckedIn && distanceMeters > 10;
  const showDistance = distanceMeters < 500;

  useEffect(() => {
    setHeroPhotoIndex(0);
  }, [venue.place_id]);

  const handleHeroImageError = useCallback(() => {
    setHeroPhotoIndex((currentIndex) => {
      const nextIndex = currentIndex + 1;
      return nextIndex < availablePhotos.length ? nextIndex : -1;
    });
  }, [availablePhotos.length]);

  const handleButtonPress = () => {
    if (isAlreadyCheckedIn) {
      onCheckOut?.(venue);
    } else if (!isTooFar) {
      onCheckIn?.(venue);
    }
  };

  const buttonLabel = isAlreadyCheckedIn
    ? 'Sair'
    : isTooFar
    ? 'Você está longe'
    : 'Fazer check-in';

  const buttonBackground = isAlreadyCheckedIn
    ? colors.error
    : isTooFar
    ? colors.border
    : colors.primary;

  const buttonTextColor = isAlreadyCheckedIn
    ? '#fff'
    : isTooFar
    ? colors.textSecondary
    : colors.onPrimary;

  const heroHeight = Math.round(CARD_HEIGHT * 0.65);

  const heroContent = (
    <View style={{ height: heroHeight }}>
      {/* Top-right badges */}
      <View style={styles.topRightBadges}>
        {venue.active_users_count > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.success }]}>
            <Ionicons name="people" size={13} color="#fff" />
            <Text style={styles.badgeText}>{venue.active_users_count}</Text>
          </View>
        )}
        {(venue.open_to_meeting_count ?? 0) > 0 && (
          <View style={[styles.badge, { backgroundColor: '#e91e63' }]}>
            <Ionicons name="heart" size={13} color="#fff" />
            <Text style={styles.badgeText}>{venue.open_to_meeting_count}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { width: cardWidth ?? CARD_WIDTH }]}>
      {/* Hero photo — top 65% */}
      {heroPhotoUrl ? (
        <ImageBackground
          source={{ uri: heroPhotoUrl }}
          style={{ height: heroHeight, width: '100%' }}
          imageStyle={styles.heroImage}
          onError={handleHeroImageError}
        >
          {heroContent}
        </ImageBackground>
      ) : (
        <View style={[{ height: heroHeight, width: '100%', backgroundColor: colors.card }, styles.heroFallback]}>
          {heroContent}
        </View>
      )}

      {/* Bottom content area */}
      <View style={[styles.bottomContent, { backgroundColor: colors.card }]}>
        <Text style={[styles.venueName, { color: colors.text }]} numberOfLines={2}>
          {venue.name}
        </Text>

        {showDistance && (
          <View style={styles.distanceRow}>
            <Ionicons name="location" size={14} color={colors.textSecondary} />
            <Text style={[styles.distanceText, { color: colors.textSecondary }]}>
              {Math.round(distanceMeters)}m
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.checkInButton, { backgroundColor: buttonBackground }]}
          onPress={handleButtonPress}
          disabled={isTooFar}
          activeOpacity={0.8}
        >
          <Text style={[styles.checkInButtonText, { color: buttonTextColor }]}>
            {buttonLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  heroImage: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  heroFallback: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  topRightBadges: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 6,
  },
  venueName: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 13,
  },
  checkInButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  checkInButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
