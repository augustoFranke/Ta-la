/**
 * ProfileBioSection Component
 * Displays and allows editing of user bio and occupation
 */

import React, { useState } from 'react';
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
  isEditable?: boolean;
  onBioChange?: (bio: string) => Promise<{ success: boolean; error?: string }>;
  onOccupationChange?: (occupation: string) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
}

export function ProfileBioSection({
  bio,
  occupation,
  isEditable = false,
  onBioChange,
  onOccupationChange,
  isLoading = false,
}: ProfileBioSectionProps) {
  const { colors } = useTheme();

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
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {label}
        </Text>
        {isEditable && !isEditing && (
          <TouchableOpacity
            onPress={() => setIsEditing(true)}
            disabled={isLoading}
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
            textAlignVertical={multiline ? "top" : "center"}
          />
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={handleCancel}
              disabled={isSaving}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={isSaving}
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
