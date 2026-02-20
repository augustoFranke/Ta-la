/**
 * Verificação de telefone via OTP (Spec 003)
 * OTP expira em 10 min; máx 5 tentativas; bloqueio 30 min após exceder
 */

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../../src/theme';
import { Button } from '../../../src/components/ui/Button';
import { OnboardingProgress } from '../../../src/components/common/OnboardingProgress';
import { useAuthStore } from '../../../src/stores/authStore';
import { supabase } from '../../../src/services/supabase';

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;
const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes
const RESEND_COOLDOWN_S = 60;

type PhoneStep = 'enter_phone' | 'enter_code';

export default function PhoneScreen() {
  const router = useRouter();
  const { colors, spacing, typography, isDark } = useTheme();
  const { setOnboardingPhone } = useAuthStore();

  const [step, setStep] = useState<PhoneStep>('enter_phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [otpSentAt, setOtpSentAt] = useState<number | null>(null);

  const codeInputRef = useRef<TextInput>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startResendCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN_S);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatPhone = (raw: string): string => {
    // Keep only digits
    const digits = raw.replace(/\D/g, '');
    // Format as +55 (XX) XXXXX-XXXX
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 9) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 11);
    setPhone(formatPhone(digits));
  };

  const getRawPhone = () => `+55${phone.replace(/\D/g, '')}`;

  const isPhoneValid = () => phone.replace(/\D/g, '').length === 11;

  const isLocked = () => lockedUntil !== null && Date.now() < lockedUntil;

  const getLockoutMessage = () => {
    if (!lockedUntil) return '';
    const remaining = Math.ceil((lockedUntil - Date.now()) / 60000);
    return `Tente novamente em ${remaining} minuto${remaining !== 1 ? 's' : ''}.`;
  };

  const isOtpExpired = () => {
    if (!otpSentAt) return false;
    return Date.now() - otpSentAt > OTP_EXPIRY_MS;
  };

  const sendOtp = async () => {
    if (!isPhoneValid()) {
      Alert.alert('Número inválido', 'Insira um número de celular válido com DDD.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: getRawPhone(),
      });

      if (error) throw error;

      setOtpSentAt(Date.now());
      setStep('enter_code');
      startResendCooldown();
      setTimeout(() => codeInputRef.current?.focus(), 300);
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar o código. Verifique o número e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (isLocked()) {
      Alert.alert('Conta bloqueada', getLockoutMessage());
      return;
    }

    if (isOtpExpired()) {
      Alert.alert('Código expirado', 'O código expirou. Solicite um novo código.');
      setCode('');
      return;
    }

    if (code.length !== 6) {
      Alert.alert('Código inválido', 'Insira o código de 6 dígitos.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: getRawPhone(),
        token: code,
        type: 'sms',
      });

      if (error) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setCode('');

        if (newAttempts >= MAX_OTP_ATTEMPTS) {
          const lockUntil = Date.now() + LOCKOUT_MS;
          setLockedUntil(lockUntil);
          Alert.alert(
            'Muitas tentativas',
            `Você atingiu o limite de ${MAX_OTP_ATTEMPTS} tentativas. ${getLockoutMessage()}`
          );
        } else {
          const remaining = MAX_OTP_ATTEMPTS - newAttempts;
          Alert.alert(
            'Código incorreto',
            `Código inválido. Você tem mais ${remaining} tentativa${remaining !== 1 ? 's' : ''}.`
          );
        }
        return;
      }

      // Success — save phone and proceed
      setOnboardingPhone(getRawPhone());
      router.push('/(auth)/onboarding/bio');
    } catch {
      Alert.alert('Erro', 'Não foi possível verificar o código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setAttempts(0);
    setLockedUntil(null);
    setCode('');
    await sendOtp();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OnboardingProgress currentStep={1} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={[styles.content, { paddingHorizontal: spacing.lg }]}>
          {step === 'enter_phone' ? (
            <>
              <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xl }]}>
                Seu número de celular
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
                Precisamos verificar seu celular para garantir sua segurança.
              </Text>

              <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.countryCode, { color: colors.text }]}>+55</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  placeholder="(11) 99999-9999"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                  maxLength={16}
                  autoFocus
                />
              </View>

              <Button
                title={loading ? 'Enviando...' : 'Enviar código'}
                onPress={sendOtp}
                disabled={loading || !isPhoneValid()}
              />
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xl }]}>
                Código de verificação
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
                Enviamos um código para {phone}. O código expira em 10 minutos.
              </Text>

              {isLocked() ? (
                <View style={[styles.lockedBanner, { backgroundColor: colors.error + '20' }]}>
                  <Text style={[styles.lockedText, { color: colors.error }]}>
                    {getLockoutMessage()}
                  </Text>
                </View>
              ) : null}

              <TextInput
                ref={codeInputRef}
                style={[styles.codeInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                maxLength={6}
              />

              {loading ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
              ) : (
                <Button
                  title="Verificar"
                  onPress={verifyOtp}
                  disabled={code.length !== 6 || isLocked()}
                />
              )}

              <TouchableOpacity
                style={[styles.resendButton, { opacity: resendCooldown > 0 ? 0.5 : 1 }]}
                onPress={handleResend}
                disabled={resendCooldown > 0}
              >
                <Text style={[styles.resendText, { color: colors.primary }]}>
                  {resendCooldown > 0
                    ? `Reenviar em ${resendCooldown}s`
                    : 'Reenviar código'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  content: {
    flex: 1,
    paddingTop: 24,
    gap: 16,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    gap: 8,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  codeInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 64,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 15,
    fontWeight: '600',
  },
  lockedBanner: {
    padding: 12,
    borderRadius: 8,
  },
  lockedText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
