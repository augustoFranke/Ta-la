/**
 * Perfil público de outro usuário
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { supabase } from '../../src/services/supabase';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/hooks/useAuth';
import { useCheckIn } from '../../src/hooks/useCheckIn';
import { sendInteraction } from '../../src/services/interactions';
import { InteractionButtons } from '../../src/components/interaction/InteractionButtons';
import { ConfirmationDialog } from '../../src/components/interaction/ConfirmationDialog';
import { MatchCelebration } from '../../src/components/interaction/MatchCelebration';
import type { InteractionType } from '../../src/types/database';
import { blockUser, reportUser } from '../../src/services/moderation';
import { useBlockStore } from '../../src/stores/blockStore';
import { type ReportReason, REPORT_REASONS } from '../../src/types/database';

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
  const { user } = useAuth();
  const { activeCheckIn, fetchActiveCheckIn } = useCheckIn();

  const resolvedUserId = useMemo(() => (Array.isArray(id) ? id[0] : id), [id]);
  const userId = user?.id;
  const currentUserName = user?.name ?? 'Voce';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('comportamento_inadequado');
  const [reportDetails, setReportDetails] = useState('');

  // Interaction state
  const [pendingInteraction, setPendingInteraction] = useState<InteractionType | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [matchData, setMatchData] = useState<{
    matchedUserName: string;
    matchedUserPhotoUrl: string | null;
  } | null>(null);
  const [sentTypes, setSentTypes] = useState<Set<InteractionType>>(new Set());

  const { addBlockedId } = useBlockStore();

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

  useEffect(() => {
    fetchActiveCheckIn();
  }, [fetchActiveCheckIn]);

  // Interaction handlers
  const handleInteract = useCallback((type: InteractionType) => {
    setPendingInteraction(type);
  }, []);

  const handleConfirmInteraction = useCallback(async () => {
    if (!pendingInteraction || !activeCheckIn?.venue_id || !resolvedUserId) return;

    setIsSending(true);
    try {
      const result = await sendInteraction({
        receiverId: resolvedUserId,
        venueId: activeCheckIn.venue_id,
        type: pendingInteraction,
      });

      // Update sent types for button feedback
      setSentTypes((prev) => {
        const next = new Set(prev);
        next.add(pendingInteraction);
        return next;
      });

      // Check for match
      if (result.is_match) {
        setMatchData({
          matchedUserName: profile?.name ?? '',
          matchedUserPhotoUrl: photos.length > 0 ? photos[0].url : null,
        });
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    } finally {
      setIsSending(false);
      setPendingInteraction(null);
    }
  }, [pendingInteraction, activeCheckIn?.venue_id, resolvedUserId, profile, photos]);

  const handleCancelInteraction = useCallback(() => {
    setPendingInteraction(null);
  }, []);

  const handleDismissMatch = useCallback(() => {
    setMatchData(null);
  }, []);

  const handleBlock = useCallback(async () => {
    if (!userId || !resolvedUserId) return;
    Alert.alert(
      'Bloquear usuario',
      'Voce nao vera mais este usuario e ele nao vera voce. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(userId, resolvedUserId);
              addBlockedId(resolvedUserId);
              Alert.alert('Usuario bloqueado', 'Voce nao vera mais este usuario.');
              router.back();
            } catch (err: any) {
              Alert.alert('Erro', 'Nao foi possivel bloquear este usuario.');
            }
          },
        },
      ]
    );
  }, [userId, resolvedUserId, addBlockedId, router]);

  const handleReport = useCallback(async () => {
    if (!userId || !resolvedUserId) return;
    try {
      await reportUser({
        reporterId: userId,
        reportedId: resolvedUserId,
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });
      setReportModalVisible(false);
      setReportReason('comportamento_inadequado');
      setReportDetails('');
      Alert.alert('Denuncia enviada', 'Obrigado por ajudar a manter a comunidade segura.');
    } catch (err: any) {
      Alert.alert('Erro', 'Nao foi possivel enviar a denuncia.');
    }
  }, [userId, resolvedUserId, reportReason, reportDetails]);

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

            <Card style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Interesse</Text>
              <InteractionButtons
                onInteract={handleInteract}
                sentTypes={sentTypes}
                disabled={!activeCheckIn?.venue_id}
              />
              {!activeCheckIn?.venue_id && (
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                  Faca check-in no mesmo local para interagir
                </Text>
              )}
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Seguranca</Text>
              <View style={styles.actionRow}>
                <Button
                  title="Denunciar"
                  variant="outline"
                  onPress={() => setReportModalVisible(true)}
                  style={styles.actionButton}
                />
                <Button
                  title="Bloquear"
                  variant="outline"
                  onPress={handleBlock}
                  style={styles.actionButton}
                />
              </View>
            </Card>
          </>
        ) : (
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}> 
            {isLoading ? 'Carregando perfil...' : 'Perfil não encontrado'}
          </Text>
        )}
      </ScrollView>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        visible={pendingInteraction !== null}
        userName={profile?.name ?? ''}
        interactionType={pendingInteraction ?? 'drink'}
        onConfirm={handleConfirmInteraction}
        onCancel={handleCancelInteraction}
        loading={isSending}
      />

      {/* Match Celebration */}
      <MatchCelebration
        visible={matchData !== null}
        currentUserName={currentUserName}
        currentUserPhotoUrl={null}
        matchedUserName={matchData?.matchedUserName ?? ''}
        matchedUserPhotoUrl={matchData?.matchedUserPhotoUrl ?? null}
        onDismiss={handleDismissMatch}
      />

      {/* Report Modal */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.reportOverlay}>
          <View style={[styles.reportContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.reportTitle, { color: colors.text }]}>Denunciar usuario</Text>
            <Text style={[styles.reportSubtitle, { color: colors.textSecondary }]}>
              Selecione o motivo da denuncia
            </Text>

            <View style={[styles.reasonList, { borderColor: colors.border }]}>
              {REPORT_REASONS.map((item, index) => (
                <React.Fragment key={item.value}>
                  {index > 0 && <View style={[styles.reasonDivider, { backgroundColor: colors.border }]} />}
                  <TouchableOpacity
                    style={styles.reasonOption}
                    onPress={() => setReportReason(item.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.reasonText, { color: colors.text }]}>{item.label}</Text>
                    <Ionicons
                      name={reportReason === item.value ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color={reportReason === item.value ? colors.primary : colors.textSecondary}
                    />
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>

            <TextInput
              style={[styles.reportInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Detalhes adicionais (opcional)"
              placeholderTextColor={colors.textSecondary}
              value={reportDetails}
              onChangeText={setReportDetails}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.reportActions}>
              <TouchableOpacity
                style={[styles.reportCancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setReportModalVisible(false);
                  setReportReason('comportamento_inadequado');
                  setReportDetails('');
                }}
              >
                <Text style={[styles.reportButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reportSubmitButton, { backgroundColor: colors.primary }]}
                onPress={handleReport}
              >
                <Text style={[styles.reportButtonText, { color: colors.onPrimary }]}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  helperText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
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
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  reportOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  reportContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  reasonList: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  reasonDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 12,
  },
  reasonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  reportInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    marginBottom: 16,
  },
  reportActions: {
    flexDirection: 'row',
    gap: 12,
  },
  reportCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  reportSubmitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
