/**
 * Tela Descobrir
 * Lista de usuários no local atual
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../src/theme';
import { useLocationStore } from '../../src/stores/locationStore';
import { getCurrentLocation } from '../../src/services/location';

export default function DiscoverScreen() {
  const { colors, spacing, typography, isDark } = useTheme();
  const { latitude, longitude, errorMsg } = useLocationStore();

  useEffect(() => {
    // Tenta obter localização ao entrar na tela se ainda não tiver
    if (!latitude || !longitude) {
      getCurrentLocation();
    }
  }, [latitude, longitude]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { padding: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xl }]}>
          Descobrir
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
          Veja quem está por perto
        </Text>
      </View>

      {/* Conteúdo placeholder */}
      <View style={[styles.content, { padding: spacing.lg }]}>
        <View style={[styles.placeholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.placeholderEmoji]}>📍</Text>
          
          {latitude && longitude ? (
             <View>
                 <Text style={[styles.placeholderText, { color: colors.text, textAlign: 'center' }]}>
                   Sua localização:
                 </Text>
                 <Text style={[styles.placeholderSubtext, { color: colors.textSecondary, textAlign: 'center' }]}>
                   Lat: {latitude.toFixed(4)}, Long: {longitude.toFixed(4)}
                 </Text>
             </View>
          ) : (
             <Text style={[styles.placeholderText, { color: colors.textSecondary, textAlign: 'center' }]}>
               {errorMsg ? `Erro: ${errorMsg}` : "Obtendo localização..."}
             </Text>
          )}

          <Text style={[styles.placeholderText, { color: colors.textSecondary, marginTop: 16, textAlign: 'center' }]}>
            Em breve: Bares e pessoas próximas.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {},
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {},
  content: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
