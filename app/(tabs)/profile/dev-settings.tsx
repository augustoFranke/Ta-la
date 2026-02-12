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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../../src/theme';
import { useLocationStore } from '../../../src/stores/locationStore';
import { useVenueStore } from '../../../src/stores/venueStore';

const PRESETS = [
  { label: 'Dourados Centro', lat: -22.2233, lng: -54.8083 },
  { label: 'São Paulo - Vila Madalena', lat: -23.5534, lng: -46.6913 },
];

export default function DevSettingsScreen() {
  const { colors, spacing, typography, isDark } = useTheme();

  const { devOverride, devLat, devLng, setDevOverride, clearDevOverride } = useLocationStore();

  const [latInput, setLatInput] = useState(
    devOverride && devLat !== null ? String(devLat) : ''
  );
  const [lngInput, setLngInput] = useState(
    devOverride && devLng !== null ? String(devLng) : ''
  );

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

    setDevOverride(lat, lng);
    useVenueStore.getState().clearVenues();
    console.log(`[DevSettings] Override ativado: lat=${lat}, lng=${lng}`);
  };

  const handleDeactivate = () => {
    clearDevOverride();
    useVenueStore.getState().clearVenues();
    console.log('[DevSettings] Override desativado — restaurando GPS real');
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setLatInput(String(preset.lat));
    setLngInput(String(preset.lng));
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
});
