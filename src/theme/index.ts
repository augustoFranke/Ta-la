import { useColorScheme } from 'react-native';
import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';

export function useTheme() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;

  return {
    colors: themeColors,
    typography,
    spacing,
    isDark: colorScheme === 'dark',
  };
}
