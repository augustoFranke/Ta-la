/**
 * Tela de edição de interesses
 * Permite ao usuário atualizar seus interesses
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../../src/theme';
import { Button } from '../../../src/components/ui/Button';
import { useProfile } from '../../../src/hooks/useProfile';

const MIN_INTERESTS = 3;
const MAX_INTERESTS = 10;

// Lista de interesses pré-definidos (same as onboarding)
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

export default function EditInterestsScreen() {
  const router = useRouter();
  const { colors, spacing, typography, isDark } = useTheme();
  const { interests, updateInterests, isLoading } = useProfile({ autoFetch: true });

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize selected interests from current user interests
  useEffect(() => {
    if (interests.length > 0) {
      setSelectedInterests(interests.map((i) => i.tag));
    }
  }, [interests]);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      // Remove
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      // Add (if not at max)
      if (selectedInterests.length >= MAX_INTERESTS) {
        Alert.alert('Limite atingido', `Você pode selecionar no máximo ${MAX_INTERESTS} interesses`);
        return;
      }
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSave = async () => {
    if (selectedInterests.length < MIN_INTERESTS) {
      Alert.alert('Selecione mais', `Escolha pelo menos ${MIN_INTERESTS} interesses`);
      return;
    }

    setIsSaving(true);
    const result = await updateInterests(selectedInterests);
    setIsSaving(false);

    if (result.success) {
      router.back();
    } else {
      Alert.alert('Erro', result.error || 'Não foi possível salvar os interesses');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
          Escolha pelo menos {MIN_INTERESTS} interesses para encontrar pessoas compatíveis
        </Text>
      </View>

      {/* Interests List */}
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
                      fontWeight: isSelected ? '600' : '400',
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

      {/* Footer */}
      <View style={[styles.footer, { padding: spacing.lg }]}>
        <Text style={[styles.counter, { color: colors.textSecondary }]}>
          {selectedInterests.length} de {MIN_INTERESTS} mínimo selecionados
        </Text>
        <View style={styles.buttonRow}>
          <Button
            title="Cancelar"
            variant="outline"
            onPress={handleCancel}
            style={styles.cancelButton}
          />
          <Button
            title="Salvar"
            onPress={handleSave}
            loading={isSaving}
            disabled={selectedInterests.length < MIN_INTERESTS || isSaving}
            style={styles.saveButton}
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
    paddingTop: 16,
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
  },
  footer: {},
  counter: {
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});
