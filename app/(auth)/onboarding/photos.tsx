/**
 * Tela de upload de fotos do onboarding
 * Mínimo 1 foto, máximo 3
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

const MAX_PHOTOS = 3;
const MIN_PHOTOS = 1;

export default function PhotosScreen() {
  const router = useRouter();
  const { colors, spacing, typography, isDark } = useTheme();
  const { session, setOnboardingPhotos } = useAuthStore();

  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const pickImage = async (index: number) => {
    // Solicita permissão
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria para adicionar fotos');
      return;
    }

    // Abre seletor de imagem
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhotos = [...photos];

      if (index < photos.length) {
        // Substitui foto existente
        newPhotos[index] = result.assets[0].uri;
      } else {
        // Adiciona nova foto
        newPhotos.push(result.assets[0].uri);
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

      // Converte URI para blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      // Obtém URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      uploadedUrls.push(urlData.publicUrl);
    }

    return uploadedUrls;
  };

  const handleNext = async () => {
    if (photos.length < MIN_PHOTOS) {
      Alert.alert('Foto necessária', 'Adicione pelo menos uma foto para continuar');
      return;
    }

    setUploading(true);
    try {
      // Upload das fotos para o Storage
      const uploadedUrls = await uploadPhotos();

      // Salva URLs no store
      setOnboardingPhotos(uploadedUrls);

      // Navega para próxima tela
      router.push('/(auth)/onboarding/bio');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      Alert.alert('Erro', 'Não foi possível salvar as fotos. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const renderPhotoSlot = (index: number) => {
    const photo = photos[index];
    const isEmpty = !photo;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.photoSlot,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          index === 0 && styles.mainPhoto,
        ]}
        onPress={() => pickImage(index)}
        onLongPress={() => photo && removePhoto(index)}
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
            <Ionicons name="add" size={36} color={colors.textSecondary} />
            {index === 0 && (
              <Text style={[styles.mainLabel, { color: colors.textSecondary }]}>Principal</Text>
            )}
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Progresso */}
      <OnboardingProgress currentStep={1} />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xl }]}>
          Adicione suas fotos
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
          Escolha até 3 fotos que mostrem quem você é. A primeira será sua foto principal.
        </Text>
      </View>

      {/* Grid de fotos */}
      <View style={[styles.photosGrid, { paddingHorizontal: spacing.lg }]}>
        <View style={styles.mainPhotoContainer}>{renderPhotoSlot(0)}</View>
        <View style={styles.secondaryPhotos}>
          {renderPhotoSlot(1)}
          {renderPhotoSlot(2)}
        </View>
      </View>

      {/* Dica */}
      <View style={[styles.tipContainer, { paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.tip, { color: colors.textSecondary, fontSize: typography.sizes.sm }]}>
          Dica: Fotos com seu rosto visível aumentam suas chances de match!
        </Text>
      </View>

      {/* Botão */}
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
            disabled={photos.length < MIN_PHOTOS}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 24,
    marginBottom: 24,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 24,
  },
  photosGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  mainPhotoContainer: {
    flex: 1,
  },
  mainPhoto: {
    aspectRatio: 3 / 4,
  },
  secondaryPhotos: {
    flex: 1,
    gap: 12,
  },
  photoSlot: {
    width: '100%',
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
  mainLabel: {
    fontSize: 12,
    marginTop: 4,
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
  tipContainer: {
    marginBottom: 24,
  },
  tip: {
    textAlign: 'center',
    fontStyle: 'italic',
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
