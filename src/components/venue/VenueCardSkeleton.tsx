/**
 * VenueCardSkeleton Component
 * Loading skeleton for VenueCard
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../../theme';

const SKELETON_HEIGHT = 320;

interface VenueCardSkeletonProps {
  cardWidth?: number;
}

export function VenueCardSkeleton({ cardWidth }: VenueCardSkeletonProps) {
  const { isDark } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const resolvedWidth = cardWidth ?? 300;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-resolvedWidth, resolvedWidth],
  });

  const baseColor = isDark ? '#2a2a2a' : '#e0e0e0';
  const shimmerColor = isDark ? '#3a3a3a' : '#f0f0f0';

  return (
    <View style={[styles.container, { backgroundColor: baseColor, width: resolvedWidth }]}>
      {/* Shimmer overlay */}
      <Animated.View
        style={[
          styles.shimmer,
          {
            backgroundColor: shimmerColor,
            transform: [{ translateX: shimmerTranslate }],
          },
        ]}
      />

      {/* Content placeholders */}
      <View style={styles.content}>
        {/* Top badges */}
        <View style={styles.topRow}>
          <View style={[styles.badge, { backgroundColor: baseColor }]} />
        </View>

        {/* Bottom content */}
        <View style={styles.bottomContent}>
          <View style={[styles.titleLine, { backgroundColor: baseColor }]} />
          <View style={[styles.subtitleLine, { backgroundColor: baseColor }]} />
          <View style={[styles.addressLine, { backgroundColor: baseColor }]} />
          <View style={[styles.button, { backgroundColor: baseColor }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: SKELETON_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '50%',
    opacity: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  topRow: {
    flexDirection: 'row',
  },
  badge: {
    width: 70,
    height: 28,
    borderRadius: 14,
  },
  bottomContent: {
    gap: 12,
  },
  titleLine: {
    height: 32,
    width: '80%',
    borderRadius: 8,
  },
  subtitleLine: {
    height: 20,
    width: '50%',
    borderRadius: 6,
  },
  addressLine: {
    height: 16,
    width: '70%',
    borderRadius: 6,
  },
  button: {
    height: 48,
    borderRadius: 12,
    marginTop: 8,
  },
});
