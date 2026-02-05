/**
 * Perfil público de outro usuário
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { supabase } from '../../src/services/supabase';
import { Card } from '../../src/components/ui/Card';

type UserProfile = {
  id: string;
  name: string;
  bio: string | null;
  occupation: string | null;
  birth_date: string;
};

type Photo = {
  id: string;
  user_id: string;
  url: string;
  order: number;
};

type Interest = {
  id: string;
  user_id: string;
  tag: string;
};

export default function UserProfileScreen() {
  const { colors, spacing, typography, isDark } = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const resolvedUserId = useMemo(() => (Array.isArray(id) ? id[0] : id), [id]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const age = profile?.birth_date
    ? Math.floor((Date.now() - new Date(profile.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const fetchProfile = useCallback(async () => {
    if (!resolvedUserId) return;

    setIsLoading(true);
    try {
      const { data: profileData, error } = await supabase
        .from('users')
        .select('id, name, bio, occupation, birth_date')
        .eq('id', resolvedUserId)
        .single();

      if (error) throw error;
      setProfile(profileData as UserProfile);

      const { data: photosData } = await supabase
        .from('photos')
        .select('id, user_id, url, "order"')
        .eq('user_id', resolvedUserId)
        .order('order', { ascending: true });
      setPhotos((photosData ?? []) as Photo[]);

      const { data: interestsData } = await supabase
        .from('interests')
        .select('id, user_id, tag')
        .eq('user_id', resolvedUserId);
      setInterests((interestsData ?? []) as Interest[]);
    } catch (err: any) {
      Alert.alert('Erro', 'Não foi possível carregar o perfil.');
    } finally {
      setIsLoading(false);
    }
  }, [resolvedUserId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={[styles.header, { padding: spacing.lg }]}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xl }]}>Perfil</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}> 
        {profile ? (
          <>
            {photos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosRow}>
                {photos.map((photo) => (
                  <Image key={photo.id} source={{ uri: photo.url }} style={styles.photo} />
                ))}
              </ScrollView>
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: colors.card }]}> 
                <Ionicons name="image-outline" size={48} color={colors.textSecondary} />
              </View>
            )}

            <View style={styles.profileHeader}>
              <Text style={[styles.name, { color: colors.text }]}> 
                {profile.name}{age ? `, ${age}` : ''}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}> 
                {profile.occupation || 'Sem ocupação'}
              </Text>
            </View>

            <Card style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Bio</Text>
              <Text style={[styles.sectionText, { color: colors.text }]}> 
                {profile.bio || 'Sem bio'}
              </Text>
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Interesses</Text>
              <View style={styles.chipsRow}>
                {interests.length === 0 ? (
                  <Text style={[styles.sectionText, { color: colors.textSecondary }]}> 
                    Nenhum interesse informado
                  </Text>
                ) : (
                  interests.map((interest) => (
                    <View key={interest.id} style={[styles.chip, { borderColor: colors.border }]}> 
                      <Text style={[styles.chipText, { color: colors.textSecondary }]}> 
                        {interest.tag}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </Card>
          </>
        ) : (
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}> 
            {isLoading ? 'Carregando perfil...' : 'Perfil não encontrado'}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontWeight: '700',
  },
  content: {
    paddingBottom: 40,
    gap: 16,
  },
  photosRow: {
    marginBottom: 12,
  },
  photo: {
    width: 240,
    height: 280,
    borderRadius: 16,
    marginRight: 12,
  },
  photoPlaceholder: {
    height: 240,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeader: {
    gap: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
  },
  sectionCard: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sectionText: {
    fontSize: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
  },
});
