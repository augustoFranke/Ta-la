/**
 * Layout raiz do aplicativo
 * Gerencia o redirect automático baseado no estado de autenticação
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../src/hooks/useAuth';
import { useTheme } from '../src/theme';

// Componente de loading durante inicialização
function LoadingScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <Text style={[styles.loadingLogo, { color: colors.primary }]}>Tá lá!</Text>
      <ActivityIndicator color={colors.primary} size="large" style={styles.loadingIndicator} />
    </View>
  );
}

// Hook para redirect automático
function useProtectedRoute() {
  const { isInitialized, isAuthenticated, needsOnboarding, session } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = (segments as string[]).length > 1 && (segments as string[])[1] === 'onboarding';

    // Usuário não autenticado (sem sessão)
    if (!session) {
      // Se não está na área de auth, redireciona para welcome
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
      }
      return;
    }

    // Usuário autenticado mas precisa completar onboarding
    if (needsOnboarding) {
      // Se não está no onboarding, redireciona
      if (!inOnboarding) {
        router.replace('/(auth)/onboarding/photos');
      }
      return;
    }

    // Usuário autenticado com perfil completo
    if (isAuthenticated) {
      // Se está na área de auth, redireciona para tabs
      if (inAuthGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [isInitialized, isAuthenticated, needsOnboarding, session, segments, router]);
}

export default function RootLayout() {
  const { isInitialized } = useAuth();
  const { colors } = useTheme();

  // Usa o hook de redirect
  useProtectedRoute();

  // Mostra loading enquanto inicializa
  if (!isInitialized) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 24,
  },
  loadingIndicator: {
    marginTop: 16,
  },
});
