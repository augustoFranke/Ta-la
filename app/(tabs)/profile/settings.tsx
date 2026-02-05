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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { useTheme } from '../../../src/theme';
import { useLocationStore } from '../../../src/stores/locationStore';
import { useAuth } from '../../../src/hooks/useAuth';
import { Button } from '../../../src/components/ui/Button';

export default function ProfileSettingsScreen() {
  const { colors, spacing, typography, isDark, setMode } = useTheme();
  const { signOut, isLoading: isAuthLoading } = useAuth();
  const {
    permissionGranted,
    errorMsg,
    isLoading,
    setPermission,
    setError,
    getCurrentLocation,
  } = useLocationStore();
  const [isRequesting, setIsRequesting] = useState(false);

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
      if (state === 'active') {
        refreshPermissionStatus();
      }
    });

    return () => subscription.remove();
  }, [refreshPermissionStatus]);

  const handleOpenSettings = useCallback(() => {
    Linking.openSettings().catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir os ajustes do sistema.');
    });
  }, []);

  const handleToggleTheme = useCallback(
    (nextValue: boolean) => {
      setMode(nextValue ? 'dark' : 'light');
    },
    [setMode]
  );

  const handleToggleLocation = useCallback(
    async (nextValue: boolean) => {
      if (nextValue) {
        setIsRequesting(true);
        const coords = await getCurrentLocation();
        setIsRequesting(false);

        if (!coords) {
          Alert.alert(
            'Permissão necessária',
            'Não foi possível ativar a localização. Verifique os ajustes do sistema.'
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
        ]
      );
    },
    [handleOpenSettings, getCurrentLocation]
  );

  const handleLogout = useCallback(() => {
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
  }, [signOut]);

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
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Aparência
          </Text>
          <View style={[styles.list, { borderColor: colors.border }]}>
            <View style={[styles.row, styles.rowDivider, { borderColor: colors.border }]}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                Modo escuro
              </Text>
              <Switch
                value={isDark}
                onValueChange={handleToggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={isDark ? colors.onPrimary : colors.textSecondary}
                ios_backgroundColor={colors.border}
              />
            </View>
          </View>
        </View>

        <View style={[styles.section, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Permissões
          </Text>
          <View style={[styles.list, { borderColor: colors.border }]}>
            <View style={styles.row}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                Localização
              </Text>
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
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errorMsg}
            </Text>
          ) : null}
        </View>

        <View style={[styles.section, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Conta
          </Text>
          <View style={styles.logoutContainer}>
            <Button
              title="Sair da conta"
              variant="outline"
              onPress={handleLogout}
              loading={isAuthLoading}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 8,
  },
  title: {
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    lineHeight: 22,
  },
  section: {
    gap: 12,
  },
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
  helperText: {
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 12,
  },
  logoutContainer: {
    marginTop: 8,
  },
});
