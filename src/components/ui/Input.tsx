import React from 'react';
import {
  TextInput,
  Text,
  View,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { useTheme } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...rest }: InputProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.sizes.sm,
            marginBottom: spacing.xs,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: error ? colors.error : colors.border,
            padding: spacing.md,
          },
          style,
        ]}
        placeholderTextColor={colors.textSecondary}
        {...rest}
      />
      {error && (
        <Text
          style={{
            color: colors.error,
            fontSize: typography.sizes.xs,
            marginTop: spacing.xs,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
});
