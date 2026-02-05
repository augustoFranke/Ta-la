/**
 * VenueReportModal Component
 * Modal for users to flag venues that don't fit the nightlife context
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { flagVenue } from '../../services/venueFlags';
import { VENUE_FLAG_CONFIG, type VenueFlagType } from '../../types/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VenueReportModalProps {
  visible: boolean;
  placeId: string;
  venueName: string;
  userId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const FLAG_TYPES: VenueFlagType[] = ['not_nightlife', 'closed', 'wrong_category'];

export function VenueReportModal({
  visible,
  placeId,
  venueName,
  userId,
  onClose,
  onSuccess,
}: VenueReportModalProps) {
  const { colors } = useTheme();
  const [selectedType, setSelectedType] = useState<VenueFlagType | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedType) {
      setError('Selecione um motivo');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await flagVenue(placeId, userId, selectedType, note.trim() || undefined);

    setIsSubmitting(false);

    if (result.success) {
      onSuccess?.();
      handleClose();
    } else {
      setError(result.error);
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setNote('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable
          style={[styles.container, { backgroundColor: colors.card }]}
          onPress={() => {}}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Reportar local
            </Text>
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Venue name */}
          <Text style={[styles.venueName, { color: colors.textSecondary }]} numberOfLines={1}>
            {venueName}
          </Text>

          {/* Flag type options */}
          <View style={styles.optionsContainer}>
            {FLAG_TYPES.map((type) => {
              const config = VENUE_FLAG_CONFIG[type];
              const isSelected = selectedType === type;

              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.option,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected
                        ? `${colors.primary}15`
                        : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    setSelectedType(type);
                    setError(null);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <View
                      style={[
                        styles.radio,
                        {
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={[
                            styles.radioInner,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.optionText}>
                      <Text
                        style={[
                          styles.optionLabel,
                          { color: isSelected ? colors.primary : colors.text },
                        ]}
                      >
                        {config.label}
                      </Text>
                      <Text
                        style={[styles.optionDescription, { color: colors.textSecondary }]}
                      >
                        {config.description}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Optional note */}
          <View style={styles.noteContainer}>
            <Text style={[styles.noteLabel, { color: colors.textSecondary }]}>
              Observacao (opcional)
            </Text>
            <TextInput
              style={[
                styles.noteInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              value={note}
              onChangeText={setNote}
              placeholder="Adicione mais detalhes..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={200}
            />
          </View>

          {/* Error message */}
          {error && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: selectedType ? colors.primary : colors.border,
                },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !selectedType}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <Text
                  style={[
                    styles.submitButtonText,
                    {
                      color: selectedType ? colors.onPrimary : colors.textSecondary,
                    },
                  ]}
                >
                  Enviar
                </Text>
              )}
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
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  venueName: {
    fontSize: 14,
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  option: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  noteContainer: {
    gap: 8,
    marginBottom: 16,
  },
  noteLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 13,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
