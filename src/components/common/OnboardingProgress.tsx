/**
 * Indicador de progresso do onboarding
 * Mostra barras para cada etapa (4 no total)
 */

import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface OnboardingProgressProps {
  currentStep: number; // 1-4
  totalSteps?: number;
}

export function OnboardingProgress({ currentStep, totalSteps = 4 }: OnboardingProgressProps) {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.container, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <View
            key={index}
            style={[
              styles.bar,
              {
                backgroundColor: isCompleted || isCurrent ? colors.primary : colors.border,
                opacity: isCompleted ? 0.5 : 1,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});
