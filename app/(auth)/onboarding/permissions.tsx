import { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme';
import { Button } from '../../../src/components/ui/Button';
import { OnboardingProgress } from '../../../src/components/common/OnboardingProgress';
import { useAuth } from '../../../src/hooks/useAuth';
import { useLocationStore } from '../../../src/stores/locationStore';

export default function PermissionsScreen() {
  const router = useRouter();
  const { colors, spacing, typography, isDark } = useTheme();
  const { completeOnboarding, isLoading: authLoading } = useAuth();
  const getCurrentLocation = useLocationStore((state) => state.getCurrentLocation);
  const [locLoading, setLocLoading] = useState(false);

  const handleEnableLocation = async () => {
    setLocLoading(true);
    const coords = await getCurrentLocation();
    setLocLoading(false);

    if (coords) {
      handleFinish();
    } else {
       // Permissão negada ou erro, mas vamos tentar finalizar mesmo assim? 
       // Ou avisar o usuário?
       // Vamos avisar e permitir continuar
       Alert.alert(
           "Localização não obtida",
           "Não conseguimos obter sua localização. Você poderá ativar isso depois nas configurações.",
           [
               { text: "OK", onPress: handleFinish }
           ]
       );
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = async () => {
    const result = await completeOnboarding();

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Erro', result.error || 'Não foi possível finalizar o cadastro');
    }
  };

  const isLoading = authLoading || locLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <OnboardingProgress currentStep={5} />

      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xl }]}>
          Ativar localização
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
          Para encontrar os melhores lugares e pessoas perto de você.
        </Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
          <Ionicons name="location" size={64} color={colors.primary} />
        </View>
      </View>

      <View style={[styles.footer, { padding: spacing.lg }]}>
        {isLoading ? (
           <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {locLoading ? "Obtendo localização..." : "Criando seu perfil..."}
            </Text>
          </View>
        ) : (
          <>
            <Button
              title="Permitir localização"
              onPress={handleEnableLocation}
              style={{ marginBottom: 12 }}
            />
            <Button
              title="Agora não"
              variant="outline"
              onPress={handleSkip}
            />
          </>
        )}
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    marginTop: 'auto',
  },
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
