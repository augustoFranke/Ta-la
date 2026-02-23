/**
 * Tela de Perfil
 * Visualização e edição do perfil do usuário
 *
 * NOTA: O campo `is_available` ainda existe na tabela `users` no banco de dados,
 * mas o toggle "Disponível para drinks" foi removido da UI e da lógica do app.
 * Não expor nem depender de is_available no frontend.
 */

import { useState, useCallback } from 'react';
import { ScrollView, RefreshControl, StyleSheet, View, Text, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme';
import { useProfile } from '../../../src/hooks/useProfile';
import { useAuth } from '../../../src/hooks/useAuth';
import {
  ProfileHeader,
  ProfilePhotos,
  ProfileBioSection,
  ProfileInterests,
} from '../../../src/components/profile';
import { Button } from '../../../src/components/ui/Button';

// Guest profile view — shown when not authenticated (Spec 001)
function GuestProfileScreen() {
  const router = useRouter();
  const { colors, spacing, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.guestContainer, { paddingHorizontal: spacing.lg }]}>
        <View style={[styles.guestAvatar, { backgroundColor: colors.card }]}>
          <Ionicons name="person" size={48} color={colors.textSecondary} />
        </View>
        <Text style={[styles.guestTitle, { color: colors.text }]}>
          Bem-vindo ao Tá lá!
        </Text>
        <Text style={[styles.guestSubtitle, { color: colors.textSecondary }]}>
          Crie sua conta para encontrar pessoas nos mesmos lugares que você.
        </Text>
        <Button
          title="Cadastre-se e crie seu perfil"
          onPress={() => router.push('/(auth)/welcome')}
        />
      </View>
    </SafeAreaView>
  );
}

export default function ProfileScreen() {
  const { isAuthenticated } = useAuth();
  const { colors, spacing, isDark } = useTheme();
  const router = useRouter();

  const {
    user,
    photos,
    interests,
    isLoading,
    age,
    primaryPhoto,
    fetchProfile,
    updateBio,
    updateOccupation,
    updatePhotos,
  } = useProfile();

  // ── Global edit mode ─────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Pending text values for bio and occupation (buffered during edit mode)
  const [pendingBio, setPendingBio] = useState<string>('');
  const [pendingOccupation, setPendingOccupation] = useState<string>('');

  const handleEnterEdit = useCallback(() => {
    setPendingBio(user?.bio || '');
    setPendingOccupation(user?.occupation || '');
    setEditMode(true);
  }, [user?.bio, user?.occupation]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const [bioResult, occResult] = await Promise.all([
        updateBio(pendingBio),
        updateOccupation(pendingOccupation),
      ]);

      if (!bioResult.success || !occResult.success) {
        const msg = bioResult.error || occResult.error || 'Não foi possível salvar';
        Alert.alert('Erro', msg);
        return;
      }

      setEditMode(false);
    } finally {
      setIsSaving(false);
    }
  }, [pendingBio, pendingOccupation, updateBio, updateOccupation]);

  const handleCancelEdit = useCallback(() => {
    setEditMode(false);
  }, []);

  const handleRefresh = () => {
    fetchProfile();
  };

  // Spec 001: guests see only a CTA, no editable profile controls
  if (!isAuthenticated) {
    return <GuestProfileScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Screen header with title + global edit control */}
      <View style={[styles.screenHeader, { paddingHorizontal: spacing.lg, borderBottomColor: colors.border }]}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Perfil</Text>
        <View style={styles.headerActions}>
          {editMode ? (
            <>
              <TouchableOpacity
                onPress={handleCancelEdit}
                disabled={isSaving}
                style={styles.headerButton}
                accessibilityRole="button"
                accessibilityLabel="Cancelar edição"
              >
                <Text style={[styles.headerButtonText, { color: colors.textSecondary }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                style={[styles.headerButton, styles.saveHeaderButton, { backgroundColor: colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel="Salvar perfil"
              >
                <Text style={[styles.saveHeaderButtonText, { color: colors.onPrimary }]}>
                  {isSaving ? 'Salvando…' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={handleEnterEdit}
              disabled={isLoading}
              style={styles.headerButton}
              accessibilityRole="button"
              accessibilityLabel="Editar perfil"
            >
              <Text style={[styles.headerButtonText, { color: colors.primary }]}>
                Editar
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Profile Header */}
        <ProfileHeader
          user={user}
          primaryPhoto={primaryPhoto}
          age={age}
        />

        {/* Photos Section */}
        <ProfilePhotos
          photos={photos}
          isEditable={editMode}
          hideEditButton={editMode}
          onPhotosChange={updatePhotos}
          isLoading={isLoading}
        />

        {/* Bio & Occupation Section */}
        <ProfileBioSection
          bio={user?.bio || null}
          occupation={user?.occupation || null}
          editMode={editMode}
          onBioTextChange={setPendingBio}
          onOccupationTextChange={setPendingOccupation}
          isLoading={isLoading}
        />

        {/* Interests Section */}
        <ProfileInterests interests={interests} />

        {/* Settings */}
        <View style={[styles.settingsSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.settingsTitle, { color: colors.textSecondary }]}>
            Configurações
          </Text>
          <Text style={[styles.settingsPlaceholder, { color: colors.textSecondary }]}>
            Ajuste permissões e aparência do app
          </Text>
          <Button
            title="Abrir configurações"
            variant="outline"
            onPress={() => router.push('/(tabs)/profile/settings')}
            style={styles.settingsButton}
          />
        </View>

        {/* Dev Settings (only visible in __DEV__ builds) */}
        {__DEV__ && (
          <Button
            title="Dev Settings"
            variant="outline"
            onPress={() => router.push('/(tabs)/profile/dev-settings')}
            style={styles.devSettingsButton}
          />
        )}

        {/* Version */}
        <Text style={[styles.version, { color: colors.textSecondary }]}>
          Tá lá! v1.0.0 (MVP)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveHeaderButton: {
    // background colour applied inline
  },
  saveHeaderButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
  },
  settingsSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  settingsTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  settingsPlaceholder: {
    fontSize: 14,
    marginBottom: 12,
  },
  settingsButton: {
    alignSelf: 'stretch',
  },
  devSettingsButton: {
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 16,
  },
  // Guest profile styles
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  guestAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
});
