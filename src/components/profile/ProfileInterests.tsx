/**
 * ProfileInterests Component
 * Displays user interests as tags (read-only)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Tag } from '../ui/Tag';
import type { Interest } from '../../types/database';

interface ProfileInterestsProps {
  interests: Interest[];
}

export function ProfileInterests({ interests }: ProfileInterestsProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>
        Interesses
      </Text>

      {interests.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Nenhum interesse adicionado
        </Text>
      ) : (
        <View style={styles.tagsContainer}>
          {interests.map((interest) => (
            <Tag key={interest.id} label={interest.tag} selected />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
