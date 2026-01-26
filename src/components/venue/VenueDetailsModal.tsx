/**
 * VenueDetailsModal Component
 * Modal with venue information and check-in action
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { getVenueTypeLabel, formatDistance } from '../../services/places';
import type { VenueWithDistance } from '../../stores/venueStore';
import { VIBE_CONFIG } from '../../types/database';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VenueDetailsModalProps {
  visible: boolean;
  venue: VenueWithDistance | null;
  onClose: () => void;
  onCheckIn: (venue: VenueWithDistance) => void;
}

export function VenueDetailsModal({
  visible,
  venue,
  onClose,
  onCheckIn,
}: VenueDetailsModalProps) {
  const { colors } = useTheme();

  if (!venue) return null;

  const openStatus = venue.open_now == null
    ? null
    : {
        label: venue.open_now ? 'Aberto agora' : 'Fechado',
        color: venue.open_now ? colors.success : colors.error,
      };

  const ratingText = venue.rating ? `${venue.rating.toFixed(1)} / 5` : 'Sem avaliação';
  const distanceText = formatDistance(venue.distance);

  const handleCheckIn = () => {
    onCheckIn(venue);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.container, { backgroundColor: colors.card }]} onPress={() => {}}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
                {venue.name}
              </Text>
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

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Ionicons name="star" size={16} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {ratingText}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={16} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {distanceText}
                </Text>
              </View>
              {venue.address ? (
                <View style={styles.infoRow}>
                  <Ionicons name="navigate" size={16} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.text }]} numberOfLines={2}>
                    {venue.address}
                  </Text>
                </View>
              ) : null}
            </View>

            {(venue.active_users_count > 0 || (venue.open_to_meeting_count ?? 0) > 0) && (
              <View style={styles.statsRow}>
                {venue.active_users_count > 0 && (
                  <View style={[styles.statChip, { borderColor: colors.border }]}>
                    <Ionicons name="people" size={14} color={colors.textSecondary} />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                      {venue.active_users_count} por aqui
                    </Text>
                  </View>
                )}
                {(venue.open_to_meeting_count ?? 0) > 0 && (
                  <View style={[styles.statChip, { borderColor: colors.border }]}>
                    <Ionicons name="heart" size={14} color={colors.textSecondary} />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                      {venue.open_to_meeting_count} disponíveis
                    </Text>
                  </View>
                )}
              </View>
            )}

            {venue.top_vibes && venue.top_vibes.length > 0 && (
              <View style={styles.vibesSection}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  Vibes
                </Text>
                <View style={styles.vibesRow}>
                  {venue.top_vibes.slice(0, 4).map((vibe) => {
                    const config = VIBE_CONFIG[vibe];
                    return (
                      <View key={vibe} style={[styles.vibeChip, { borderColor: colors.border }]}>
                        <Text style={[styles.vibeText, { color: colors.text }]}>
                          {config.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                Fechar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handleCheckIn}
              activeOpacity={0.8}
            >
              <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
                Fazer check-in
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 420,
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderRadius: 24,
    overflow: 'hidden',
  },
  content: {
    padding: 24,
    gap: 16,
  },
  header: {
    gap: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoSection: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  vibesSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  vibesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vibeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  vibeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
