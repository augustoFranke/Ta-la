import { Stack } from 'expo-router';
import { useTheme } from '../../../src/theme';

export default function ProfileLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit-interests"
        options={{
          title: 'Editar Interesses',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
