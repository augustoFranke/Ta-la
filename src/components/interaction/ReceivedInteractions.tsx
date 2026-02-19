import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Avatar } from '../ui/Avatar';
import { ReceivedInteraction, InteractionType } from '../../types/database';

interface ReceivedInteractionsProps {
  interactions: ReceivedInteraction[];
  onInteractBack: (userId: string) => void;
}

const INTERACTION_ICON: Record<InteractionType, keyof typeof Ionicons.glyphMap> = {
  wave: 'hand-left',
  like: 'heart',
  drink: 'beer',
};

function getIconColor(type: InteractionType, colors: { primary: string; text: string }): string {
  return type === 'drink' ? colors.primary : colors.text;
}

export function ReceivedInteractions({
  interactions,
  onInteractBack,
}: ReceivedInteractionsProps) {
  const { colors } = useTheme();

  if (interactions.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      {/* Section title */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        QUEM TE CURTIU
      </Text>

      {/* Horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {interactions.map((interaction) => (
          <TouchableOpacity
            key={interaction.id}
            style={[styles.card, { backgroundColor: colors.card }]}
            onPress={() => onInteractBack(interaction.sender_id)}
            activeOpacity={0.7}
          >
            <Avatar
              url={interaction.sender_photo_url}
              name={interaction.sender_name}
              size={48}
            />
            <Text
              style={[styles.name, { color: colors.text }]}
              numberOfLines={1}
            >
              {interaction.sender_name}
            </Text>
            <Ionicons
              name={INTERACTION_ICON[interaction.interaction_type]}
              size={16}
              color={getIconColor(interaction.interaction_type, colors)}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 120,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
