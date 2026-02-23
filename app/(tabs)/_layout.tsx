import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';

/**
 * iOS: NativeTabs from expo-router/unstable-native-tabs
 * Uses react-native-screens' BottomTabs (UITabBarController) which renders
 * the native iOS 26 Liquid Glass tab bar automatically — no custom code needed.
 *
 * SF Symbols are used for native icons on iOS.
 *
 * Android/web: Standard Tabs with solid background.
 */

function IOSLayout() {
  const { colors } = useTheme();
  return (
    <NativeTabs tintColor={colors.primary}>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Início</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="partners" hidden />

      <NativeTabs.Trigger name="chat">
        <Icon sf={{ default: 'paperplane', selected: 'paperplane.fill' }} />
        <Label>Chat</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>Perfil</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="discover" hidden />
    </NativeTabs>
  );
}

function AndroidLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="partners" options={{ href: null }} />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="paper-plane" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="discover" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabsLayout() {
  return Platform.OS === 'ios' ? <IOSLayout /> : <AndroidLayout />;
}
