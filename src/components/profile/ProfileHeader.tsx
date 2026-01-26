/**
 * ProfileHeader Component
 * Displays user avatar, name, age, and verification badge
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Avatar } from '../ui/Avatar';
import type { User, Photo } from '../../types/database';

interface ProfileHeaderProps {
  user: User | null;
  primaryPhoto: Photo | null;
  age: number | null;
}

export function ProfileHeader({ user, primaryPhoto, age }: ProfileHeaderProps) {
  const { colors, typography } = useTheme();

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={[styles.avatarWrapper, { borderColor: colors.primary }]}>
        <Avatar
          url={primaryPhoto?.url}
          name={user.name}
          size={120}
        />
      </View>

      {/* Name and Age */}
      <View style={styles.nameContainer}>
        <Text style={[styles.name, { color: colors.text, fontSize: typography.sizes.xl }]}>
          {user.name}
          {age !== null && (
            <Text style={{ color: colors.textSecondary }}>, {age}</Text>
          )}
        </Text>
      </View>

      {/* Occupation */}
      {user.occupation && (
        <Text style={[styles.occupation, { color: colors.textSecondary }]}>
          {user.occupation}
        </Text>
      )}

      {/* Verified Badge */}
      {user.is_verified && (
        <View style={[styles.verifiedBadge, { borderColor: colors.success }]}>
          <View style={styles.verifiedContent}>
            <Ionicons name="checkmark" size={14} color={colors.success} />
            <Text style={[styles.verifiedText, { color: colors.success }]}>
              Verificado
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    borderWidth: 3,
    borderRadius: 63,
    padding: 3,
    marginBottom: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  name: {
    fontWeight: '700',
    marginBottom: 4,
  },
  occupation: {
    fontSize: 16,
    marginBottom: 8,
  },
  verifiedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  verifiedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
