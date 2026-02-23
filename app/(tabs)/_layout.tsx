import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../src/theme';

/**
 * iOS 26 "Liquid Glass" tab bar background.
 * BlurView uses the native UIBlurEffect material so content
 * visible through the tab bar is authentically blurred.
 * Android / web: undefined — their tab bar keeps a solid colour.
 */
function IosTabBarBackground() {
  const { isDark } = useTheme();
  return (
    <BlurView
      tint={isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
      intensity={90}
      style={StyleSheet.absoluteFill}
    />
  );
}

export default function TabsLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        // ── iOS: transparent tab bar backed by native UIBlurEffect ──
        tabBarBackground:
          Platform.OS === 'ios' ? () => <IosTabBarBackground /> : undefined,
        tabBarStyle:
          Platform.OS === 'ios'
            ? {
                // Must be transparent so the BlurView shows through
                backgroundColor: 'transparent',
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: isDark
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(0,0,0,0.08)',
              }
            : {
                backgroundColor: colors.background,
                borderTopColor: colors.border,
              },
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
      <Tabs.Screen
        name="partners"
        options={{
          href: null,
        }}
      />
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
      <Tabs.Screen
        name="discover"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
