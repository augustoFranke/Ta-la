/**
 * Layout para fluxo de onboarding
 * Stack navigator com indicador de progresso
 */

import { Stack } from 'expo-router';
import { useTheme } from '../../../src/theme';

export default function OnboardingLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
        gestureEnabled: false, // Impede voltar por gesto durante onboarding
      }}
    >
      <Stack.Screen name="photos" />
      <Stack.Screen name="bio" />
      <Stack.Screen name="interests" />
      <Stack.Screen name="preferences" />
    </Stack>
  );
}
