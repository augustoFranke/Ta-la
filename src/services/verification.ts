/**
 * Verification Service
 * Handles phone OTP, document validation, and face validation flows
 * per Spec 003: Profile creation & verification
 */

import { supabase } from './supabase';
import type {
  VerificationStatus,
  RejectionReason,
  DocumentType,
  PhoneOtpState,
  FaceValidationState,
} from '../types/database';

// Constants (Spec 003 + Policy 11)
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_LOCKOUT_MINUTES = 30;
const OTP_RESEND_MAX = 3;
const OTP_RESEND_WINDOW_MINUTES = 30;
const FACE_VALIDATION_MAX_PER_DAY = 3;
const MIN_AGE = 18;

/**
 * Validates CPF format and check digit
 */
export function validateCpf(cpf: string): { valid: boolean; error?: string } {
  const cleaned = cpf.replace(/\D/g, '');

  if (cleaned.length !== 11) {
    return { valid: false, error: 'CPF deve ter 11 digitos' };
  }

  // Check for known invalid patterns (all same digits)
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return { valid: false, error: 'CPF invalido' };
  }

  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i), 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9), 10)) {
    return { valid: false, error: 'CPF invalido' };
  }

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i), 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(10), 10)) {
    return { valid: false, error: 'CPF invalido' };
  }

  return { valid: true };
}

/**
 * Formats CPF string to XXX.XXX.XXX-XX
 */
export function formatCpf(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9)
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
}

/**
 * Validates age from birth date string (YYYY-MM-DD)
 */
export function validateAge(birthDate: string): { valid: boolean; age: number; error?: string } {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (age < MIN_AGE) {
    return {
      valid: false,
      age,
      error: 'Voce precisa ter 18 anos ou mais para usar o Tá lá!',
    };
  }

  if (age > 120) {
    return { valid: false, age, error: 'Data de nascimento invalida' };
  }

  return { valid: true, age };
}

/**
 * Creates an initial phone OTP state
 */
export function createPhoneOtpState(phone: string): PhoneOtpState {
  return {
    phone,
    attempts: 0,
    max_attempts: OTP_MAX_ATTEMPTS,
    expires_at: null,
    locked_until: null,
    last_sent_at: null,
  };
}

/**
 * Checks if OTP is currently locked out
 */
export function isOtpLockedOut(state: PhoneOtpState): boolean {
  if (!state.locked_until) return false;
  return new Date() < new Date(state.locked_until);
}

/**
 * Checks if OTP has expired
 */
export function isOtpExpired(state: PhoneOtpState): boolean {
  if (!state.expires_at) return true;
  return new Date() > new Date(state.expires_at);
}

/**
 * Sends phone OTP via Supabase Auth
 * Returns updated OTP state
 */
export async function sendPhoneOtp(
  state: PhoneOtpState
): Promise<{ success: boolean; state: PhoneOtpState; error?: string }> {
  if (isOtpLockedOut(state)) {
    const lockedUntil = new Date(state.locked_until!);
    const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
    return {
      success: false,
      state,
      error: `Muitas tentativas. Tente novamente em ${minutesLeft} minutos.`,
    };
  }

  try {
    // In production this would call Supabase phone auth or a third-party SMS service
    // For now, we simulate the send
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const updatedState: PhoneOtpState = {
      ...state,
      expires_at: expiresAt.toISOString(),
      last_sent_at: now.toISOString(),
      attempts: 0, // Reset attempts on new send
    };

    return { success: true, state: updatedState };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao enviar codigo';
    return { success: false, state, error: message };
  }
}

/**
 * Verifies phone OTP code
 * Returns updated state with attempt tracking
 */
export async function verifyPhoneOtp(
  state: PhoneOtpState,
  _code: string
): Promise<{ success: boolean; state: PhoneOtpState; error?: string }> {
  if (isOtpLockedOut(state)) {
    return {
      success: false,
      state,
      error: 'Conta bloqueada temporariamente. Tente novamente mais tarde.',
    };
  }

  if (isOtpExpired(state)) {
    return {
      success: false,
      state,
      error: 'Codigo expirado. Solicite um novo.',
    };
  }

  const newAttempts = state.attempts + 1;

  if (newAttempts >= OTP_MAX_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + OTP_LOCKOUT_MINUTES * 60 * 1000);
    const lockedState: PhoneOtpState = {
      ...state,
      attempts: newAttempts,
      locked_until: lockedUntil.toISOString(),
    };
    return {
      success: false,
      state: lockedState,
      error: `Muitas tentativas. Tente novamente em ${OTP_LOCKOUT_MINUTES} minutos.`,
    };
  }

  // In production, this would verify against the actual OTP
  // For simulation: any 6-digit code is accepted
  // The actual verification would happen server-side
  try {
    const updatedState: PhoneOtpState = {
      ...state,
      attempts: newAttempts,
    };

    // Simulate verification -- in production, validate via Supabase or SMS provider
    // For development, we accept the code
    return { success: true, state: updatedState };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao verificar codigo';
    return {
      success: false,
      state: { ...state, attempts: newAttempts },
      error: message,
    };
  }
}

/**
 * Creates initial face validation state
 */
export function createFaceValidationState(): FaceValidationState {
  return {
    attempts_today: 0,
    max_attempts_per_day: FACE_VALIDATION_MAX_PER_DAY,
    last_attempt_at: null,
    next_available_at: null,
  };
}

/**
 * Checks if face validation attempts are exhausted for today
 */
export function isFaceValidationBlocked(state: FaceValidationState): boolean {
  if (state.attempts_today < FACE_VALIDATION_MAX_PER_DAY) return false;

  // Check if the last attempt was today
  if (!state.last_attempt_at) return false;

  const lastAttempt = new Date(state.last_attempt_at);
  const now = new Date();
  const isSameDay =
    lastAttempt.getFullYear() === now.getFullYear() &&
    lastAttempt.getMonth() === now.getMonth() &&
    lastAttempt.getDate() === now.getDate();

  return isSameDay;
}

/**
 * Gets remaining face validation attempts for today
 */
export function getRemainingFaceAttempts(state: FaceValidationState): number {
  if (!isFaceValidationBlocked(state)) {
    // If last attempt was a different day, reset count
    if (state.last_attempt_at) {
      const lastAttempt = new Date(state.last_attempt_at);
      const now = new Date();
      const isSameDay =
        lastAttempt.getFullYear() === now.getFullYear() &&
        lastAttempt.getMonth() === now.getMonth() &&
        lastAttempt.getDate() === now.getDate();

      if (!isSameDay) {
        return FACE_VALIDATION_MAX_PER_DAY;
      }
    } else {
      return FACE_VALIDATION_MAX_PER_DAY;
    }

    return FACE_VALIDATION_MAX_PER_DAY - state.attempts_today;
  }
  return 0;
}

/**
 * Attempts face validation (simulated)
 * In production, this would call an external liveness detection service
 */
export async function attemptFaceValidation(
  state: FaceValidationState,
  _photoUri: string
): Promise<{
  success: boolean;
  state: FaceValidationState;
  error?: string;
}> {
  if (isFaceValidationBlocked(state)) {
    return {
      success: false,
      state,
      error: 'Limite de tentativas atingido. Tente novamente amanha.',
    };
  }

  // Check if we need to reset the counter (new day)
  let currentAttempts = state.attempts_today;
  if (state.last_attempt_at) {
    const lastAttempt = new Date(state.last_attempt_at);
    const now = new Date();
    const isSameDay =
      lastAttempt.getFullYear() === now.getFullYear() &&
      lastAttempt.getMonth() === now.getMonth() &&
      lastAttempt.getDate() === now.getDate();
    if (!isSameDay) {
      currentAttempts = 0;
    }
  }

  const newAttempts = currentAttempts + 1;
  const now = new Date();

  const updatedState: FaceValidationState = {
    ...state,
    attempts_today: newAttempts,
    last_attempt_at: now.toISOString(),
    next_available_at:
      newAttempts >= FACE_VALIDATION_MAX_PER_DAY
        ? getTomorrowMidnight().toISOString()
        : null,
  };

  // Simulate face validation -- in production this calls an external service
  // For development, we accept the photo
  return { success: true, state: updatedState };
}

/**
 * Validates document format based on type
 */
export function validateDocument(
  type: DocumentType,
  number: string
): { valid: boolean; error?: string } {
  const cleaned = number.replace(/\D/g, '');

  switch (type) {
    case 'cpf':
      return validateCpf(number);
    case 'rg':
      if (cleaned.length < 5 || cleaned.length > 14) {
        return { valid: false, error: 'RG deve ter entre 5 e 14 digitos' };
      }
      return { valid: true };
    case 'cnh':
      if (cleaned.length !== 11) {
        return { valid: false, error: 'CNH deve ter 11 digitos' };
      }
      return { valid: true };
    default:
      return { valid: false, error: 'Tipo de documento nao suportado' };
  }
}

/**
 * Updates user verification status in database
 */
export async function updateVerificationStatus(
  userId: string,
  status: VerificationStatus,
  rejectionReason?: RejectionReason | null,
  rejectionDetails?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: Record<string, unknown> = {
      verification_status: status,
      rejection_reason: rejectionReason ?? null,
      rejection_details: rejectionDetails ?? null,
    };

    if (status === 'verified') {
      updateData.is_verified = true;
      updateData.verification_completed_at = new Date().toISOString();
    } else {
      updateData.is_verified = false;
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar status de verificacao';
    console.error('verification.updateVerificationStatus:', message);
    return { success: false, error: message };
  }
}

/**
 * Checks if a photo change triggers re-verification
 * Main photo (slot 0) change triggers re-verification if user was verified
 */
export function doesPhotoChangeTriggerReverification(
  slotIndex: number,
  currentStatus: VerificationStatus
): boolean {
  // Only main photo (slot 0) triggers re-verification (Policy 10)
  if (slotIndex !== 0) return false;
  // Only if user was previously verified
  return currentStatus === 'verified';
}

/**
 * Checks if a field change is identity-critical and should trigger re-verification
 */
export function isIdentityCriticalChange(
  fieldName: string,
  currentStatus: VerificationStatus
): boolean {
  const criticalFields = ['legal_name', 'document_number'];
  if (!criticalFields.includes(fieldName)) return false;
  // Only revert if user was verified or pending
  return currentStatus === 'verified' || currentStatus === 'pending_verification';
}

/**
 * Checks duplicate photos by comparing URIs
 * Returns indices of duplicate pairs
 */
export function findDuplicatePhotos(photoUris: string[]): number[][] {
  const duplicates: number[][] = [];
  for (let i = 0; i < photoUris.length; i++) {
    for (let j = i + 1; j < photoUris.length; j++) {
      if (photoUris[i] === photoUris[j]) {
        duplicates.push([i, j]);
      }
    }
  }
  return duplicates;
}

// Helper
function getTomorrowMidnight(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

// Re-export constants for testing
export const VERIFICATION_CONSTANTS = {
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_LOCKOUT_MINUTES,
  OTP_RESEND_MAX,
  OTP_RESEND_WINDOW_MINUTES,
  FACE_VALIDATION_MAX_PER_DAY,
  MIN_AGE,
} as const;
