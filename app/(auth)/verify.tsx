/**
 * Tela de verificação OTP
 * Input de código de 6 dígitos enviado por email
 */

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/hooks/useAuth';

const CODE_LENGTH = 6;

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { colors, spacing, typography, isDark } = useTheme();
  const { verifyOTP, sendOTP, isLoading } = useAuth();

  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const inputRef = useRef<TextInput>(null);

  // Countdown para reenvio
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Foca no input ao montar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCodeChange = (text: string) => {
    const numbers = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(numbers);

    // Auto-submit quando completar
    if (numbers.length === CODE_LENGTH) {
      handleVerify(numbers);
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const finalCode = codeToVerify || code;
    if (finalCode.length !== CODE_LENGTH || !email) return;

    const result = await verifyOTP(email, finalCode);

    if (result.success) {
      // Verificar se precisa de onboarding ou ir para home
      // O redirect é feito automaticamente pelo auth listener
    } else {
      Alert.alert('Código inválido', result.error || 'Verifique o código e tente novamente');
      setCode('');
    }
  };

  const handleResend = async () => {
    if (!email || countdown > 0) return;

    const result = await sendOTP(email);
    if (result.success) {
      setCountdown(60);
      Alert.alert('Código reenviado', 'Verifique sua caixa de entrada');
    } else {
      Alert.alert('Erro', result.error || 'Não foi possível reenviar o código');
    }
  };

  // Renderiza os quadrados do código
  const renderCodeBoxes = () => {
    const boxes = [];
    for (let i = 0; i < CODE_LENGTH; i++) {
      const digit = code[i] || '';
      const isActive = i === code.length;

      boxes.push(
        <View
          key={i}
          style={[
            styles.codeBox,
            {
              backgroundColor: colors.card,
              borderColor: isActive ? colors.primary : colors.border,
              borderWidth: isActive ? 2 : 1,
            },
          ]}
        >
          <Text style={[styles.codeDigit, { color: colors.text, fontSize: typography.sizes.xl }]}>
            {digit}
          </Text>
        </View>
      );
    }
    return boxes;
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
            Digite o código
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
            Enviamos um código de 6 dígitos para{'\n'}
            <Text style={{ color: colors.text, fontWeight: '600' }}>{email}</Text>
          </Text>
        </View>

        {/* Input de código (invisível, mas funcional) */}
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={code}
          onChangeText={handleCodeChange}
          keyboardType="number-pad"
          maxLength={CODE_LENGTH}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
        />

        {/* Boxes visuais do código */}
        <TouchableOpacity
          style={[styles.codeContainer, { paddingHorizontal: spacing.lg }]}
          onPress={() => inputRef.current?.focus()}
          activeOpacity={1}
        >
          {renderCodeBoxes()}
        </TouchableOpacity>

        {/* Reenviar código */}
        <View style={[styles.resendContainer, { paddingHorizontal: spacing.lg }]}>
          {countdown > 0 ? (
            <Text style={[styles.resendText, { color: colors.textSecondary }]}>
              Reenviar código em {countdown}s
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={isLoading}>
              <Text style={[styles.resendLink, { color: colors.primary }]}>
                Reenviar código
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dica sobre spam */}
        <View style={[styles.spamHint, { paddingHorizontal: spacing.lg }]}>
          <Text style={[styles.spamHintText, { color: colors.textSecondary, fontSize: typography.sizes.sm }]}>
            Não recebeu? Verifique sua pasta de spam
          </Text>
        </View>

        {/* Botão de verificação manual */}
        <View style={[styles.buttonContainer, { padding: spacing.lg }]}>
          <Button
            title="Verificar"
            onPress={() => handleVerify()}
            loading={isLoading}
            disabled={code.length !== CODE_LENGTH}
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
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  codeBox: {
    width: 38,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeDigit: {
    fontWeight: '700',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  spamHint: {
    alignItems: 'center',
    marginBottom: 24,
  },
  spamHintText: {
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 'auto',
  },
});
