/**
 * ProfilePhotos Component
 * Grid layout for user photos with edit capability
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import type { Photo } from '../../types/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface SelectedPhoto {
  uri: string;
  base64?: string;
  fileName?: string | null;
  mimeType?: string | null;
}

interface ProfilePhotosProps {
  photos: Photo[];
  isEditable?: boolean;
  onPhotosChange?: (assets: (SelectedPhoto | string)[]) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
}

export function ProfilePhotos({
  photos,
  isEditable = false,
  onPhotosChange,
  isLoading = false,
}: ProfilePhotosProps) {
  const { colors } = useTheme();
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const mainPhoto = photos[0];
  const secondaryPhotos = photos.slice(1, 3);

  const handleEditPhotos = async (mode: 'replace' | 'append' = 'replace') => {
    if (!onPhotosChange) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert('Permissão para acessar fotos é necessária.');
      return;
    }

    const allowMultiple = mode === 'replace' || mode === 'append';
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: allowMultiple,
      quality: 0.8,
      selectionLimit: allowMultiple ? 3 : 1,
      base64: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      setIsUploading(true);
      const assets = result.assets.slice(0, 3).map((asset) => ({
        uri: asset.uri,
        base64: asset.base64 ?? undefined,
        fileName: asset.fileName ?? null,
        mimeType: asset.mimeType ?? null,
      }));
      const existingUrls = photos.map((photo) => photo.url);
      const nextAssets: (SelectedPhoto | string)[] = mode === 'append'
        ? [...existingUrls, ...assets].slice(0, 3)
        : assets;
      await onPhotosChange(nextAssets);
      setIsUploading(false);
    }
  };

  const renderPlaceholder = (size: 'main' | 'secondary') => (
    <View
      style={[
        size === 'main' ? styles.mainPhoto : styles.secondaryPhoto,
        styles.placeholder,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Ionicons
        name={size === 'main' ? 'camera' : 'add'}
        size={size === 'main' ? 28 : 24}
        color={colors.textSecondary}
      />
    </View>
  );

  const handleSlotReplace = async (slotIndex: number) => {
    if (!onPhotosChange) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permissão para acessar fotos é necessária.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
      selectionLimit: 1,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setIsUploading(true);
      const asset = result.assets[0];
      const selected = {
        uri: asset.uri,
        base64: asset.base64 ?? undefined,
        fileName: asset.fileName ?? null,
        mimeType: asset.mimeType ?? null,
      };

      const existingUrls: (SelectedPhoto | string)[] = photos.map((photo) => photo.url);
      const nextAssets = [...existingUrls];
      if (slotIndex < nextAssets.length) {
        nextAssets[slotIndex] = selected;
      } else {
        nextAssets.push(selected);
      }

      await onPhotosChange(nextAssets.slice(0, 3));
      setIsUploading(false);
    }
  };

  const handlePhotoPress = (slotIndex: number, photo?: Photo) => {
    if (!isEditable) {
      if (photo) setViewingPhoto(photo.url);
      return;
    }

    handleSlotReplace(slotIndex);
  };

  const handlePhotoPreview = (photo?: Photo) => {
    if (photo) {
      setViewingPhoto(photo.url);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>Fotos</Text>
        {isEditable && (
          <TouchableOpacity
            onPress={() => handleEditPhotos('replace')}
            disabled={isUploading || isLoading}
          >
            <Text style={[styles.editButton, { color: colors.primary }]}>
              {isUploading ? 'Salvando...' : 'Editar'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading || isUploading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.photosGrid}>
            {/* Main Photo */}
            <TouchableOpacity
              style={styles.mainPhotoContainer}
              onPress={() => handlePhotoPress(0, mainPhoto)}
              onLongPress={() => handlePhotoPreview(mainPhoto)}
              activeOpacity={0.9}
            >
              {mainPhoto ? (
                <Image
                  source={{ uri: mainPhoto.url }}
                  style={styles.mainPhoto}
                  resizeMode="cover"
                />
              ) : (
                renderPlaceholder('main')
              )}
            </TouchableOpacity>

            {/* Secondary Photos */}
            <View style={styles.secondaryColumn}>
              {[0, 1].map((index) => {
                const photo = secondaryPhotos[index];
                const slotIndex = index + 1;
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.secondaryPhotoContainer}
                    onPress={() => handlePhotoPress(slotIndex, photo)}
                    onLongPress={() => handlePhotoPreview(photo)}
                    activeOpacity={0.9}
                  >
                    {photo ? (
                      <Image
                        source={{ uri: photo.url }}
                        style={styles.secondaryPhoto}
                        resizeMode="cover"
                      />
                    ) : (
                      renderPlaceholder('secondary')
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {photos.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Nenhuma foto adicionada
              </Text>
              {isEditable && (
                <TouchableOpacity onPress={() => handleEditPhotos('append')}>
                  <Text style={[styles.addPhotoText, { color: colors.primary }]}>
                    Adicionar fotos
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}

      {/* Photo count indicator */}
      {photos.length > 3 && (
        <Text style={[styles.morePhotos, { color: colors.textSecondary }]}>
          +{photos.length - 3} fotos
        </Text>
      )}

      {/* Full-screen Photo Modal */}
      <Modal
        visible={!!viewingPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingPhoto(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setViewingPhoto(null)}
        >
          {viewingPhoto && (
            <Image
              source={{ uri: viewingPhoto }}
              style={styles.fullScreenPhoto}
              resizeMode="contain"
            />
          )}
          <Text style={styles.closeText}>Toque para fechar</Text>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const GRID_GAP = 8;
const MAIN_PHOTO_HEIGHT = 200;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  editButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    height: MAIN_PHOTO_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 12,
  },
  emptyText: {
    fontSize: 14,
    marginBottom: 8,
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  photosGrid: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  mainPhotoContainer: {
    flex: 2,
    height: MAIN_PHOTO_HEIGHT,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mainPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  secondaryColumn: {
    flex: 1,
    gap: GRID_GAP,
  },
  secondaryPhotoContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  secondaryPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  morePhotos: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenPhoto: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  closeText: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 20,
    fontSize: 14,
  },
});
