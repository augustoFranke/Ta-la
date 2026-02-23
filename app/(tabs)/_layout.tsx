import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../src/theme';

/**
 * iOS 26 "Liquid Glass" tab bar.
 *
 * KEY: `position: 'absolute'` is required so screen content scrolls
 * *behind* the bar — that is what the BlurView actually blurs.
 * Without it there is no content behind the bar and the blur renders
 * over a solid background, which looks identical to a plain tinted View.
 *
 * Screens that scroll must add `paddingBottom` equal to the tab bar
 * height so their last content item isn't hidden beneath the bar.
 *
 * Android / web: normal solid background, no absolute positioning.
 */
function IosTabBarBackground() {
  const { isDark } = useTheme();
  return (
    <BlurView
      tint={isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
      intensity={92}
      style={StyleSheet.absoluteFill}
    >
      {/* Specular glass-edge highlight — the top-border of a real glass surface */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: StyleSheet.hairlineWidth,
          backgroundColor: isDark
            ? 'rgba(255,255,255,0.28)'
            : 'rgba(255,255,255,0.9)',
        }}
      />
    </BlurView>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarBackground:
          Platform.OS === 'ios' ? () => <IosTabBarBackground /> : undefined,
        tabBarStyle:
          Platform.OS === 'ios'
            ? {
                // transparent + absolute = content scrolls behind + BlurView blurs it
                position: 'absolute',
                backgroundColor: 'transparent',
                borderTopWidth: 0, // replaced by the specular highlight inside BlurView
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
