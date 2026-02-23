import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';

/**
 * iOS-only custom glass tab bar.
 *
 * WHY a fully custom `tabBar` instead of `tabBarBackground` + transparent style:
 * The BlurView only blurs content that is rendered *behind* it in the same
 * compositing layer. `tabBarBackground` with a non-absolute tab bar still
 * renders the bar below the screen content, so the BlurView has nothing to
 * blur. By returning a View with `position: 'absolute'` here, React Navigation
 * measures 0 layout height for the bar, meaning screen content extends to the
 * bottom edge — and the floating bar blurs whatever is behind it via
 * UIBlurEffect (the iOS 26 "Liquid Glass" material).
 *
 * Screens with scrollable content must manually add paddingBottom to avoid
 * their last item being obscured by the floating bar (already done).
 */
function GlassTabBar({ state, descriptors, navigation }: any) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Only routes that have a tabBarIcon defined; href:null tabs don't define one.
  const tabs = state.routes.filter(
    (r: any) => descriptors[r.key]?.options?.tabBarIcon !== undefined
  );

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* Native UIBlurEffect — iOS 26 Liquid Glass material */}
      <BlurView
        tint={isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
        intensity={90}
        style={StyleSheet.absoluteFill}
      />

      {/* Specular highlight — the bright glass edge at the top of the bar */}
      <View
        style={[
          styles.glassEdge,
          {
            backgroundColor: isDark
              ? 'rgba(255,255,255,0.22)'
              : 'rgba(255,255,255,0.85)',
          },
        ]}
      />

      {/* Tab items */}
      <View style={styles.tabsRow}>
        {tabs.map((route: any) => {
          const { options } = descriptors[route.key];
          // Compare keys — state.index is the index into state.routes (includes hidden routes)
          const focused = state.routes[state.index]?.key === route.key;
          const color = focused ? colors.primary : colors.textSecondary;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={(options.title as string | undefined) ?? route.name}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {options.tabBarIcon?.({ focused, color, size: 24 })}
              <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
                {(options.title as string | undefined) ?? route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      // iOS: fully custom glass bar (see above).
      // Android / web: React Navigation default solid bar.
      tabBar={Platform.OS === 'ios' ? (props) => <GlassTabBar {...props} /> : undefined}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        // Only used by the default bar on Android/web
        tabBarStyle:
          Platform.OS !== 'ios'
            ? { backgroundColor: colors.background, borderTopColor: colors.border }
            : undefined,
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

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  glassEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  tabsRow: {
    flexDirection: 'row',
    height: 49,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});
