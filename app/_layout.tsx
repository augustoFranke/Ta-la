/**
 * Layout raiz do aplicativo
 * Gerencia o redirect automático baseado no estado de autenticação
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../src/hooks/useAuth';
import { ThemeProvider, useTheme } from '../src/theme';

function LoadingScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <Text style={[styles.loadingLogo, { color: colors.primary }]}>Tá lá!</Text>
      <ActivityIndicator color={colors.primary} size="large" style={styles.loadingIndicator} />
    </View>
  );
}

function useProtectedRoute() {
  const { isInitialized, isAuthenticated, needsOnboarding, session } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = (segments as string[]).length > 1 && (segments as string[])[1] === 'onboarding';

    if (!session) {
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
      }
      return;
    }

    if (needsOnboarding) {
      if (!inOnboarding) {
        router.replace('/(auth)/onboarding/photos');
      }
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isInitialized, isAuthenticated, needsOnboarding, session, segments, router]);
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}

function RootLayoutContent() {
  const { isInitialized } = useAuth();
  const { colors } = useTheme();

  useProtectedRoute();

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
        <Stack.Screen
          name="user/[id]"
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
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
