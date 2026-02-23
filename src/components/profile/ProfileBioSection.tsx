/**
 * ProfileBioSection Component
 * Displays and allows editing of user bio and occupation.
 *
 * Supports two edit-mode patterns:
 *  1. Global edit mode (editMode prop): all fields are editable at once,
 *     no per-field Editar/Save buttons — the parent controls saving.
 *  2. Legacy per-field mode (isEditable prop without editMode): each field
 *     has its own Editar/Save/Cancel inline controls.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme';

interface ProfileBioSectionProps {
  bio: string | null;
  occupation: string | null;
  /** Global edit mode — parent controls when editing starts/ends. */
  editMode?: boolean;
  /** Called on each bio keystroke in global edit mode. */
  onBioTextChange?: (bio: string) => void;
  /** Called on each occupation keystroke in global edit mode. */
  onOccupationTextChange?: (occupation: string) => void;
  /** Legacy per-field editing (used when editMode is not provided). */
  isEditable?: boolean;
  onBioChange?: (bio: string) => Promise<{ success: boolean; error?: string }>;
  onOccupationChange?: (occupation: string) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
}

export function ProfileBioSection({
  bio,
  occupation,
  editMode,
  onBioTextChange,
  onOccupationTextChange,
  isEditable = false,
  onBioChange,
  onOccupationChange,
  isLoading = false,
}: ProfileBioSectionProps) {
  const { colors } = useTheme();

  // Local buffer for global edit mode
  const [localBio, setLocalBio] = useState(bio || '');
  const [localOccupation, setLocalOccupation] = useState(occupation || '');

  // Sync buffer when parent data or edit mode changes
  useEffect(() => {
    if (editMode) {
      setLocalBio(bio || '');
      setLocalOccupation(occupation || '');
    }
  }, [editMode, bio, occupation]);

  if (editMode !== undefined) {
    // ── Global edit mode ───────────────────────────────────────────
    return (
      <View style={styles.container}>
        {/* Bio field */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Sobre
          </Text>
          {editMode ? (
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={localBio}
              onChangeText={(v) => {
                setLocalBio(v);
                onBioTextChange?.(v);
              }}
              placeholder="Conte um pouco sobre você..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
              accessibilityLabel="Bio"
            />
          ) : (
            <Text style={[styles.bioText, { color: colors.text }]}>
              {bio || 'Nenhuma bio adicionada'}
            </Text>
          )}
        </View>

        {/* Occupation field */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Ocupação
          </Text>
          {editMode ? (
            <TextInput
              style={[
                styles.textInput,
                styles.singleLineInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={localOccupation}
              onChangeText={(v) => {
                setLocalOccupation(v);
                onOccupationTextChange?.(v);
              }}
              placeholder="Sua ocupação..."
              placeholderTextColor={colors.textSecondary}
              maxLength={100}
              accessibilityLabel="Ocupação"
            />
          ) : (
            <Text style={[styles.bioText, { color: colors.text }]}>
              {occupation || 'Nenhuma ocupação adicionada'}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // ── Legacy per-field mode ──────────────────────────────────────
  return (
    <View style={styles.container}>
      <EditableField
        label="Sobre"
        value={bio}
        placeholder="Conte um pouco sobre você..."
        isEditable={isEditable}
        isLoading={isLoading}
        onSave={onBioChange}
        multiline
        colors={colors}
      />

      <EditableField
        label="Ocupação"
        value={occupation}
        placeholder="Sua ocupação..."
        isEditable={isEditable}
        isLoading={isLoading}
        onSave={onOccupationChange}
        colors={colors}
      />
    </View>
  );
}

// ─── Legacy per-field editable component ──────────────────────────────────────

interface EditableFieldProps {
  label: string;
  value: string | null;
  placeholder: string;
  isEditable: boolean;
  isLoading: boolean;
  onSave?: (newValue: string) => Promise<{ success: boolean; error?: string }>;
  multiline?: boolean;
  colors: any;
}

function EditableField({
  label,
  value,
  placeholder,
  isEditable,
  isLoading,
  onSave,
  multiline = false,
  colors,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    const result = await onSave(editedValue);
    setIsSaving(false);

    if (result.success) {
      setIsEditing(false);
    } else {
      Alert.alert('Erro', result.error || 'Não foi possível salvar');
    }
  };

  const handleCancel = () => {
    setEditedValue(value || '');
    setIsEditing(false);
  };

  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {label}
        </Text>
        {isEditable && !isEditing && (
          <TouchableOpacity
            onPress={() => setIsEditing(true)}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={`Editar ${label}`}
          >
            <Text style={[styles.editButton, { color: colors.primary }]}>
              Editar
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isEditing ? (
        <View>
          <TextInput
            style={[
              styles.textInput,
              !multiline && styles.singleLineInput,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={editedValue}
            onChangeText={setEditedValue}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
            maxLength={multiline ? 500 : 100}
            textAlignVertical={multiline ? 'top' : 'center'}
          />
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={handleCancel}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel="Cancelar edição"
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel="Salvar"
            >
              <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={[styles.bioText, { color: colors.text }]}>
          {value || `Nenhuma ${label.toLowerCase()} adicionada`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginBottom: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  editButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 100,
  },
  singleLineInput: {
    minHeight: 44,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
