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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import type { VenueWithDistance } from '../../stores/venueStore';

const HERO_HEIGHT = 208;

interface VenueCardProps {
  venue: VenueWithDistance;
  cardWidth?: number;
  activeCheckInPlaceId?: string | null;
  onCheckIn?: (venue: VenueWithDistance) => void;
  onCheckOut?: (venue: VenueWithDistance) => void;
  /** True when the user is not authenticated (guest mode) */
  isGuest?: boolean;
  /** True when the user's profile is verified (spec 003) */
  isVerified?: boolean;
  /** Called when a guest attempts a restricted action — route to account creation */
  onGuestAction?: () => void;
  /** Called when an unverified user taps check-in — route to verification wizard */
  onVerifyProfile?: () => void;
}

export function VenueCard({
  venue,
  cardWidth,
  activeCheckInPlaceId,
  onCheckIn,
  onCheckOut,
  isGuest = false,
  isVerified = false,
  onGuestAction,
  onVerifyProfile,
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

  // CTA state logic (Spec 003 + 004):
  // 1. Already checked in → "Sair"
  // 2. Too far → "Você está longe" (disabled)
  // 3. In range + guest → "Fazer check-in" (routes to account creation)
  // 4. In range + unverified → "Verificar perfil para fazer check-in" (routes to wizard)
  // 5. In range + verified → "Fazer check-in"
  const isInRange = !isTooFar;
  const needsVerification = isInRange && !isGuest && !isVerified;

  const handleButtonPress = () => {
    if (isAlreadyCheckedIn) {
      onCheckOut?.(venue);
    } else if (isInRange) {
      if (isGuest) {
        onGuestAction?.();
      } else if (!isVerified) {
        onVerifyProfile?.();
      } else {
        onCheckIn?.(venue);
      }
    }
  };

  const buttonLabel = isAlreadyCheckedIn
    ? 'Sair'
    : isTooFar
    ? 'Você está longe'
    : needsVerification
    ? 'Verificar perfil para fazer check-in'
    : 'Fazer check-in';

  const buttonBackground = isAlreadyCheckedIn
    ? colors.error
    : isTooFar
    ? colors.border
    : needsVerification
    ? colors.card
    : colors.primary;

  const buttonTextColor = isAlreadyCheckedIn
    ? '#fff'
    : isTooFar
    ? colors.textSecondary
    : needsVerification
    ? colors.primary
    : colors.onPrimary;

  const buttonBorderColor = needsVerification ? colors.primary : 'transparent';

  const heroHeight = HERO_HEIGHT;

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
    <View style={[styles.container, { width: cardWidth, backgroundColor: colors.card }]}>
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
          style={[styles.checkInButton, { backgroundColor: buttonBackground, borderColor: buttonBorderColor, borderWidth: needsVerification ? 1.5 : 0 }]}
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
    borderRadius: 24,
    overflow: 'hidden',
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 6,
  },
  venueName: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
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
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  checkInButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
