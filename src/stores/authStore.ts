/**
 * Store de autenticação usando Zustand
 * Gerencia estado de sessão Supabase Auth e perfil do usuário
 */

import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { User, OnboardingData, Gender, GenderPreference } from '../types/database';

interface AuthState {
  // Estado de sessão Supabase Auth
  session: Session | null;

  // Dados do perfil no Supabase
  user: User | null;

  // Estado de loading e inicialização
  isLoading: boolean;
  isInitialized: boolean;

  // Email pendente para verificação OTP
  pendingEmail: string | null;

  // Dados temporários de onboarding
  onboardingData: Partial<OnboardingData>;

  // Actions básicas
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setPendingEmail: (email: string | null) => void;

  // Onboarding actions
  setOnboardingPhotos: (photos: string[]) => void;
  setOnboardingBio: (data: { name: string; birth_date: string; bio: string; occupation: string }) => void;
  setOnboardingInterests: (interests: string[]) => void;
  setOnboardingPreferences: (data: { gender: Gender; gender_preference: GenderPreference }) => void;
  setOnboardingPhone: (phone: string) => void;
  clearOnboarding: () => void;

  // Reset completo
  reset: () => void;
}

const initialOnboardingData: Partial<OnboardingData> = {
  photos: [],
  interests: [],
};

export const useAuthStore = create<AuthState>((set) => ({
  // Estado inicial
  session: null,
  user: null,
  isLoading: true,
  isInitialized: false,
  pendingEmail: null,
  onboardingData: initialOnboardingData,

  // Setters básicos
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  setPendingEmail: (pendingEmail) => set({ pendingEmail }),

  // Onboarding - atualiza dados parciais
  setOnboardingPhotos: (photos) =>
    set((state) => ({
      onboardingData: { ...state.onboardingData, photos },
    })),

  setOnboardingBio: (data) =>
    set((state) => ({
      onboardingData: {
        ...state.onboardingData,
        name: data.name,
        birth_date: data.birth_date,
        bio: data.bio,
        occupation: data.occupation,
      },
    })),

  setOnboardingInterests: (interests) =>
    set((state) => ({
      onboardingData: { ...state.onboardingData, interests },
    })),

  setOnboardingPreferences: (data) =>
    set((state) => ({
      onboardingData: {
        ...state.onboardingData,
        gender: data.gender,
        gender_preference: data.gender_preference,
      },
    })),

  setOnboardingPhone: (phone) =>
    set((state) => ({
      onboardingData: { ...state.onboardingData, phone },
    })),

  clearOnboarding: () => set({ onboardingData: initialOnboardingData }),

  // Reset completo (logout)
  reset: () =>
    set({
      session: null,
      user: null,
      isLoading: false,
      pendingEmail: null,
      onboardingData: initialOnboardingData,
    }),
}));
