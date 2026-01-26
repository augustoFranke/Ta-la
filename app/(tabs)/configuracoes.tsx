import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  AppState,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/ui/Button';
import { useLocationStore } from '../../src/stores/locationStore';
import { getCurrentLocation } from '../../src/services/location';

export default function SettingsScreen() {
  const { colors, spacing, typography, isDark } = useTheme();
  const {
    permissionGranted,
    errorMsg,
    isLoading,
    setPermission,
    setError,
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
    [handleOpenSettings]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={[styles.header, { padding: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xl }]}>
          Configurações
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
          Gerencie permissões e preferências do app.
        </Text>
      </View>

      <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Permissões
          </Text>

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                Localização
              </Text>
              <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                Necessária para mostrar locais próximos a você.
              </Text>
            </View>
            <Switch
              value={permissionGranted}
              onValueChange={handleToggleLocation}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={permissionGranted ? colors.onPrimary : colors.textSecondary}
              ios_backgroundColor={colors.border}
              disabled={isLoading || isRequesting}
            />
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
              Status
            </Text>
            <Text
              style={[
                styles.statusValue,
                { color: permissionGranted ? colors.success : colors.error },
              ]}
            >
              {permissionGranted ? 'Ativada' : 'Desativada'}
            </Text>
          </View>

          {errorMsg ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errorMsg}
            </Text>
          ) : null}

          <Button
            title="Abrir ajustes do sistema"
            variant="outline"
            onPress={handleOpenSettings}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </View>
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
    flex: 1,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 13,
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
  },
});
