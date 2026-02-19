/**
 * Hook de autenticação
 * Gerencia login via Email OTP com Supabase Auth, sessão e perfil do usuário
 */

import { useEffect, useCallback } from 'react';
import {
  sendEmailVerification,
  confirmEmailCode,
  signOut as supabaseSignOut,
  onAuthStateChanged,
} from '../services/auth';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';
import { useCheckInStore } from '../stores/checkInStore';
import { useBlockStore } from '../stores/blockStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useVenueStore } from '../stores/venueStore';
import type { User } from '../types/database';

const DEV_SKIP_AUTH = __DEV__ && process.env.EXPO_PUBLIC_DEV_SKIP_AUTH === 'true';

const MOCK_USER: User = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'dev@example.com',
  name: 'Dev User',
  birth_date: '1995-01-15',
  bio: 'Desenvolvedor testando o app',
  occupation: 'Developer',
  gender: 'masculino',
  gender_preference: 'todos',
  is_verified: true,
  is_available: true,
  location: null,
  last_active: new Date().toISOString(),
  created_at: new Date().toISOString(),
};

export function useAuth() {
  const {
    session,
    user,
    isLoading,
    isInitialized,
    onboardingData,
    pendingEmail,
    setSession,
    setUser,
    setLoading,
    setInitialized,
    setPendingEmail,
    clearOnboarding,
    reset,
  } = useAuthStore();

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setUser(null);
          return null;
        }
        throw error;
      }

      setUser(data as User);
      return data as User;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      setUser(null);
      return null;
    }
  }, [setUser]);

  useEffect(() => {
    if (DEV_SKIP_AUTH) {
      setUser(MOCK_USER);
      setSession({ user: { id: MOCK_USER.id, email: MOCK_USER.email } } as any);
      setLoading(false);
      setInitialized(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(async (authSession) => {
      setSession(authSession);

      if (authSession?.user) {
        await fetchUserProfile(authSession.user.id);
      } else {
        setUser(null);
      }

      setLoading(false);
      setInitialized(true);
    });

    return () => unsubscribe();
  }, [setSession, setUser, setLoading, setInitialized, fetchUserProfile]);

  const sendOTP = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();

      const result = await sendEmailVerification(normalizedEmail);

      if (!result.success) {
        return { success: false, error: result.error || 'Erro ao enviar código' };
      }

      setPendingEmail(normalizedEmail);

      return { success: true, email: normalizedEmail };
    } catch (error: any) {
      console.error('Erro ao enviar OTP:', error);
      return { success: false, error: error.message || 'Erro ao enviar código' };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setPendingEmail]);

  const verifyOTP = useCallback(async (email: string, token: string) => {
    setLoading(true);
    try {
      const emailToVerify = pendingEmail || email;

      if (!emailToVerify) {
        throw new Error('Nenhum email pendente. Envie o código novamente.');
      }

      const result = await confirmEmailCode(emailToVerify, token);

      if (!result.success) {
        let errorMessage = result.error || 'Código inválido';
        if (errorMessage.includes('expired')) {
          errorMessage = 'Código expirado. Solicite um novo.';
        } else if (errorMessage.includes('invalid')) {
          errorMessage = 'Código de verificação inválido';
        }
        return { success: false, error: errorMessage };
      }

      setPendingEmail(null);

      if (result.user) {
        await fetchUserProfile(result.user.id);
      }

      return { success: true, user: result.user };
    } catch (error: any) {
      console.error('Erro ao verificar OTP:', error);
      return { success: false, error: error.message || 'Código inválido' };
    } finally {
      setLoading(false);
    }
  }, [setLoading, pendingEmail, setPendingEmail, fetchUserProfile]);

  const completeOnboarding = useCallback(async () => {
    if (!session?.user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    setLoading(true);
    try {
      const { name, birth_date, bio, occupation, gender, gender_preference, interests, photos } = onboardingData;

      if (!name || !birth_date || !gender || !gender_preference) {
        throw new Error('Dados obrigatórios não preenchidos');
      }

      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: session.user.id,
          email: session.user.email || '',
          name,
          birth_date,
          bio: bio || null,
          occupation: occupation || null,
          gender,
          gender_preference,
          is_verified: true,
        });

      if (userError) throw userError;

      if (interests && interests.length > 0) {
        const interestsData = interests.map((tag) => ({
          user_id: session.user.id,
          tag,
        }));

        const { error: interestsError } = await supabase
          .from('interests')
          .upsert(interestsData, { onConflict: 'user_id,tag' });

        if (interestsError) throw interestsError;
      }

      if (photos && photos.length > 0) {
        const photosData = photos.map((url, index) => ({
          user_id: session.user.id,
          url,
          order: index + 1,
        }));

        await supabase
          .from('photos')
          .delete()
          .eq('user_id', session.user.id);

        const { error: photosError } = await supabase
          .from('photos')
          .insert(photosData);

        if (photosError) throw photosError;
      }

      await fetchUserProfile(session.user.id);
      clearOnboarding();

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao completar onboarding:', error);
      return { success: false, error: error.message || 'Erro ao salvar perfil' };
    } finally {
      setLoading(false);
    }
  }, [session, onboardingData, setLoading, fetchUserProfile, clearOnboarding]);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await supabaseSignOut();
      useCheckInStore.getState().reset();
      useBlockStore.getState().reset();
      useNotificationStore.getState().reset();
      useVenueStore.getState().setSelectedVenue(null);
      reset();
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [setLoading, reset]);

  const needsOnboarding = session !== null && user === null;
  const isAuthenticated = session !== null && user !== null && user.is_verified;

  return {
    session,
    user,
    isLoading,
    isInitialized,
    isAuthenticated,
    needsOnboarding,
    onboardingData,
    pendingEmail,
    sendOTP,
    verifyOTP,
    completeOnboarding,
    signOut,
    refreshProfile: () => session?.user?.id ? fetchUserProfile(session.user.id) : Promise.resolve(null),
  };
}
