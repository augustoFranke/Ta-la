/**
 * Tela de Chat
 * Lista de conversas com matches
 */

import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../src/theme';

export default function ChatScreen() {
  const { colors, spacing, typography, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { padding: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xl }]}>
          Conversas
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
          Continue de onde parou
        </Text>
      </View>

      {/* Conteúdo placeholder */}
      <View style={[styles.content, { padding: spacing.lg }]}>
        <View style={[styles.placeholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.placeholderEmoji]}>💬</Text>
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
            Suas conversas aparecerão aqui
          </Text>
          <Text style={[styles.placeholderSubtext, { color: colors.textSecondary }]}>
            Fase 12 - Chat em tempo real
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
