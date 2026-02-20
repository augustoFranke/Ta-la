/**
 * Layout para fluxo de onboarding
 * Ordem: photos → bio → interests → preferences → phone → permissions
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
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="photos" />
      <Stack.Screen name="bio" />
      <Stack.Screen name="interests" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="phone" />
      <Stack.Screen name="permissions" />
    </Stack>
  );
}
