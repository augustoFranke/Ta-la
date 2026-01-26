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
import type { User } from '../types/database';

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

  // Busca dados do perfil do usuário no Supabase usando o Auth UID
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Usuário ainda não tem perfil (novo usuário)
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

  // Inicializa listener de auth state do Supabase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (session) => {
      setSession(session);

      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }

      setLoading(false);
      setInitialized(true);
    });

    return () => unsubscribe();
  }, [setSession, setUser, setLoading, setInitialized, fetchUserProfile]);

  // Envia código OTP para o email usando Supabase
  const sendOTP = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();

      const result = await sendEmailVerification(normalizedEmail);

      if (!result.success) {
        return { success: false, error: result.error || 'Erro ao enviar código' };
      }

      // Armazena o email para usar na verificação
      setPendingEmail(normalizedEmail);

      return { success: true, email: normalizedEmail };
    } catch (error: any) {
      console.error('Erro ao enviar OTP:', error);
      return { success: false, error: error.message || 'Erro ao enviar código' };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setPendingEmail]);

  // Verifica código OTP usando Supabase
  const verifyOTP = useCallback(async (email: string, token: string) => {
    setLoading(true);
    try {
      // Usa o email pendente ou o fornecido
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

      // Busca perfil do usuário no Supabase
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

  // Completa onboarding - salva perfil no Supabase usando Auth UID
  const completeOnboarding = useCallback(async () => {
    if (!session?.user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    setLoading(true);
    try {
      const { name, birth_date, bio, occupation, gender, gender_preference, interests, photos } = onboardingData;

      // Validação básica
      if (!name || !birth_date || !gender || !gender_preference) {
        throw new Error('Dados obrigatórios não preenchidos');
      }

      // 1. Cria/atualiza usuário no Supabase usando Auth UID como ID
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

      // 2. Salva interesses
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

      // 3. Salva fotos (já devem estar no Storage)
      if (photos && photos.length > 0) {
        const photosData = photos.map((url, index) => ({
          user_id: session.user.id,
          url,
          order: index + 1,
        }));

        // Remove fotos antigas primeiro
        await supabase
          .from('photos')
          .delete()
          .eq('user_id', session.user.id);

        const { error: photosError } = await supabase
          .from('photos')
          .insert(photosData);

        if (photosError) throw photosError;
      }

      // 4. Atualiza user no store
      await fetchUserProfile(session.user.id);

      // 5. Limpa dados de onboarding
      clearOnboarding();

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao completar onboarding:', error);
      return { success: false, error: error.message || 'Erro ao salvar perfil' };
    } finally {
      setLoading(false);
    }
  }, [session, onboardingData, setLoading, fetchUserProfile, clearOnboarding]);

  // Logout
  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await supabaseSignOut();
      reset();
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [setLoading, reset]);

  // Verifica se usuário precisa completar onboarding
  // (tem sessão mas não tem perfil no Supabase)
  const needsOnboarding = session !== null && user === null;

  // Verifica se está autenticado completamente
  // (tem sessão E tem perfil verificado no Supabase)
  const isAuthenticated = session !== null && user !== null && user.is_verified;

  return {
    // Estado
    session,
    user,
    isLoading,
    isInitialized,
    isAuthenticated,
    needsOnboarding,
    onboardingData,
    pendingEmail,

    // Ações
    sendOTP,
    verifyOTP,
    completeOnboarding,
    signOut,
    refreshProfile: () => session?.user?.id ? fetchUserProfile(session.user.id) : Promise.resolve(null),
  };
}
