/**
 * CheckInModal Component
 * Lightweight bottom sheet for check-in confirmation — no toggles, always public.
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../theme';
import type { VenueWithDistance } from '../../stores/venueStore';

interface CheckInModalProps {
  visible: boolean;
  venue: VenueWithDistance | null;
  onConfirm: () => void;
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

  if (!venue) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      {/* Full-screen overlay — tap to dismiss */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onCancel}
      />

      {/* Bottom sheet panel */}
      <View style={[styles.sheet, { backgroundColor: colors.card }]}>
        {/* Drag handle */}
        <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

        {/* Venue name */}
        <Text style={[styles.venueName, { color: colors.text }]} numberOfLines={2}>
          {venue.name}
        </Text>

        {/* Address */}
        {!!venue.address && (
          <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={1}>
            {venue.address}
          </Text>
        )}

        {/* Confirm button */}
        <TouchableOpacity
          style={[styles.confirmButton, { backgroundColor: colors.primary }]}
          onPress={onConfirm}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={[styles.confirmButtonText, { color: colors.onPrimary }]}>
            {isLoading ? '...' : 'Confirmar check-in'}
          </Text>
        </TouchableOpacity>

        {/* Cancel link */}
        <TouchableOpacity onPress={onCancel} disabled={isLoading} activeOpacity={0.7}>
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
            Cancelar
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  address: {
    fontSize: 13,
    textAlign: 'center',
  },
  confirmButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cancelText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 4,
  },
});
