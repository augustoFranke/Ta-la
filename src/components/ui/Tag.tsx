import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme';

interface TagProps {
  label: string;
  selected?: boolean;
}

export function Tag({ label, selected = false }: TagProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View
      style={{
        backgroundColor: selected ? colors.primary : colors.card,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
      }}
    >
      <Text
        style={{
          color: selected ? colors.onPrimary : colors.text,
          fontSize: typography.sizes.sm,
          fontWeight: selected ? '600' : '400',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
