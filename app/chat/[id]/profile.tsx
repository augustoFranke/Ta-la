/**
 * Matched Profile View — Spec 007
 * Read-only profile shown only to matched users.
 * Top-right "back to chat" arrow required by spec.
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme';
import { useAuth } from '../../../src/hooks/useAuth';
import { useChatStore } from '../../../src/stores/chatStore';
import { fetchMatchedProfile, type MatchedProfile } from '../../../src/services/chat';

export default function MatchedProfileScreen() {
  const { id: matchId } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const match = useChatStore((s) => s.matches.find((m) => m.match_id === matchId));
  const [profile, setProfile] = useState<MatchedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (!match?.partner_id || !user?.id) return;

    fetchMatchedProfile(match.partner_id, user.id)
      .then(setProfile)
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar o perfil.'))
      .finally(() => setIsLoading(false));
  }, [match?.partner_id, user?.id]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header with back-to-chat arrow (required by Spec 007) */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Perfil</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backToChatButton}>
          <Ionicons name="chatbubble-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !profile ? (
        <View style={styles.loadingState}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Perfil não encontrado.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {/* 3-photo carousel (Spec 007 §4) */}
          {profile.photos.length > 0 ? (
            <View style={styles.photoCarousel}>
              <Image
                source={{ uri: profile.photos[photoIndex] }}
                style={styles.photo}
                resizeMode="cover"
              />
              {profile.photos.length > 1 && (
                <View style={styles.photoDots}>
                  {profile.photos.map((_, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.dot,
                        {
                          backgroundColor:
                            i === photoIndex ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setPhotoIndex(i)}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.card }]}>
              <Ionicons name="person" size={64} color={colors.textSecondary} />
            </View>
          )}

          {/* Name */}
          <View style={[styles.infoSection, { paddingHorizontal: spacing.lg }]}>
            <Text style={[styles.name, { color: colors.text }]}>{profile.name}</Text>

            {/* Bio */}
            {profile.bio ? (
              <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.bio}</Text>
            ) : null}

            {/* Occupation */}
            {profile.occupation ? (
              <View style={styles.occupationRow}>
                <Ionicons name="briefcase-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.occupation, { color: colors.textSecondary }]}>
                  {profile.occupation}
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  backToChatButton: {
    padding: 6,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
  },
  photoCarousel: {
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 380,
  },
  photoDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  photoPlaceholder: {
    width: '100%',
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    paddingTop: 20,
    gap: 12,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
  },
  occupationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  occupation: {
    fontSize: 14,
  },
});
