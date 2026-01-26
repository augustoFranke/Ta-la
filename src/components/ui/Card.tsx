import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../../theme';

interface CardProps extends ViewProps {
  variant?: 'elevated' | 'flat' | 'outlined';
}

export function Card({ style, children, variant = 'elevated', ...rest }: CardProps) {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          padding: spacing.md,
          borderColor: variant === 'outlined' ? colors.border : 'transparent',
          borderWidth: variant === 'outlined' ? 1 : 0,
          shadowColor: variant === 'elevated' ? '#000' : 'transparent',
          shadowOpacity: variant === 'elevated' ? 0.1 : 0,
          shadowRadius: variant === 'elevated' ? 4 : 0,
          shadowOffset: variant === 'elevated' ? { width: 0, height: 2 } : { width: 0, height: 0 },
          elevation: variant === 'elevated' ? 2 : 0,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
  },
});
