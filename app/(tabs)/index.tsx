/**
 * Tela Home
 * Check-in ativo + venues próximos
 */

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { useVenues } from '../../src/hooks/useVenues';
import { useLocationStore } from '../../src/stores/locationStore';
import { bootstrapLocation } from '../../src/services/location';
import { VenueCarousel, VenueDetailsModal } from '../../src/components/venue';
import type { VenueWithDistance } from '../../src/stores/venueStore';

export default function HomeScreen() {
  const { colors, spacing, typography, isDark } = useTheme();
  const { user } = useAuth();
  const [selectedVenue, setSelectedVenue] = useState<VenueWithDistance | null>(null);
  const [isDetailsVisible, setDetailsVisible] = useState(false);
  const {
    latitude,
    longitude,
    permissionGranted,
    errorMsg,
    isLoading: isLocationLoading,
  } = useLocationStore();

  const {
    venues,
    isLoading: isVenuesLoading,
    error,
    hasLocation,
    refreshVenues,
  } = useVenues({ autoFetch: true });

  useEffect(() => {
    if (!latitude || !longitude) {
      bootstrapLocation();
    }
  }, [latitude, longitude]);

  const handleCheckIn = (venue: VenueWithDistance) => {
    setDetailsVisible(false);
    setSelectedVenue(null);
    Alert.alert(
      'Check-in',
      `Fazer check-in em ${venue.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            // TODO: Implement check-in logic
            Alert.alert('Check-in realizado!', `Você está em ${venue.name}`);
          },
        },
      ]
    );
  };

  const handleVenuePress = (venue: VenueWithDistance) => {
    setSelectedVenue(venue);
    setDetailsVisible(true);
  };

  const handleDetailsClose = () => {
    setDetailsVisible(false);
    setSelectedVenue(null);
  };

  const getSubtitle = () => {
    if (!permissionGranted) {
      return 'Permita acesso à localização para ver locais próximos';
    }
    if (errorMsg) {
      return errorMsg;
    }
    if (isLocationLoading || !hasLocation) {
      return 'Obtendo sua localização...';
    }
    if (isVenuesLoading) {
      return 'Buscando locais próximos...';
    }
    if (venues.length === 0) {
      return 'Nenhum local encontrado por perto';
    }
    return `${venues.length} locais encontrados perto de você`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { padding: spacing.lg }]}>
        <Text style={[styles.greeting, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
          Olá, {user?.name?.split(' ')[0] || 'Usuário'}!
        </Text>
        <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xl }]}>
          Onde você está?
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.sm }]}>
          {getSubtitle()}
        </Text>
      </View>

      {/* Venue Carousel */}
      <View style={styles.content}>
        {!permissionGranted ? (
          <View style={[styles.permissionContainer, { backgroundColor: colors.card }]}>
            <Text style={styles.permissionEmoji}>📍</Text>
            <Text style={[styles.permissionText, { color: colors.text }]}>
              Localização necessária
            </Text>
            <Text style={[styles.permissionSubtext, { color: colors.textSecondary }]}>
              Para ver bares e baladas perto de você, permita o acesso à sua localização nas configurações do app.
            </Text>
          </View>
        ) : (
          <VenueCarousel
            venues={venues}
            isLoading={isVenuesLoading || isLocationLoading || !hasLocation}
            error={error}
            onVenuePress={handleVenuePress}
            onRetry={refreshVenues}
          />
        )}
      </View>

      <VenueDetailsModal
        visible={isDetailsVisible}
        venue={selectedVenue}
        onClose={handleDetailsClose}
        onCheckIn={handleCheckIn}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 8,
  },
  greeting: {
    marginBottom: 4,
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
