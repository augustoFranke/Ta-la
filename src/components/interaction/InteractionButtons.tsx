import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { InteractionType } from '../../types/database';

interface InteractionButtonsProps {
  onInteract: (type: InteractionType) => void;
  disabled?: boolean;
  sentTypes?: Set<InteractionType>;
}

const BUTTON_CONFIG: {
  type: InteractionType;
  outlineIcon: keyof typeof Ionicons.glyphMap;
  filledIcon: keyof typeof Ionicons.glyphMap;
}[] = [
  { type: 'wave', outlineIcon: 'hand-left-outline', filledIcon: 'hand-left' },
  { type: 'like', outlineIcon: 'heart-outline', filledIcon: 'heart' },
  { type: 'drink', outlineIcon: 'beer-outline', filledIcon: 'beer' },
];

export function InteractionButtons({
  onInteract,
  disabled = false,
  sentTypes,
}: InteractionButtonsProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {BUTTON_CONFIG.map((config) => {
        const isSent = sentTypes?.has(config.type) ?? false;
        const isDrink = config.type === 'drink';
        const iconName = isSent ? config.filledIcon : config.outlineIcon;

        const size = isDrink ? 44 : 36;
        const iconSize = isDrink ? 26 : 20;

        return (
          <TouchableOpacity
            key={config.type}
            style={[
              styles.button,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: isDrink ? colors.primary : 'transparent',
                borderWidth: isDrink ? 0 : 1,
                borderColor: isDrink ? 'transparent' : colors.border,
                opacity: isSent ? 0.5 : 1,
              },
            ]}
            onPress={() => onInteract(config.type)}
            disabled={disabled || isSent}
            activeOpacity={0.7}
          >
            <Ionicons
              name={iconName}
              size={iconSize}
              color={isDrink ? colors.onPrimary : colors.text}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
