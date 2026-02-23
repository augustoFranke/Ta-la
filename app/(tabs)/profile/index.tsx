/**
 * Tela de Perfil — redesigned
 *
 * Visual concept: Cinematic hero (full-bleed photo + gradient) → floating
 * content cards. Edit mode slides an action bar in from the top.
 *
 * NOTE: is_available field is retained in the DB schema but is NOT exposed
 * in the UI and must NOT be depended on by app logic. See database.ts.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../src/theme';
import { useProfile } from '../../../src/hooks/useProfile';
import { useAuth } from '../../../src/hooks/useAuth';
import {
  ProfilePhotos,
  ProfileBioSection,
  ProfileInterests,
} from '../../../src/components/profile';
import { Button } from '../../../src/components/ui/Button';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.52);
const BRAND = '#aeee5b';

// ─── Guest screen ─────────────────────────────────────────────────────────────

function GuestProfileScreen() {
  const router = useRouter();
  const { colors, spacing, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.guestContainer, { paddingHorizontal: spacing.lg }]}>
        <View style={[styles.guestAvatar, { backgroundColor: colors.card }]}>
          <Ionicons name="person" size={48} color={colors.textSecondary} />
        </View>
        <Text style={[styles.guestTitle, { color: colors.text }]}>
          Bem-vindo ao Tá lá!
        </Text>
        <Text style={[styles.guestSubtitle, { color: colors.textSecondary }]}>
          Crie sua conta para encontrar pessoas nos mesmos lugares que você.
        </Text>
        <Button
          title="Cadastre-se e crie seu perfil"
          onPress={() => router.push('/(auth)/welcome')}
        />
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { isAuthenticated } = useAuth();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    user,
    photos,
    interests,
    isLoading,
    age,
    primaryPhoto,
    fetchProfile,
    updateBio,
    updateOccupation,
    updatePhotos,
  } = useProfile();

  // ── Edit mode ──────────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingBio, setPendingBio] = useState('');
  const [pendingOccupation, setPendingOccupation] = useState('');

  // Slide-in animation for the edit action bar
  const editAnim = useRef(new Animated.Value(0)).current;

  const handleEnterEdit = useCallback(() => {
    setPendingBio(user?.bio || '');
    setPendingOccupation(user?.occupation || '');
    setEditMode(true);
    Animated.spring(editAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 110,
      friction: 12,
    }).start();
  }, [user?.bio, user?.occupation, editAnim]);

  const dismissEdit = useCallback(
    (cb?: () => void) => {
      Animated.spring(editAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 130,
        friction: 14,
      }).start(() => {
        setEditMode(false);
        cb?.();
      });
    },
    [editAnim]
  );

  const handleCancelEdit = useCallback(() => dismissEdit(), [dismissEdit]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const [bioRes, occRes] = await Promise.all([
        updateBio(pendingBio),
        updateOccupation(pendingOccupation),
      ]);
      if (!bioRes.success || !occRes.success) {
        Alert.alert('Erro', bioRes.error || occRes.error || 'Não foi possível salvar');
        return;
      }
      dismissEdit();
    } finally {
      setIsSaving(false);
    }
  }, [pendingBio, pendingOccupation, updateBio, updateOccupation, dismissEdit]);

  if (!isAuthenticated) return <GuestProfileScreen />;

  // ── Derived values ─────────────────────────────────────────────────────────
  const bgColor = colors.background;

  // Edit bar slides down from off-screen top
  const editBarY = editAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-96, 0],
  });

  // Gradient stops: transparent photo → opaque background
  const gradientColors = (
    isDark
      ? ['transparent', 'rgba(18,18,18,0.55)', bgColor]
      : ['transparent', 'rgba(255,255,255,0.45)', bgColor]
  ) as [string, string, string];

  // Stats derived from data
  const statPhotos = photos.length;
  const statInterests = interests.length;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Light status bar so it reads over the photo */}
      <StatusBar style="light" />

      {/* ── Floating edit action bar (animates from top) ────────────────── */}
      <Animated.View
        style={[
          styles.editBar,
          {
            paddingTop: insets.top,
            backgroundColor: isDark
              ? 'rgba(20,20,20,0.96)'
              : 'rgba(248,248,248,0.97)',
            borderBottomColor: colors.border,
            transform: [{ translateY: editBarY }],
          },
        ]}
        pointerEvents={editMode ? 'auto' : 'none'}
        accessibilityViewIsModal={editMode}
      >
        <View style={styles.editBarInner}>
          <TouchableOpacity
            onPress={handleCancelEdit}
            disabled={isSaving}
            style={styles.editBarAction}
            accessibilityRole="button"
            accessibilityLabel="Cancelar edição"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.editBarCancelText, { color: colors.textSecondary }]}>
              Cancelar
            </Text>
          </TouchableOpacity>

          <Text style={[styles.editBarTitle, { color: colors.text }]}>
            Editar perfil
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={[styles.editBarSave, { backgroundColor: BRAND }]}
            accessibilityRole="button"
            accessibilityLabel="Salvar alterações"
          >
            <Text style={styles.editBarSaveText}>
              {isSaving ? '…' : 'Salvar'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Main scrollable content ─────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchProfile}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <View style={[styles.hero, { height: HERO_HEIGHT }]}>
          {/* Background: primary photo OR branded placeholder */}
          {primaryPhoto?.url ? (
            <Image
              source={{ uri: primaryPhoto.url }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              accessibilityRole="image"
              accessibilityLabel={`Foto de ${user?.name ?? 'perfil'}`}
            />
          ) : (
            <LinearGradient
              colors={['#0d1117', '#182030', '#0f3460']}
              style={[StyleSheet.absoluteFill, styles.heroPlaceholder]}
            >
              <Text style={styles.heroPlaceholderInitial}>
                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </LinearGradient>
          )}

          {/* Cinematic gradient overlay: photo → background colour */}
          <LinearGradient
            colors={gradientColors}
            locations={[0.32, 0.7, 1]}
            style={[StyleSheet.absoluteFill, styles.heroGradient]}
          />

          {/* Top-right controls (safe area aware) */}
          <View
            style={[
              styles.heroTopControls,
              { paddingTop: insets.top + 10 },
            ]}
          >
            {!editMode && (
              <TouchableOpacity
                onPress={handleEnterEdit}
                style={styles.editFAB}
                accessibilityRole="button"
                accessibilityLabel="Editar perfil"
              >
                <Ionicons name="pencil" size={15} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Name / age / occupation overlaid at hero bottom */}
          <View style={[styles.heroInfo, { paddingBottom: 28 }]}>
            {/* Quick stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Ionicons name="images-outline" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={styles.statText}>{statPhotos}</Text>
              </View>
              <View style={styles.statChip}>
                <Ionicons name="pricetag-outline" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={styles.statText}>{statInterests}</Text>
              </View>
              {user?.is_verified && (
                <View style={[styles.statChip, styles.verifiedChip]}>
                  <Ionicons name="checkmark-circle" size={12} color="#000" />
                  <Text style={[styles.statText, { color: '#000' }]}>Verificado</Text>
                </View>
              )}
            </View>

            <Text style={styles.heroName} numberOfLines={1}>
              {user?.name ?? ''}
              {age !== null && (
                <Text style={styles.heroAge}>, {age}</Text>
              )}
            </Text>

            {user?.occupation ? (
              <Text style={[styles.heroOccupation, { color: BRAND }]} numberOfLines={1}>
                {user.occupation}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ── Content sections ────────────────────────────────────────────── */}
        <View style={styles.sections}>

          {/* Photos */}
          <ProfilePhotos
            photos={photos}
            isEditable={editMode}
            hideEditButton={editMode}
            onPhotosChange={updatePhotos}
            isLoading={isLoading}
          />

          {/* Bio + Occupation (global edit mode) */}
          <ProfileBioSection
            bio={user?.bio || null}
            occupation={user?.occupation || null}
            editMode={editMode}
            onBioTextChange={setPendingBio}
            onOccupationTextChange={setPendingOccupation}
            isLoading={isLoading}
          />

          {/* Interests */}
          <ProfileInterests interests={interests} />

          {/* Settings card */}
          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.settingsRow}>
              <View style={[styles.settingsIcon, { backgroundColor: colors.border }]}>
                <Ionicons name="settings-outline" size={17} color={colors.textSecondary} />
              </View>
              <View style={styles.settingsText}>
                <Text style={[styles.settingsTitle, { color: colors.text }]}>
                  Configurações
                </Text>
                <Text style={[styles.settingsHint, { color: colors.textSecondary }]}>
                  Permissões, aparência e conta
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={colors.border} />
            </View>
            <Button
              title="Abrir configurações"
              variant="outline"
              onPress={() => router.push('/(tabs)/profile/settings')}
              style={styles.settingsButton}
            />
          </View>

          {__DEV__ && (
            <Button
              title="Dev Settings"
              variant="outline"
              onPress={() => router.push('/(tabs)/profile/dev-settings')}
              style={styles.devButton}
            />
          )}

          <Text style={[styles.version, { color: colors.textSecondary }]}>
            Tá lá! v1.0.0 (MVP)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Edit bar ──
  editBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 10,
      },
      android: { elevation: 6 },
    }),
  },
  editBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  editBarAction: {
    minWidth: 80,
  },
  editBarCancelText: {
    fontSize: 15,
    fontWeight: '500',
  },
  editBarTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  editBarSave: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  editBarSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },

  // ── Hero ──
  hero: {
    width: SCREEN_WIDTH,
    overflow: 'hidden',
  },
  heroPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPlaceholderInitial: {
    fontSize: 100,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.12)',
    letterSpacing: -4,
  },
  heroGradient: {
    // fills from the bottom up; exact start point set by `locations`
  },
  heroTopControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  editFAB: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    gap: 5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  verifiedChip: {
    backgroundColor: BRAND,
    borderColor: 'transparent',
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  heroName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  heroAge: {
    fontSize: 30,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.8)',
  },
  heroOccupation: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  // ── Content sections ──
  sections: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 0,
  },

  // ── Settings card ──
  settingsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
    gap: 12,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsText: {
    flex: 1,
    gap: 2,
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingsHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  settingsButton: {
    alignSelf: 'stretch',
  },
  devButton: {
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 12,
  },

  // ── Guest ──
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  guestAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
});
