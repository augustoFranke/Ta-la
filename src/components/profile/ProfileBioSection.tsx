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

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingOccupation, setIsEditingOccupation] = useState(false);
  const [editedBio, setEditedBio] = useState(bio || '');
  const [editedOccupation, setEditedOccupation] = useState(occupation || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveBio = async () => {
    if (!onBioChange) return;

    setIsSaving(true);
    const result = await onBioChange(editedBio);
    setIsSaving(false);

    if (result.success) {
      setIsEditingBio(false);
    } else {
      Alert.alert('Erro', result.error || 'Não foi possível salvar');
    }
  };

  const handleSaveOccupation = async () => {
    if (!onOccupationChange) return;

    setIsSaving(true);
    const result = await onOccupationChange(editedOccupation);
    setIsSaving(false);

    if (result.success) {
      setIsEditingOccupation(false);
    } else {
      Alert.alert('Erro', result.error || 'Não foi possível salvar');
    }
  };

  const handleCancelBio = () => {
    setEditedBio(bio || '');
    setIsEditingBio(false);
  };

  const handleCancelOccupation = () => {
    setEditedOccupation(occupation || '');
    setIsEditingOccupation(false);
  };

  return (
    <View style={styles.container}>
      {/* Bio Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Sobre
          </Text>
          {isEditable && !isEditingBio && (
            <TouchableOpacity
              onPress={() => setIsEditingBio(true)}
              disabled={isLoading}
            >
              <Text style={[styles.editButton, { color: colors.primary }]}>
                Editar
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditingBio ? (
          <View>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={editedBio}
              onChangeText={setEditedBio}
              placeholder="Conte um pouco sobre você..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={handleCancelBio}
                disabled={isSaving}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveBio}
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
            {bio || 'Nenhuma bio adicionada'}
          </Text>
        )}
      </View>

      {/* Occupation Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Ocupação
          </Text>
          {isEditable && !isEditingOccupation && (
            <TouchableOpacity
              onPress={() => setIsEditingOccupation(true)}
              disabled={isLoading}
            >
              <Text style={[styles.editButton, { color: colors.primary }]}>
                Editar
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditingOccupation ? (
          <View>
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
              value={editedOccupation}
              onChangeText={setEditedOccupation}
              placeholder="Sua ocupação..."
              placeholderTextColor={colors.textSecondary}
              maxLength={100}
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={handleCancelOccupation}
                disabled={isSaving}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveOccupation}
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
            {occupation || 'Nenhuma ocupação adicionada'}
          </Text>
        )}
      </View>
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
