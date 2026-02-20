/**
 * Tela de upload de fotos do onboarding
 * Spec 003: 4 fotos obrigatórias (1 principal + 3 anti-phishing)
 */

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme';
import { Button } from '../../../src/components/ui/Button';
import { OnboardingProgress } from '../../../src/components/common/OnboardingProgress';
import { useAuthStore } from '../../../src/stores/authStore';
import { supabase } from '../../../src/services/supabase';
import { MIN_PHOTOS, MAX_PHOTOS } from '../../../src/types/database';

export default function PhotosScreen() {
  const router = useRouter();
  const { colors, spacing, typography, isDark } = useTheme();
  const { session, setOnboardingPhotos } = useAuthStore();

  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const pickImage = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria para adicionar fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newUri = result.assets[0].uri;

      // Reject duplicate photos (Spec 003)
      const otherPhotos = photos.filter((_, i) => i !== index);
      if (otherPhotos.includes(newUri)) {
        Alert.alert('Foto duplicada', 'Cada foto deve ser única. Escolha uma imagem diferente.');
        return;
      }

      const newPhotos = [...photos];
      if (index < photos.length) {
        newPhotos[index] = newUri;
      } else {
        newPhotos.push(newUri);
      }
      setPhotos(newPhotos);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (!session?.user?.id) throw new Error('Usuário não autenticado');
    const uploadedUrls: string[] = [];

    for (let i = 0; i < photos.length; i++) {
      const uri = photos[i];
      const fileName = `${session.user.id}/${Date.now()}_${i}.jpg`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path);
      uploadedUrls.push(urlData.publicUrl);
    }

    return uploadedUrls;
  };

  const handleNext = async () => {
    if (photos.length < MIN_PHOTOS) {
      Alert.alert(
        'Fotos insuficientes',
        `Adicione ${MIN_PHOTOS} fotos para continuar: 1 foto principal e 3 fotos adicionais.`
      );
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls = await uploadPhotos();
      setOnboardingPhotos(uploadedUrls);
      router.push('/(auth)/onboarding/bio');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as fotos. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const renderPhotoSlot = (index: number) => {
    const photo = photos[index];
    const isMain = index === 0;
    const label = isMain ? 'Principal' : `Foto ${index + 1}`;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.photoSlot,
          {
            backgroundColor: colors.card,
            borderColor: photo ? colors.primary : colors.border,
          },
          isMain && styles.mainPhoto,
        ]}
        onPress={() => pickImage(index)}
        activeOpacity={0.7}
      >
        {photo ? (
          <>
            <Image source={{ uri: photo }} style={styles.photoImage} />
            <TouchableOpacity
              style={[styles.removeButton, { backgroundColor: colors.error }]}
              onPress={() => removePhoto(index)}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Ionicons name="add" size={32} color={colors.textSecondary} />
            <Text style={[styles.slotLabel, { color: colors.textSecondary, fontSize: typography.sizes.xs }]}>
              {label}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  const filledCount = photos.length;
  const remaining = MIN_PHOTOS - filledCount;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <OnboardingProgress currentStep={1} />

      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xl }]}>
          Adicione suas fotos
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
          São necessárias 4 fotos: 1 foto principal e 3 fotos adicionais para verificação anti-phishing.
        </Text>
      </View>

      {/* Grid 2x2 para 4 fotos */}
      <View style={[styles.photosGrid, { paddingHorizontal: spacing.lg }]}>
        <View style={styles.gridRow}>
          {renderPhotoSlot(0)}
          {renderPhotoSlot(1)}
        </View>
        <View style={styles.gridRow}>
          {renderPhotoSlot(2)}
          {renderPhotoSlot(3)}
        </View>
      </View>

      <View style={[styles.counterContainer, { paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.counter, { color: remaining > 0 ? colors.textSecondary : colors.primary }]}>
          {filledCount}/{MAX_PHOTOS} fotos adicionadas
          {remaining > 0 ? ` — faltam ${remaining}` : ''}
        </Text>
      </View>

      <View style={[styles.buttonContainer, { padding: spacing.lg }]}>
        {uploading ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.uploadingText, { color: colors.textSecondary }]}>
              Enviando fotos...
            </Text>
          </View>
        ) : (
          <Button
            title="Continuar"
            onPress={handleNext}
            disabled={filledCount < MIN_PHOTOS}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 24,
    marginBottom: 20,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 24,
  },
  photosGrid: {
    gap: 12,
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mainPhoto: {
    flex: 1,
  },
  photoSlot: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  slotLabel: {
    marginTop: 4,
    fontWeight: '500',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterContainer: {
    marginBottom: 16,
  },
  counter: {
    textAlign: 'center',
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 'auto',
  },
  uploadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  uploadingText: {
    fontSize: 16,
  },
});
