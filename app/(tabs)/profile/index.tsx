/**
 * Tela de Perfil
 * Visualização e edição do perfil do usuário
 */

import { ScrollView, RefreshControl, StyleSheet, View, Text, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme';
import { useProfile } from '../../../src/hooks/useProfile';
import { useAuthStore } from '../../../src/stores/authStore';
import { supabase } from '../../../src/services/supabase';
import {
  ProfileHeader,
  ProfilePhotos,
  ProfileBioSection,
  ProfileInterests,
} from '../../../src/components/profile';
import { Button } from '../../../src/components/ui/Button';

export default function ProfileScreen() {
  const { colors, spacing, typography, isDark } = useTheme();
  const router = useRouter();
  const { setUser } = useAuthStore();

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

  const handleRefresh = () => {
    fetchProfile();
  };

  const toggleAvailability = async () => {
    if (!user) return;
    const current = user.is_available ?? true;
    const next = !current;

    // Optimistic update
    setUser({ ...user, is_available: next });

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_available: next })
        .eq('id', user.id);

      if (error) throw error;
    } catch {
      // Revert on failure
      setUser({ ...user, is_available: current });
      Alert.alert('Erro', 'Nao foi possivel atualizar sua disponibilidade.');
    }
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
        <ProfileInterests interests={interests} />

        {/* Availability Toggle */}
        <View style={[styles.availabilitySection, { backgroundColor: colors.card }]}>
          <View style={styles.availabilityRow}>
            <View style={styles.availabilityLeft}>
              <Ionicons name="wine-outline" size={24} color={colors.primary} />
              <View style={styles.availabilityTextContainer}>
                <Text style={[styles.availabilityTitle, { color: colors.text }]}>
                  Disponivel para drinks
                </Text>
                <Text style={[styles.availabilitySubtitle, { color: colors.textSecondary }]}>
                  Quando desativado, ninguem podera te enviar drinks
                </Text>
              </View>
            </View>
            <Switch
              value={user?.is_available ?? true}
              onValueChange={toggleAvailability}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={'#fff'}
            />
          </View>
        </View>

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
    marginBottom: 12,
  },
  settingsButton: {
    alignSelf: 'stretch',
  },
  availabilitySection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availabilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  availabilityTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  availabilityTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  availabilitySubtitle: {
    fontSize: 13,
    marginTop: 2,
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
