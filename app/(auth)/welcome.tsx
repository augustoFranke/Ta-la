/**
 * Tela de boas-vindas
 * Primeira tela do app com branding e CTA para começar
 */

import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/ui/Button';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, spacing, typography, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.brandingContainer}>
        <Text style={[styles.logo, { color: colors.primary }]}>Tá lá!</Text>
        <Text style={[styles.tagline, { color: colors.text }]}>Conexões reais em lugares reais</Text>
      </View>

      <View style={[styles.descriptionContainer, { paddingHorizontal: spacing.lg }]}> 
        <Text style={[styles.description, { color: colors.textSecondary }]}> 
          Encontre pessoas interessantes nos mesmos lugares que você. Faça check-in
          e descubra quem está por perto.
        </Text>
      </View>

      <View style={[styles.featuresContainer, { paddingHorizontal: spacing.lg }]}> 
        <FeatureItem
          iconName="location"
          title="Check-in em locais"
          description="Bares, baladas e eventos"
          colors={colors}
          typography={typography}
        />
        <FeatureItem
          iconName="wine"
          title="Pague um drink"
          description="Demonstre interesse de forma divertida"
          colors={colors}
          typography={typography}
        />
        <FeatureItem
          iconName="people"
          title="Descubra pessoas"
          description="Veja quem está no mesmo lugar"
          colors={colors}
          typography={typography}
        />
      </View>

      <View style={[styles.ctaContainer, { padding: spacing.lg }]}> 
        <Button
          title="Começar"
          onPress={() => router.push('/(auth)/login')}
        />
        <Text style={[styles.terms, { color: colors.textSecondary, marginTop: spacing.md }]}> 
          Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade
        </Text>
      </View>
    </SafeAreaView>
  );
}

interface FeatureItemProps {
  iconName: string;
  title: string;
  description: string;
  colors: any;
  typography: any;
}

function FeatureItem({ iconName, title, description, colors, typography }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={iconName} size={32} color={colors.primary} style={styles.featureIcon} />
      <View style={styles.featureTextContainer}>
        <Text style={[styles.featureTitle, { color: colors.text, fontSize: typography.sizes.md }]}> 
          {title}
        </Text>
        <Text style={[styles.featureDescription, { color: colors.textSecondary, fontSize: typography.sizes.sm }]}> 
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  brandingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  logo: {
    fontSize: 64,
    fontWeight: '900',
  },
  tagline: {
    fontSize: 18,
    marginTop: 8,
    fontWeight: '500',
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontWeight: '600',
  },
  featureDescription: {},
  ctaContainer: {},
  terms: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
