/**
 * Serviço de Autenticação
 * Configuração e exportação do Supabase Auth para autenticação por email OTP
 */

import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

// Tipos exportados para uso em outros arquivos
export type AuthUser = User;
export type AuthSession = Session;

/**
 * Envia código OTP para o email
 * @param email - Email do usuário
 * @returns Promise com resultado do envio
 */
export async function sendEmailVerification(email: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Verifica o código OTP e autentica o usuário
 * @param email - Email usado no envio
 * @param code - Código OTP de 6 dígitos
 * @returns Promise com as credenciais do usuário
 */
export async function confirmEmailCode(
  email: string,
  code: string
): Promise<{ success: boolean; user?: User; session?: Session; error?: string }> {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email,
    token: code,
    type: 'email',
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user ?? undefined, session: data.session ?? undefined };
}

/**
 * Faz logout do usuário
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Retorna a sessão atual (se autenticada)
 */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Retorna o usuário atual (se autenticado)
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Listener para mudanças no estado de autenticação
 * @param callback - Função chamada quando o estado muda
 * @returns Função para cancelar o listener
 */
export function onAuthStateChanged(
  callback: (session: Session | null) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => subscription.unsubscribe();
}
