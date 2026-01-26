/**
 * Tela de login
 * Input de email para envio de OTP
 */

import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useAuth } from '../../src/hooks/useAuth';

// Validação básica de email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export default function LoginScreen() {
  const router = useRouter();
  const { colors, spacing, typography, isDark } = useTheme();
  const { sendOTP, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setError('');
  };

  const handleSendOTP = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!isValidEmail(trimmedEmail)) {
      setError('Email inválido');
      return;
    }

    const result = await sendOTP(trimmedEmail);

    if (result.success) {
      // Navega para tela de verificação passando o email
      router.push({
        pathname: '/(auth)/verify',
        params: { email: result.email },
      });
    } else {
      Alert.alert('Erro', result.error || 'Não foi possível enviar o código');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
          <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xl }]}>
            Qual seu email?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
            Vamos enviar um código de verificação para você
          </Text>
        </View>

        {/* Formulário */}
        <View style={[styles.form, { paddingHorizontal: spacing.lg }]}>
          <Input
            placeholder="seu@email.com"
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={error}
            autoFocus
          />

          <Text style={[styles.hint, { color: colors.textSecondary, fontSize: typography.sizes.sm }]}>
            Usamos seu email apenas para verificar sua identidade. Nunca compartilhamos com ninguém.
          </Text>
        </View>

        {/* Botão */}
        <View style={[styles.buttonContainer, { padding: spacing.lg }]}>
          <Button
            title="Enviar código"
            onPress={handleSendOTP}
            loading={isLoading}
            disabled={!isValidEmail(email)}
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
  header: {
    paddingTop: 40,
    marginBottom: 32,
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
  hint: {
    marginTop: 8,
    lineHeight: 20,
  },
  buttonContainer: {},
});
