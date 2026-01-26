/**
 * Tela de preferências do onboarding
 * Gênero e preferência de gênero para matches
 */

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../../src/theme';
import { Button } from '../../../src/components/ui/Button';
import { OnboardingProgress } from '../../../src/components/common/OnboardingProgress';
import { useAuthStore } from '../../../src/stores/authStore';
import { useAuth } from '../../../src/hooks/useAuth';
import type { Gender, GenderPreference } from '../../../src/types/database';

interface OptionButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: any;
}

function OptionButton({ label, selected, onPress, colors }: OptionButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.optionButton,
        {
          backgroundColor: selected ? colors.primary : colors.card,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.optionLabel,
          {
            color: selected ? colors.onPrimary : colors.text,
            fontWeight: selected ? '600' : '400',
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function PreferencesScreen() {
  const router = useRouter();
  const { colors, spacing, typography, isDark } = useTheme();
  const { setOnboardingPreferences } = useAuthStore();

  const [gender, setGender] = useState<Gender | null>(null);
  const [genderPreference, setGenderPreference] = useState<GenderPreference | null>(null);

  const handleNext = () => {
    if (!gender || !genderPreference) {
      Alert.alert('Selecione as opções', 'Por favor, selecione seu gênero e preferência');
      return;
    }

    // Salva no store
    setOnboardingPreferences({ gender, gender_preference: genderPreference });

    // Navega para a próxima tela (permissões)
    router.push('/(auth)/onboarding/permissions');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Progresso */}
      <OnboardingProgress currentStep={4} />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xl }]}>
          Últimos detalhes
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
          Essas informações ajudam a encontrar pessoas compatíveis
        </Text>
      </View>

      {/* Seleção de gênero */}
      <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.sizes.md }]}>
          Eu sou
        </Text>
        <View style={styles.optionsRow}>
          <OptionButton
            label="Homem"
            selected={gender === 'masculino'}
            onPress={() => setGender('masculino')}
            colors={colors}
          />
          <OptionButton
            label="Mulher"
            selected={gender === 'feminino'}
            onPress={() => setGender('feminino')}
            colors={colors}
          />
          <OptionButton
            label="Outro"
            selected={gender === 'outro'}
            onPress={() => setGender('outro')}
            colors={colors}
          />
        </View>
      </View>

      {/* Seleção de preferência */}
      <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.sizes.md }]}>
          Quero conhecer
        </Text>
        <View style={styles.optionsRow}>
          <OptionButton
            label="Homens"
            selected={genderPreference === 'masculino'}
            onPress={() => setGenderPreference('masculino')}
            colors={colors}
          />
          <OptionButton
            label="Mulheres"
            selected={genderPreference === 'feminino'}
            onPress={() => setGenderPreference('feminino')}
            colors={colors}
          />
          <OptionButton
            label="Todos"
            selected={genderPreference === 'todos'}
            onPress={() => setGenderPreference('todos')}
            colors={colors}
          />
        </View>
      </View>

      {/* Nota sobre privacidade */}
      <View style={[styles.noteContainer, { paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.note, { color: colors.textSecondary, fontSize: typography.sizes.sm }]}>
          Essas informações são usadas apenas para mostrar pessoas compatíveis. Você pode alterar a qualquer momento nas configurações.
        </Text>
      </View>

      {/* Botão */}
      <View style={[styles.buttonContainer, { padding: spacing.lg }]}>
        <Button
          title="Continuar"
          onPress={handleNext}
          disabled={!gender || !genderPreference}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 24,
    marginBottom: 32,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 15,
  },
  noteContainer: {
    marginTop: 'auto',
    marginBottom: 16,
  },
  note: {
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {},
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
  },
});
