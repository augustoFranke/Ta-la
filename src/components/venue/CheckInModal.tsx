/**
 * CheckInModal Component
 * Modal shown when user taps check-in, with "open to meeting" toggle
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import type { VenueWithDistance } from '../../stores/venueStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CheckInModalProps {
  visible: boolean;
  venue: VenueWithDistance | null;
  onConfirm: (openToMeeting: boolean) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CheckInModal({
  visible,
  venue,
  onConfirm,
  onCancel,
  isLoading = false,
}: CheckInModalProps) {
  const { colors } = useTheme();
  const [openToMeeting, setOpenToMeeting] = useState(false);

  const handleConfirm = () => {
    onConfirm(openToMeeting);
    setOpenToMeeting(false);
  };

  const handleCancel = () => {
    setOpenToMeeting(false);
    onCancel();
  };

  if (!venue) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="location" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Fazer Check-in
            </Text>
            <Text style={[styles.venueName, { color: colors.text }]} numberOfLines={2}>
              {venue.name}
            </Text>
          </View>

          {/* Open to meeting toggle */}
          <View style={[styles.toggleSection, { borderColor: colors.border }]}>
            <View style={styles.toggleContent}>
              <View style={styles.toggleIcon}>
                <Ionicons name="heart" size={24} color="#e91e63" />
              </View>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>
                  Aberto para conhecer pessoas
                </Text>
                <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>
                  Outros usuarios verao que voce esta disponivel
                </Text>
              </View>
            </View>
            <Switch
              value={openToMeeting}
              onValueChange={setOpenToMeeting}
              trackColor={{ false: colors.border, true: '#e91e63' }}
              thumbColor={openToMeeting ? '#fff' : '#f4f3f4'}
            />
          </View>

          {/* Info text when enabled */}
          {openToMeeting && (
            <View style={styles.infoContainer}>
              <Ionicons name="sparkles" size={16} color="#e91e63" />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Seu perfil aparecera em destaque para outros usuarios neste local
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.primary }]}
              onPress={handleConfirm}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <Text style={[styles.confirmButtonText, { color: colors.onPrimary }]}>
                  ...
                </Text>
              ) : (
                <Text style={[styles.confirmButtonText, { color: colors.onPrimary }]}>
                  Confirmar
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(193, 255, 114, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 16,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  toggleIcon: {
    marginRight: 12,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
