/**
 * ProfileInterests Component
 * Displays user interests as tags with edit capability
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme';
import { Tag } from '../ui/Tag';
import type { Interest } from '../../types/database';

interface ProfileInterestsProps {
  interests: Interest[];
  isEditable?: boolean;
  isLoading?: boolean;
}

export function ProfileInterests({
  interests,
  isEditable = false,
  isLoading = false,
}: ProfileInterestsProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handleEditInterests = () => {
    router.push('/(tabs)/profile/edit-interests');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>
          Interesses
        </Text>
        {isEditable && (
          <TouchableOpacity onPress={handleEditInterests} disabled={isLoading}>
            <Text style={[styles.editButton, { color: colors.primary }]}>
              Editar
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {interests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nenhum interesse adicionado
          </Text>
          {isEditable && (
            <TouchableOpacity onPress={handleEditInterests}>
              <Text style={[styles.addText, { color: colors.primary }]}>
                Adicionar interesses
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  editButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  emptyText: {
    fontSize: 14,
    marginBottom: 8,
  },
  addText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
