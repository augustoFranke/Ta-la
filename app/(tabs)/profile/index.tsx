/**
 * Tela de Perfil
 * Visualização e edição do perfil do usuário
 */

import { ScrollView, RefreshControl, Alert, StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../../src/theme';
import { useAuth } from '../../../src/hooks/useAuth';
import { useProfile } from '../../../src/hooks/useProfile';
import { Button } from '../../../src/components/ui/Button';
import {
  ProfileHeader,
  ProfilePhotos,
  ProfileBioSection,
  ProfileInterests,
} from '../../../src/components/profile';

export default function ProfileScreen() {
  const { colors, spacing, typography, isDark } = useTheme();
  const { signOut, isLoading: isAuthLoading } = useAuth();

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

  const handleLogout = async () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    fetchProfile();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

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
          isEditable
          onPhotosChange={updatePhotos}
          isLoading={isLoading}
        />

        {/* Bio & Occupation Section */}
        <ProfileBioSection
          bio={user?.bio || null}
          occupation={user?.occupation || null}
          isEditable
          onBioChange={updateBio}
          onOccupationChange={updateOccupation}
          isLoading={isLoading}
        />

        {/* Interests Section */}
        <ProfileInterests
          interests={interests}
          isEditable
          isLoading={isLoading}
        />

        {/* Settings Placeholder */}
        <View style={[styles.settingsSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.settingsTitle, { color: colors.textSecondary }]}>
            Configurações
          </Text>
          <Text style={[styles.settingsPlaceholder, { color: colors.textSecondary }]}>
            Configurações adicionais serão adicionadas em breve
          </Text>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            title="Sair da conta"
            variant="outline"
            onPress={handleLogout}
            loading={isAuthLoading}
          />
        </View>

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
  },
  logoutContainer: {
    marginBottom: 16,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 16,
  },
});
