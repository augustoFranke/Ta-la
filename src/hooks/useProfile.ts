/**
 * useProfile Hook
 * Manages user profile data including photos and interests
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';
import type { Photo, Interest } from '../types/database';

interface UseProfileOptions {
  autoFetch?: boolean;
}

interface PhotoUploadItem {
  uri: string;
  base64?: string;
  fileName?: string | null;
  mimeType?: string | null;
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64ToUint8Array(base64: string): Uint8Array {
  const cleaned = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const output: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned.charAt(i);
    if (char === '=') break;
    const value = BASE64_ALPHABET.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      output.push((buffer >> bits) & 0xff);
    }
  }

  return new Uint8Array(output);
}

function getFileExtension(mimeType?: string | null, fileName?: string | null): string {
  if (fileName && fileName.includes('.')) {
    const parts = fileName.split('.');
    const ext = parts[parts.length - 1];
    if (ext) return ext.toLowerCase();
  }

  if (mimeType && mimeType.includes('/')) {
    const ext = mimeType.split('/')[1];
    if (ext) return ext.toLowerCase();
  }

  return 'jpg';
}

export function useProfile(options: UseProfileOptions = {}) {
  const { autoFetch = true } = options;

  const { user, session, setUser } = useAuthStore();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user photos
  const fetchPhotos = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', session.user.id)
        .order('order', { ascending: true });

      if (fetchError) throw fetchError;
      setPhotos(data || []);
    } catch (err) {
      console.error('Error fetching photos:', err);
    }
  }, [session?.user?.id]);

  // Fetch user interests
  const fetchInterests = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('interests')
        .select('*')
        .eq('user_id', session.user.id);

      if (fetchError) throw fetchError;
      setInterests(data || []);
    } catch (err) {
      console.error('Error fetching interests:', err);
    }
  }, [session?.user?.id]);

  // Fetch all profile data
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([fetchPhotos(), fetchInterests()]);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Erro ao carregar perfil');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPhotos, fetchInterests]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && session?.user?.id) {
      fetchProfile();
    }
  }, [autoFetch, session?.user?.id, fetchProfile]);

  // Update bio
  const updateBio = useCallback(async (bio: string) => {
    if (!session?.user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ bio })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // Update local state
      if (user) {
        setUser({ ...user, bio });
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error updating bio:', err);
      return { success: false, error: err.message || 'Erro ao atualizar bio' };
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, user, setUser]);

  // Update occupation
  const updateOccupation = useCallback(async (occupation: string) => {
    if (!session?.user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ occupation })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // Update local state
      if (user) {
        setUser({ ...user, occupation });
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error updating occupation:', err);
      return { success: false, error: err.message || 'Erro ao atualizar ocupação' };
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, user, setUser]);

  // Update photos (replaces all photos)
  const updatePhotos = useCallback(async (assets: Array<PhotoUploadItem | string>) => {
    if (!session?.user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    setIsLoading(true);
    try {
      const limitedAssets = assets.slice(0, 3);
      const uploadedUrls: string[] = [];

      for (let i = 0; i < limitedAssets.length; i++) {
        const asset = limitedAssets[i];
        if (typeof asset === 'string') {
          if (asset.trim().length > 0) {
            uploadedUrls.push(asset);
          }
          continue;
        }

        const remoteUri = asset.uri && /^https?:\/\//.test(asset.uri) ? asset.uri : null;
        if (remoteUri && !asset.base64) {
          uploadedUrls.push(remoteUri);
          continue;
        }

        const extension = getFileExtension(asset.mimeType, asset.fileName);
        const fileName = `${session.user.id}/${Date.now()}_${i}.${extension}`;
        const contentType = asset.mimeType || 'image/jpeg';

        if (!asset.base64 && !asset.uri) {
          throw new Error('Foto invalida para upload');
        }

        const fileBody = asset.base64
          ? base64ToUint8Array(asset.base64)
          : await (await fetch(asset.uri)).blob();

        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, fileBody, {
            contentType,
            upsert: true,
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(data.path);

        uploadedUrls.push(urlData.publicUrl);
      }

      await supabase
        .from('photos')
        .delete()
        .eq('user_id', session.user.id);

      if (uploadedUrls.length > 0) {
        const photosData = uploadedUrls.map((url, index) => ({
          user_id: session.user.id,
          url,
          order: index + 1,
        }));

        const { error: insertError } = await supabase
          .from('photos')
          .insert(photosData);

        if (insertError) throw insertError;
      }

      // Refresh photos
      await fetchPhotos();

      return { success: true };
    } catch (err: any) {
      console.error('Error updating photos:', err);
      return { success: false, error: err.message || 'Erro ao atualizar fotos' };
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, fetchPhotos]);

  // Update interests (replaces all interests)
  const updateInterests = useCallback(async (tags: string[]) => {
    if (!session?.user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    setIsLoading(true);
    try {
      // Delete existing interests
      await supabase
        .from('interests')
        .delete()
        .eq('user_id', session.user.id);

      // Insert new interests
      if (tags.length > 0) {
        const interestsData = tags.map((tag) => ({
          user_id: session.user.id,
          tag,
        }));

        const { error: insertError } = await supabase
          .from('interests')
          .insert(interestsData);

        if (insertError) throw insertError;
      }

      // Refresh interests
      await fetchInterests();

      return { success: true };
    } catch (err: any) {
      console.error('Error updating interests:', err);
      return { success: false, error: err.message || 'Erro ao atualizar interesses' };
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, fetchInterests]);

  // Calculate age from birth_date
  const calculateAge = useCallback((birthDate: string | null | undefined): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, []);

  return {
    // State
    user,
    photos,
    interests,
    isLoading,
    error,
    age: calculateAge(user?.birth_date),
    primaryPhoto: photos[0] || null,

    // Actions
    fetchProfile,
    fetchPhotos,
    fetchInterests,
    updateBio,
    updateOccupation,
    updatePhotos,
    updateInterests,
  };
}
