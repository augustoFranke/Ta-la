/**
 * VenueVibeSelector Component
 * Shown after checkout to let users tag venues with dating-friendly vibes
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { VIBE_CONFIG, VibeType } from '../../types/database';
import { supabase } from '../../services/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_VIBES = 3;

interface VenueVibeSelectorProps {
  visible: boolean;
  venueId: string;
  venueName: string;
  userId: string;
  onClose: () => void;
  onSaved?: () => void;
}

const VIBE_TYPES: VibeType[] = [
  'good_for_dating',
  'singles_friendly',
  'great_atmosphere',
  'easy_conversation',
  'intimate_setting',
  'upscale_crowd',
  'casual_vibes',
];

export function VenueVibeSelector({
  visible,
  venueId,
  venueName,
  userId,
  onClose,
  onSaved,
}: VenueVibeSelectorProps) {
  const { colors } = useTheme();
  const [selectedVibes, setSelectedVibes] = useState<Set<VibeType>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const toggleVibe = (vibe: VibeType) => {
    setSelectedVibes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(vibe)) {
        newSet.delete(vibe);
      } else if (newSet.size < MAX_VIBES) {
        newSet.add(vibe);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (selectedVibes.size === 0) {
      onClose();
      return;
    }

    setIsSaving(true);

    try {
      const vibeRecords = Array.from(selectedVibes).map((vibe) => ({
        venue_id: venueId,
        user_id: userId,
        vibe,
      }));

      const { error } = await supabase.from('venue_vibes').upsert(vibeRecords, {
        onConflict: 'venue_id,user_id,vibe',
      });

      if (error) {
        console.error('Error saving vibes:', error);
      } else {
        onSaved?.();
      }
    } catch (err) {
      console.error('Error saving vibes:', err);
    } finally {
      setIsSaving(false);
      setSelectedVibes(new Set());
      onClose();
    }
  };

  const handleSkip = () => {
    setSelectedVibes(new Set());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="sparkles" size={28} color="#e91e63" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Como foi a vibe?
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Ajude outros a conhecer {venueName}
            </Text>
          </View>

          {/* Vibe selection hint */}
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Selecione ate {MAX_VIBES} vibes ({selectedVibes.size}/{MAX_VIBES})
          </Text>

          {/* Vibe chips grid */}
          <View style={styles.vibesGrid}>
            {VIBE_TYPES.map((vibe) => {
              const config = VIBE_CONFIG[vibe];
              const isSelected = selectedVibes.has(vibe);
              const isDisabled = !isSelected && selectedVibes.size >= MAX_VIBES;

              return (
                <TouchableOpacity
                  key={vibe}
                  style={[
                    styles.vibeChip,
                    { borderColor: colors.border },
                    isSelected && styles.vibeChipSelected,
                    isDisabled && styles.vibeChipDisabled,
                  ]}
                  onPress={() => toggleVibe(vibe)}
                  disabled={isDisabled}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={config.icon}
                    size={16}
                    color={isSelected ? '#fff' : colors.text}
                  />
                  <Text
                    style={[
                      styles.vibeText,
                      { color: isSelected ? '#fff' : colors.text },
                      isDisabled && { opacity: 0.4 },
                    ]}
                  >
                    {config.label}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#fff"
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.skipButton, { borderColor: colors.border }]}
              onPress={handleSkip}
              disabled={isSaving}
            >
              <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
                Pular
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: selectedVibes.size > 0 ? '#e91e63' : colors.border },
              ]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <Text style={styles.saveButtonText}>...</Text>
              ) : (
                <Text style={styles.saveButtonText}>
                  {selectedVibes.size > 0 ? 'Salvar' : 'Fechar'}
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
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(233, 30, 99, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  vibesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  vibeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  vibeChipSelected: {
    backgroundColor: '#e91e63',
    borderColor: '#e91e63',
  },
  vibeChipDisabled: {
    opacity: 0.4,
  },
  vibeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  checkIcon: {
    marginLeft: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
