/**
 * Settings Screen — Spec 010
 *
 * Sections:
 * 1. Appearance — theme: light / dark / system (3 options, persisted)
 * 2. Permissions — location, notifications entry points
 * 3. Notifications — social_drinks, social_matches, venue_offers toggles
 * 4. Conta — change name, email, phone, password; sign out; delete account
 */

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  AppState,
  Linking,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme';
import { useLocationStore } from '../../../src/stores/locationStore';
import { useAuth } from '../../../src/hooks/useAuth';
import { Button } from '../../../src/components/ui/Button';
import { useNotificationStore } from '../../../src/stores/notificationStore';
import {
  fetchNotificationPreferences,
  upsertNotificationPreferences,
} from '../../../src/services/notifications';
import { deleteAccount } from '../../../src/services/auth';
import { NOTIFICATION_CATEGORIES } from '../../../src/types/database';

type ThemeMode = 'light' | 'dark' | 'system';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Padrão do sistema' },
];

export default function ProfileSettingsScreen() {
  const { colors, spacing, typography, isDark, mode, setMode } = useTheme();
  const { session, signOut, isLoading: isAuthLoading } = useAuth();
  const {
    permissionGranted,
    errorMsg,
    isLoading,
    setPermission,
    setError,
    getCurrentLocation,
  } = useLocationStore();
  const { preferences, isLoaded: notifLoaded, setPreferences, updateCategory } =
    useNotificationStore();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const userId = session?.user?.id;

  // Load notification preferences on mount
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        const prefs = await fetchNotificationPreferences(userId);
        if (cancelled) return;
        if (prefs) {
          setPreferences(prefs);
        } else {
          const defaults = { social_drinks: true, social_matches: true, venue_offers: true };
          await upsertNotificationPreferences(userId, defaults);
          if (cancelled) return;
          const created = await fetchNotificationPreferences(userId);
          if (!cancelled) setPreferences(created);
        }
      } catch {
        // Silently fail
      }
    })();

    return () => { cancelled = true; };
  }, [userId, setPreferences]);

  const refreshPermissionStatus = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermission(status === 'granted');
      setError(null);
    } catch (error: any) {
      setError(error?.message || 'Erro ao verificar permissões');
    }
  }, [setPermission, setError]);

  useEffect(() => {
    refreshPermissionStatus();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshPermissionStatus();
    });
    return () => subscription.remove();
  }, [refreshPermissionStatus]);

  const handleOpenSettings = useCallback(() => {
    Linking.openSettings().catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir os ajustes do sistema.');
    });
  }, []);

  const handleToggleLocation = useCallback(
    async (nextValue: boolean) => {
      if (nextValue) {
        setIsRequesting(true);
        const coords = await getCurrentLocation();
        setIsRequesting(false);
        if (!coords) {
          Alert.alert(
            'Permissão necessária',
            'Não foi possível ativar a localização. Verifique os ajustes do sistema.',
          );
        }
        return;
      }
      Alert.alert(
        'Desativar localização',
        'Para desativar a localização, abra os ajustes do sistema.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir ajustes', onPress: handleOpenSettings },
        ],
      );
    },
    [handleOpenSettings, getCurrentLocation],
  );

  const handleLogout = useCallback(() => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => { await signOut(); },
      },
    ]);
  }, [signOut]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Excluir conta',
      'Esta ação é permanente e irreversível. Seus dados serão removidos conforme nossa política de privacidade e a LGPD. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir minha conta',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingAccount(true);
            try {
              const result = await deleteAccount();
              if (!result.success) {
                Alert.alert('Erro', result.error ?? 'Não foi possível excluir a conta.');
              }
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir a conta. Tente novamente.');
            } finally {
              setIsDeletingAccount(false);
            }
          },
        },
      ],
    );
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={[styles.header, { padding: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xl }]}>
          Configurações
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
          Ajuste preferências e permissões do app.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>

        {/* Appearance — 3-option theme selector (Spec 010 §4) */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Aparência</Text>
          <View style={[styles.list, { borderColor: colors.border }]}>
            {THEME_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.row,
                  index < THEME_OPTIONS.length - 1 && styles.rowDivider,
                  index < THEME_OPTIONS.length - 1 && { borderColor: colors.border },
                ]}
                onPress={() => setMode(option.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.rowTitle, { color: colors.text }]}>{option.label}</Text>
                {mode === option.value && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Permissions */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Permissões</Text>
          <View style={[styles.list, { borderColor: colors.border }]}>
            <View style={styles.row}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Localização</Text>
              <Switch
                value={permissionGranted}
                onValueChange={handleToggleLocation}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={permissionGranted ? colors.onPrimary : colors.textSecondary}
                ios_backgroundColor={colors.border}
                disabled={isLoading || isRequesting}
              />
            </View>
          </View>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Necessária para mostrar locais próximos a você.
          </Text>
          {errorMsg ? (
            <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
          ) : null}
        </View>

        {/* Notification toggles */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notificações</Text>
          <View style={[styles.list, { borderColor: colors.border }]}>
            {NOTIFICATION_CATEGORIES.map((cat, index) => (
              <View
                key={cat.value}
                style={[
                  styles.row,
                  index < NOTIFICATION_CATEGORIES.length - 1 && styles.rowDivider,
                  index < NOTIFICATION_CATEGORIES.length - 1 && { borderColor: colors.border },
                ]}
              >
                <Text style={[styles.rowTitle, { color: colors.text }]}>{cat.label}</Text>
                <Switch
                  value={preferences?.[cat.value] ?? true}
                  onValueChange={(val) => { if (userId) updateCategory(userId, cat.value, val); }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={preferences?.[cat.value] ? colors.onPrimary : colors.textSecondary}
                  ios_backgroundColor={colors.border}
                  disabled={!notifLoaded || !userId}
                />
              </View>
            ))}
          </View>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Escolha quais notificações deseja receber.
          </Text>
        </View>

        {/* Account management (Spec 010 §4) */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Conta</Text>
          <View style={[styles.list, { borderColor: colors.border }]}>
            {[
              { label: 'Alterar nome', note: null },
              { label: 'Alterar e-mail', note: 'Requer reconfirmação' },
              { label: 'Alterar senha', note: 'Requer reautenticação' },
              { label: 'Alterar telefone', note: 'Requer OTP' },
            ].map((item, index, arr) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.row,
                  index < arr.length - 1 && styles.rowDivider,
                  index < arr.length - 1 && { borderColor: colors.border },
                ]}
                onPress={() =>
                  Alert.alert(item.label, item.note ? `${item.note}.` : 'Em breve.')
                }
                activeOpacity={0.7}
              >
                <View>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>{item.label}</Text>
                  {item.note && (
                    <Text style={[styles.rowNote, { color: colors.textSecondary }]}>
                      {item.note}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sign out */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
          <Button
            title="Sair da conta"
            variant="outline"
            onPress={handleLogout}
            loading={isAuthLoading}
          />
        </View>

        {/* Delete account */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg, paddingTop: spacing.sm }]}>
          <Button
            title="Excluir minha conta"
            variant="outline"
            onPress={handleDeleteAccount}
            loading={isDeletingAccount}
          />
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Ação permanente e irreversível. Seus dados serão removidos conforme a LGPD.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 8 },
  title: { fontWeight: '700', marginBottom: 6 },
  subtitle: { lineHeight: 22 },
  section: { gap: 12 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  list: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowNote: {
    fontSize: 12,
    marginTop: 2,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 12,
  },
});
