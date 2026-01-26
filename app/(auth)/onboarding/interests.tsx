/**
 * Tela de seleção de interesses do onboarding
 * Mínimo 3 interesses
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../../src/theme';
import { Button } from '../../../src/components/ui/Button';
import { OnboardingProgress } from '../../../src/components/common/OnboardingProgress';
import { useAuthStore } from '../../../src/stores/authStore';

const MIN_INTERESTS = 3;
const MAX_INTERESTS = 10;

// Lista de interesses pré-definidos
const AVAILABLE_INTERESTS = [
  // Música e entretenimento
  { emoji: '🎵', label: 'Música' },
  { emoji: '🎬', label: 'Filmes' },
  { emoji: '📺', label: 'Séries' },
  { emoji: '🎮', label: 'Games' },
  { emoji: '🎤', label: 'Karaokê' },
  { emoji: '🎸', label: 'Shows' },

  // Comida e bebida
  { emoji: '🍺', label: 'Cerveja' },
  { emoji: '🍷', label: 'Vinho' },
  { emoji: '🍹', label: 'Drinks' },
  { emoji: '☕', label: 'Café' },
  { emoji: '🍕', label: 'Pizza' },
  { emoji: '🍔', label: 'Hambúrguer' },
  { emoji: '🍣', label: 'Comida japonesa' },
  { emoji: '🌮', label: 'Comida mexicana' },

  // Esportes e atividades
  { emoji: '⚽', label: 'Futebol' },
  { emoji: '🏋️', label: 'Academia' },
  { emoji: '🏃', label: 'Corrida' },
  { emoji: '🚴', label: 'Ciclismo' },
  { emoji: '🏊', label: 'Natação' },
  { emoji: '🧘', label: 'Yoga' },

  // Hobbies
  { emoji: '📚', label: 'Leitura' },
  { emoji: '✈️', label: 'Viagens' },
  { emoji: '📷', label: 'Fotografia' },
  { emoji: '🎨', label: 'Arte' },
  { emoji: '🍳', label: 'Cozinhar' },
  { emoji: '🌱', label: 'Plantas' },
  { emoji: '🐕', label: 'Cachorros' },
  { emoji: '🐱', label: 'Gatos' },

  // Social
  { emoji: '💬', label: 'Conversar' },
  { emoji: '🎉', label: 'Festas' },
  { emoji: '🕺', label: 'Dançar' },
  { emoji: '🎲', label: 'Jogos de tabuleiro' },
];

export default function InterestsScreen() {
  const router = useRouter();
  const { colors, spacing, typography, isDark } = useTheme();
  const { setOnboardingInterests } = useAuthStore();

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      // Remove
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      // Adiciona (se não excedeu o máximo)
      if (selectedInterests.length >= MAX_INTERESTS) {
        Alert.alert('Limite atingido', `Você pode selecionar no máximo ${MAX_INTERESTS} interesses`);
        return;
      }
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleNext = () => {
    if (selectedInterests.length < MIN_INTERESTS) {
      Alert.alert('Selecione mais', `Escolha pelo menos ${MIN_INTERESTS} interesses`);
      return;
    }

    // Salva no store
    setOnboardingInterests(selectedInterests);

    // Navega para próxima tela
    router.push('/(auth)/onboarding/preferences');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Progresso */}
      <OnboardingProgress currentStep={3} />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xl }]}>
          O que você curte?
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
          Escolha pelo menos {MIN_INTERESTS} interesses para encontrar pessoas compatíveis
        </Text>
      </View>

      {/* Lista de interesses */}
      <ScrollView
        contentContainerStyle={[styles.interestsContainer, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.interestsGrid}>
          {AVAILABLE_INTERESTS.map((interest) => {
            const isSelected = selectedInterests.includes(interest.label);

            return (
              <TouchableOpacity
                key={interest.label}
                style={[
                  styles.interestTag,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => toggleInterest(interest.label)}
                activeOpacity={0.7}
              >
                <Text style={styles.interestEmoji}>{interest.emoji}</Text>
                <Text
                  style={[
                    styles.interestLabel,
                    {
                      color: isSelected ? colors.onPrimary : colors.text,
                    },
                  ]}
                >
                  {interest.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Contador e botão */}
      <View style={[styles.footer, { padding: spacing.lg }]}>
        <Text style={[styles.counter, { color: colors.textSecondary }]}>
          {selectedInterests.length} de {MIN_INTERESTS} mínimo selecionados
        </Text>
        <Button
          title="Continuar"
          onPress={handleNext}
          disabled={selectedInterests.length < MIN_INTERESTS}
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
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 24,
  },
  interestsContainer: {
    flexGrow: 1,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  interestEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  interestLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {},
  counter: {
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
  },
});
