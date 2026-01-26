/**
 * Tela de informações pessoais do onboarding
 * Nome, data de nascimento, bio e ocupação
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../../src/theme';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { OnboardingProgress } from '../../../src/components/common/OnboardingProgress';
import { useAuthStore } from '../../../src/stores/authStore';

// Formata data para DD/MM/AAAA
function formatDate(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) {
    return numbers;
  }
  if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  }
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
}

// Converte DD/MM/AAAA para AAAA-MM-DD
function parseDate(formatted: string): string | null {
  const parts = formatted.split('/');
  if (parts.length !== 3) return null;

  const [day, month, year] = parts;
  if (!day || !month || !year || year.length !== 4) return null;

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Calcula idade
function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

export default function BioScreen() {
  const router = useRouter();
  const { colors, spacing, typography, isDark } = useTheme();
  const { setOnboardingBio } = useAuthStore();

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [bio, setBio] = useState('');
  const [occupation, setOccupation] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Nome obrigatório
    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Nome muito curto';
    }

    // Data de nascimento obrigatória e válida
    const parsedDate = parseDate(birthDate);
    if (!birthDate.trim()) {
      newErrors.birthDate = 'Data de nascimento é obrigatória';
    } else if (!parsedDate) {
      newErrors.birthDate = 'Data inválida (use DD/MM/AAAA)';
    } else {
      const age = calculateAge(parsedDate);
      if (age < 18) {
        newErrors.birthDate = 'Você precisa ter 18 anos ou mais';
      } else if (age > 120) {
        newErrors.birthDate = 'Data de nascimento inválida';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateForm()) return;

    const parsedDate = parseDate(birthDate);
    if (!parsedDate) {
      Alert.alert('Erro', 'Data de nascimento inválida');
      return;
    }

    // Salva no store
    setOnboardingBio({
      name: name.trim(),
      birth_date: parsedDate,
      bio: bio.trim(),
      occupation: occupation.trim(),
    });

    // Navega para próxima tela
    router.push('/(auth)/onboarding/interests');
  };

  const parsedDate = parseDate(birthDate);
  const age = parsedDate ? calculateAge(parsedDate) : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Progresso */}
      <OnboardingProgress currentStep={2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xl }]}>
              Conte sobre você
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
              Essas informações ajudam outras pessoas a te conhecerem melhor
            </Text>
          </View>

          {/* Formulário */}
          <View style={styles.form}>
            <Input
              label="Como quer ser chamado(a)?"
              placeholder="Seu nome"
              value={name}
              onChangeText={setName}
              error={errors.name}
              autoCapitalize="words"
              maxLength={50}
            />

            <Input
              label="Data de nascimento"
              placeholder="DD/MM/AAAA"
              value={birthDate}
              onChangeText={(text) => setBirthDate(formatDate(text))}
              error={errors.birthDate}
              keyboardType="number-pad"
              maxLength={10}
            />

            {age !== null && age >= 18 && age <= 120 && (
              <Text style={[styles.ageLabel, { color: colors.textSecondary }]}>
                {age} anos
              </Text>
            )}

            <Input
              label="O que você faz?"
              placeholder="Sua ocupação (ex: Designer, Estudante...)"
              value={occupation}
              onChangeText={setOccupation}
              autoCapitalize="words"
              maxLength={50}
            />

            <Input
              label="Sobre você (opcional)"
              placeholder="Uma breve descrição sobre você..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              maxLength={300}
              style={styles.bioInput}
            />

            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {bio.length}/300
            </Text>
          </View>
        </ScrollView>

        {/* Botão */}
        <View style={[styles.buttonContainer, { padding: spacing.lg }]}>
          <Button
            title="Continuar"
            onPress={handleNext}
            disabled={!name.trim() || !birthDate.trim()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  ageLabel: {
    fontSize: 14,
    marginTop: -12,
    marginBottom: 16,
  },
  bioInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: -12,
  },
  buttonContainer: {},
});
