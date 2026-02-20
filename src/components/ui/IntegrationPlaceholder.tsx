/**
 * IntegrationPlaceholder — Spec 012
 *
 * Rendered when a required API key or integration is missing.
 *
 * Requirements (Spec 012 §4):
 * - Must describe what should appear in this area.
 * - Must not crash the app.
 * - Must not block unrelated flows.
 * - Must not leak secrets or internal config paths (Spec 012 §6).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export interface IntegrationPlaceholderProps {
  /**
   * Human-readable name of the integration (shown to user).
   * Example: "Mapa", "Locais próximos", "Fotos de perfil"
   */
  integrationName: string;
  /**
   * Optional description of what the user would see here once configured.
   * Must NOT include key names, env var paths, or internal identifiers.
   */
  description?: string;
  /** Optional icon from Ionicons to visually suggest the content type. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Height of the placeholder container (default: 160). */
  height?: number;
}

/**
 * Safe placeholder for unconfigured integrations.
 *
 * Usage:
 * ```tsx
 * {!GOOGLE_MAPS_KEY ? (
 *   <IntegrationPlaceholder
 *     integrationName="Mapa"
 *     description="Um mapa dos locais próximos aparecerá aqui."
 *     icon="map-outline"
 *   />
 * ) : (
 *   <MapView ... />
 * )}
 * ```
 */
export function IntegrationPlaceholder({
  integrationName,
  description,
  icon = 'construct-outline',
  height = 160,
}: IntegrationPlaceholderProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <Ionicons name={icon} size={32} color={colors.textSecondary} />
      <Text style={[styles.title, { color: colors.text }]}>
        {integrationName} não configurado
      </Text>
      {description ? (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
});
