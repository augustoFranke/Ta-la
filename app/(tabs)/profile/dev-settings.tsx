/**
 * Tela de Dev Settings
 * Permite simular coordenadas GPS para testar venue discovery sem estar no local
 * Visível apenas em builds __DEV__
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../../src/theme';
import { useLocationStore } from '../../../src/stores/locationStore';
import { useVenueStore } from '../../../src/stores/venueStore';
import { useCheckInStore } from '../../../src/stores/checkInStore';
import { supabase } from '../../../src/services/supabase';

const PRESETS = [
  { label: 'Dourados Centro', lat: -22.2233, lng: -54.8083 },
  { label: 'São Paulo - Vila Madalena', lat: -23.5534, lng: -46.6913 },
];

export default function DevSettingsScreen() {
  const { colors, spacing, typography, isDark } = useTheme();

  const { devOverride, devLat, devLng, setDevOverride, clearDevOverride } = useLocationStore();
  const { activeCheckIn } = useCheckInStore();

  const [latInput, setLatInput] = useState(
    devOverride && devLat !== null ? String(devLat) : ''
  );
  const [lngInput, setLngInput] = useState(
    devOverride && devLng !== null ? String(devLng) : ''
  );

  const [simVenueId, setSimVenueId] = useState('');
  const [simLoading, setSimLoading] = useState(false);

  const handleActivate = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Erro', 'Insira valores numéricos válidos para latitude e longitude.');
      return;
    }

    if (lat < -90 || lat > 90) {
      Alert.alert('Erro', 'Latitude deve estar entre -90 e 90.');
      return;
    }

    if (lng < -180 || lng > 180) {
      Alert.alert('Erro', 'Longitude deve estar entre -180 e 180.');
      return;
    }

    const currentVenues = useVenueStore.getState().venues.length;
    const proceed = () => {
      setDevOverride(lat, lng);
      useVenueStore.getState().clearVenues();
      console.warn(`[DevSettings] Override ativado: lat=${lat}, lng=${lng} — cache cleared, Places API will be called`);
    };

    if (currentVenues > 0) {
      Alert.alert(
        'Limpar cache de venues?',
        `Isso vai descartar ${currentVenues} venues em cache e disparar uma nova chamada à Google Places API.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', style: 'destructive', onPress: proceed },
        ]
      );
    } else {
      proceed();
    }
  };

  const handleDeactivate = () => {
    const currentVenues = useVenueStore.getState().venues.length;
    const proceed = () => {
      clearDevOverride();
      useVenueStore.getState().clearVenues();
      console.warn('[DevSettings] Override desativado — cache cleared, Places API will be called with real GPS');
    };

    if (currentVenues > 0) {
      Alert.alert(
        'Limpar cache de venues?',
        `Isso vai descartar ${currentVenues} venues em cache e disparar uma nova chamada à Google Places API ao restaurar GPS real.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', style: 'destructive', onPress: proceed },
        ]
      );
    } else {
      proceed();
    }
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setLatInput(String(preset.lat));
    setLngInput(String(preset.lng));
  };

  const handleSimulateUser = async () => {
    const venueId = simVenueId.trim();
    if (!venueId) {
      Alert.alert('Erro', 'Insira um Venue ID válido.');
      return;
    }

    setSimLoading(true);
    try {
      const fakeUserId = crypto.randomUUID();

      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: fakeUserId,
          email: `dev-test-${Date.now()}@test.local`,
          first_name: 'Dev',
          last_name: 'Tester',
          date_of_birth: '1990-01-01',
        });

      if (userError) {
        Alert.alert('Erro ao criar usuário', userError.message + '\n\nDica: RLS pode estar bloqueando o insert. Use o SQL Editor do Supabase como alternativa.');
        return;
      }

      const { error: checkInError } = await supabase
        .from('check_ins')
        .insert({
          user_id: fakeUserId,
          venue_id: venueId,
          is_active: true,
          visibility: 'public',
          checked_in_at: new Date().toISOString(),
        });

      if (checkInError) {
        // Cleanup orphan user if check-in insert failed
        await supabase.from('users').delete().eq('id', fakeUserId);
        Alert.alert('Erro ao criar check-in', checkInError.message);
        return;
      }

      Alert.alert('Sucesso', 'Usuário simulado criado! Volte ao venue para ver no roster.');
      console.log(`[DEV] Simulated user created: ${fakeUserId} at venue ${venueId}`);
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Erro inesperado');
    } finally {
      setSimLoading(false);
    }
  };

  const handleCleanupTestUsers = async () => {
    setSimLoading(true);
    try {
      const { data: devUsers, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .like('email', 'dev-test-%@test.local');

      if (fetchError) {
        Alert.alert('Erro', fetchError.message);
        return;
      }

      if (!devUsers?.length) {
        Alert.alert('Limpeza', 'Nenhum usuário de teste encontrado.');
        return;
      }

      const ids = devUsers.map((u: { id: string }) => u.id);
      await supabase.from('check_ins').delete().in('user_id', ids);
      await supabase.from('users').delete().in('id', ids);

      Alert.alert('Limpeza', `${ids.length} usuário(s) de teste removido(s).`);
      console.log(`[DEV] Cleaned up ${ids.length} test user(s)`);
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Erro inesperado');
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={[styles.header, { padding: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xl }]}>
          Dev Settings
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
          Simule coordenadas GPS para testar venue discovery.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>

        {/* Override Status */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Status
          </Text>
          <View style={[styles.list, { borderColor: colors.border }]}>
            <View style={styles.row}>
              <View style={[styles.statusDot, { backgroundColor: devOverride ? '#22c55e' : '#ef4444' }]} />
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                {devOverride ? 'Override ativo' : 'Override inativo'}
              </Text>
            </View>
            {devOverride && devLat !== null && devLng !== null && (
              <View style={[styles.row, styles.rowDivider, { borderColor: colors.border }]}>
                <Text style={[styles.coordsText, { color: colors.textSecondary }]}>
                  {`lat: ${devLat.toFixed(4)}, lng: ${devLng.toFixed(4)}`}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Coordinate Inputs */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Coordenadas de Teste
          </Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Latitude
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={latInput}
              onChangeText={setLatInput}
              placeholder="-22.2233"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Longitude
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={lngInput}
              onChangeText={setLngInput}
              placeholder="-54.8083"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Toggle Button */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
          {devOverride ? (
            <TouchableOpacity
              style={[styles.toggleButton, styles.deactivateButton]}
              onPress={handleDeactivate}
            >
              <Text style={styles.toggleButtonText}>Desativar override</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.toggleButton, styles.activateButton, { backgroundColor: colors.primary }]}
              onPress={handleActivate}
            >
              <Text style={styles.toggleButtonText}>Ativar override</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Presets */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Presets
          </Text>
          <View style={[styles.list, { borderColor: colors.border }]}>
            {PRESETS.map((preset, index) => (
              <TouchableOpacity
                key={preset.label}
                style={[
                  styles.row,
                  index < PRESETS.length - 1 && styles.rowDivider,
                  index < PRESETS.length - 1 && { borderColor: colors.border },
                ]}
                onPress={() => applyPreset(preset)}
              >
                <View style={styles.presetInfo}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>
                    {preset.label}
                  </Text>
                  <Text style={[styles.coordsText, { color: colors.textSecondary }]}>
                    {`${preset.lat}, ${preset.lng}`}
                  </Text>
                </View>
                <Text style={[styles.presetArrow, { color: colors.textSecondary }]}>
                  →
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Toque para preencher os campos de coordenadas.
          </Text>
        </View>

        {/* Active check-in venue ID for easy copy */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg, paddingTop: spacing.lg }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Check-in Ativo
          </Text>
          <View style={[styles.list, { borderColor: colors.border }]}>
            <View style={styles.row}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary, flex: 1 }]}>
                Venue ID do check-in ativo
              </Text>
            </View>
            <View style={[styles.row, styles.rowDivider, { borderColor: colors.border }]}>
              <Text
                style={[styles.coordsText, { color: colors.text, flex: 1 }]}
                selectable
              >
                {activeCheckIn?.venue_id ?? 'Nenhum check-in ativo'}
              </Text>
            </View>
          </View>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Segure para copiar o venue_id após fazer check-in.
          </Text>
        </View>

        {/* Simular Usuario section */}
        {__DEV__ && (
          <View style={[styles.section, { paddingHorizontal: spacing.lg, paddingTop: spacing.lg }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Simular Usuário
            </Text>

            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Venue ID (UUID)
              </Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={simVenueId}
                onChangeText={setSimVenueId}
                placeholder="ex: 3fa85f64-5717-4562-b3fc-2c963f66afa6"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              Cole o venue_id do banco de dados. Você pode encontrar no campo &quot;Check-in Ativo&quot; acima após fazer check-in.
            </Text>

            <TouchableOpacity
              style={[styles.toggleButton, styles.activateButton, { backgroundColor: colors.primary }, simLoading && styles.buttonDisabled]}
              onPress={handleSimulateUser}
              disabled={simLoading}
            >
              {simLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.toggleButtonText}>Simular check-in</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleButton, styles.cleanupButton, simLoading && styles.buttonDisabled]}
              onPress={handleCleanupTestUsers}
              disabled={simLoading}
            >
              {simLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.toggleButtonText}>Limpar usuários de teste</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

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
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  coordsText: {
    fontSize: 13,
    fontFamily: 'monospace',
  },
  inputContainer: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: {
    fontSize: 16,
    paddingVertical: 2,
  },
  toggleButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  activateButton: {},
  deactivateButton: {
    backgroundColor: '#ef4444',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  presetInfo: {
    flex: 1,
    gap: 2,
  },
  presetArrow: {
    fontSize: 18,
    marginLeft: 8,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
  },
  cleanupButton: {
    backgroundColor: '#6b7280',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
