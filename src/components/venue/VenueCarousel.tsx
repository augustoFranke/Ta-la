/**
 * VenueCarousel Component
 * Horizontal carousel of venue cards with Instagram-style pagination dots
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  LayoutChangeEvent,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { VenueCard } from './VenueCard';
import { VenueCardSkeleton } from './VenueCardSkeleton';
import type { VenueWithDistance } from '../../stores/venueStore';

const LIST_HORIZONTAL_PADDING = 24;
const CARD_SPACING = 16;
const MAX_VISIBLE_DOTS = 8;

// Dot sizing
const DOT_SIZE = 8;
const DOT_SIZE_SMALL = 6;
const DOT_SIZE_TINY = 4;
const DOT_GAP = 6;

interface VenueCarouselProps {
  venues: VenueWithDistance[];
  isLoading?: boolean;
  error?: string | null;
  activeCheckInPlaceId?: string | null;
  onCheckIn?: (venue: VenueWithDistance) => void;
  onCheckOut?: (venue: VenueWithDistance) => void;
  onRetry?: () => void;
}

export function VenueCarousel({
  venues,
  isLoading = false,
  error = null,
  activeCheckInPlaceId,
  onCheckIn,
  onCheckOut,
  onRetry,
}: VenueCarouselProps) {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const availableWidth = containerWidth ?? windowWidth;
  const cardWidth = Math.max(0, availableWidth - LIST_HORIZONTAL_PADDING * 2);
  const resolvedCardWidth = cardWidth > 0 ? cardWidth : Math.max(1, availableWidth);
  const snapInterval = Math.max(1, resolvedCardWidth + CARD_SPACING);

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  // Handle scroll to update current index
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / snapInterval);
      const clampedIndex = Math.max(0, Math.min(newIndex, venues.length - 1));
      if (clampedIndex !== currentIndex) {
        setCurrentIndex(clampedIndex);
      }
    },
    [currentIndex, snapInterval, venues.length]
  );

  // Animate dot strip translation when index changes
  useEffect(() => {
    if (venues.length <= MAX_VISIBLE_DOTS) return;

    const totalDots = venues.length;
    const dotTotalWidth = DOT_SIZE + DOT_GAP;
    const centerOffset = Math.floor(MAX_VISIBLE_DOTS / 2);
    const maxStartIdx = totalDots - MAX_VISIBLE_DOTS;

    // Calculate which dot should be at the left edge of visible area
    let startIdx = currentIndex - centerOffset;
    startIdx = Math.max(0, Math.min(startIdx, maxStartIdx));

    const newTranslateX = -startIdx * dotTotalWidth;

    Animated.timing(translateXAnim, {
      toValue: newTranslateX,
      useNativeDriver: true,
      duration: 150,
    }).start();
  }, [currentIndex, venues.length, translateXAnim]);

  const renderVenueCard = useCallback(
    ({ item }: { item: VenueWithDistance }) => (
      <View style={styles.cardContainer}>
        <VenueCard
          venue={item}
          cardWidth={resolvedCardWidth}
          activeCheckInPlaceId={activeCheckInPlaceId}
          onCheckIn={onCheckIn}
          onCheckOut={onCheckOut}
        />
      </View>
    ),
    [resolvedCardWidth, activeCheckInPlaceId, onCheckIn, onCheckOut]
  );

  const renderPaginationDots = () => {
    if (venues.length <= 1) return null;

    const totalDots = venues.length;

    // Simple case: all dots fit without sliding
    if (totalDots <= MAX_VISIBLE_DOTS) {
      return (
        <View style={styles.pagination}>
          {venues.map((_, index) => {
            const isActive = index === currentIndex;
            return (
              <View
                key={`dot-${index}`}
                style={[
                  styles.dot,
                  {
                    width: DOT_SIZE,
                    height: DOT_SIZE,
                    backgroundColor: isActive ? colors.primary : colors.border,
                    opacity: isActive ? 1 : 0.4,
                  },
                ]}
              />
            );
          })}
        </View>
      );
    }

    // Instagram-style sliding dots
    const dotTotalWidth = DOT_SIZE + DOT_GAP;
    const centerOffset = Math.floor(MAX_VISIBLE_DOTS / 2);
    const maxStartIdx = totalDots - MAX_VISIBLE_DOTS;

    // Calculate visible window
    let visibleStart = currentIndex - centerOffset;
    visibleStart = Math.max(0, Math.min(visibleStart, maxStartIdx));
    const visibleEnd = visibleStart + MAX_VISIBLE_DOTS - 1;

    // Width of the visible area
    // Use full width for all dots including gap prevents clipping
    const visibleAreaWidth = MAX_VISIBLE_DOTS * dotTotalWidth;

    return (
      <View style={[styles.paginationContainer, { width: visibleAreaWidth }]}>
        <Animated.View
          style={[
            styles.paginationSlider,
            { transform: [{ translateX: translateXAnim }] },
          ]}
        >
          {venues.map((_, index) => {
            const isActive = index === currentIndex;
            const distanceFromActive = Math.abs(index - currentIndex);

            // Determine dot size based on position
            // Active dot and adjacent are normal size
            // Edge dots (2 away) are smaller
            // Very far dots are tiny
            let size = DOT_SIZE;
            let opacity = 0.4;

            if (isActive) {
              opacity = 1;
            } else if (distanceFromActive === 1) {
              opacity = 0.6;
            } else if (distanceFromActive === 2) {
              size = DOT_SIZE_SMALL;
              opacity = 0.4;
            } else {
              size = DOT_SIZE_TINY;
              opacity = 0.3;
            }

            return (
              <View
                key={`dot-${index}`}
                style={[
                  styles.dotWrapper,
                  { width: dotTotalWidth, height: DOT_SIZE },
                ]}
              >
                <View
                  style={[
                    styles.dot,
                    {
                      width: size,
                      height: size,
                      backgroundColor: isActive ? colors.primary : colors.border,
                      opacity,
                    },
                  ]}
                />
              </View>
            );
          })}
        </Animated.View>
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingHorizontal: LIST_HORIZONTAL_PADDING }]}>
        <View style={styles.cardContainer}>
          <VenueCardSkeleton cardWidth={resolvedCardWidth} />
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
        <Ionicons
          name="alert-circle"
          size={48}
          color={colors.error ?? colors.textSecondary}
          style={styles.emptyIcon}
        />
        <Text style={[styles.emptyText, { color: colors.text }]}>
          Erro ao carregar venues
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          {error}
        </Text>
        {onRetry && (
          <Text
            style={[styles.retryButton, { color: colors.primary }]}
            onPress={onRetry}
          >
            Tentar novamente
          </Text>
        )}
      </View>
    );
  }

  // Empty state
  if (venues.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
        <Ionicons
          name="search"
          size={48}
          color={colors.textSecondary}
          style={styles.emptyIcon}
        />
        <Text style={[styles.emptyText, { color: colors.text }]}>
          Nenhum local encontrado
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          Não encontramos bares ou baladas perto de você
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={handleContainerLayout}>
      <Animated.FlatList
        data={venues}
        renderItem={renderVenueCard}
        keyExtractor={(item) => item.place_id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
      {renderPaginationDots()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  listContent: {
    paddingHorizontal: LIST_HORIZONTAL_PADDING,
  },
  cardContainer: {
    marginRight: CARD_SPACING,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: DOT_GAP,
  },
  paginationContainer: {
    alignSelf: 'center',
    marginTop: 12,
    overflow: 'hidden',
  },
  paginationSlider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    borderRadius: 100,
  },
  emptyContainer: {
    flex: 1,
    marginHorizontal: 24,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
