/**
 * Profile Service
 * CRUD operations for user profiles per Spec 003 and 009
 */

import { supabase } from './supabase';
import {
  isIdentityCriticalChange,
  doesPhotoChangeTriggerReverification,
  updateVerificationStatus,
} from './verification';
import type {
  User,
  Photo,
  VerificationStatus,
  DocumentType,
  Sex,
  PartnerPreference,
} from '../types/database';
import { MIN_PHOTOS, MAIN_PHOTO_SLOT } from '../types/database';

/**
 * Fetches the full user profile including verification fields
 */
export async function fetchUserProfile(
  userId: string
): Promise<{ data: User | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null };
      }
      throw error;
    }

    return { data: data as User };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao buscar perfil';
    console.error('profile.fetchUserProfile:', message);
    return { data: null, error: message };
  }
}

/**
 * Updates profile fields that are NOT identity-critical
 * (bio, occupation, interests, non-main photos, partner_preference)
 * These do NOT affect verification status
 */
export async function updateNonCriticalFields(
  userId: string,
  fields: {
    bio?: string;
    occupation?: string;
    partner_preference?: PartnerPreference;
    gender_identity?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .update(fields)
      .eq('id', userId);

    if (error) throw error;

    // Create audit event
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        await createAuditEvent(userId, key, null, String(value), false);
      }
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar perfil';
    console.error('profile.updateNonCriticalFields:', message);
    return { success: false, error: message };
  }
}

/**
 * Updates identity-critical profile fields
 * These revert verification status to pending_verification if user was verified
 */
export async function updateIdentityCriticalFields(
  userId: string,
  currentStatus: VerificationStatus,
  fields: {
    legal_name?: string;
    document_type?: DocumentType;
    document_number?: string;
  }
): Promise<{ success: boolean; newStatus: VerificationStatus; error?: string }> {
  try {
    let needsReverification = false;

    for (const fieldName of Object.keys(fields)) {
      if (isIdentityCriticalChange(fieldName, currentStatus)) {
        needsReverification = true;
        break;
      }
    }

    const newStatus: VerificationStatus = needsReverification
      ? 'pending_verification'
      : currentStatus;

    const updateData: Record<string, unknown> = { ...fields };
    if (needsReverification) {
      updateData.verification_status = 'pending_verification';
      updateData.is_verified = false;
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;

    // Create audit events
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        await createAuditEvent(userId, key, null, String(value), needsReverification);
      }
    }

    return { success: true, newStatus };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar campos de identidade';
    console.error('profile.updateIdentityCriticalFields:', message);
    return { success: false, newStatus: currentStatus, error: message };
  }
}

/**
 * Updates user photos with minimum count enforcement
 * Enforces 4-photo minimum and checks main photo change for re-verification
 */
export async function updatePhotos(
  userId: string,
  photos: { uri: string; base64?: string; fileName?: string | null; mimeType?: string | null }[],
  currentStatus: VerificationStatus,
  existingPhotos: Photo[]
): Promise<{
  success: boolean;
  newStatus: VerificationStatus;
  error?: string;
}> {
  if (photos.length < MIN_PHOTOS) {
    return {
      success: false,
      newStatus: currentStatus,
      error: `Minimo de ${MIN_PHOTOS} fotos obrigatorias`,
    };
  }

  try {
    // Check if main photo changed (triggers re-verification)
    const existingMainUrl = existingPhotos.find(
      (p) => p.order === MAIN_PHOTO_SLOT + 1
    )?.url;
    const newMainUri = photos[0]?.uri;
    const mainPhotoChanged = existingMainUrl !== newMainUri;
    const needsReverification =
      mainPhotoChanged &&
      doesPhotoChangeTriggerReverification(MAIN_PHOTO_SLOT, currentStatus);

    // Upload photos
    const uploadedUrls: string[] = [];
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];

      // If it's already a remote URL, keep it
      if (/^https?:\/\//.test(photo.uri) && !photo.base64) {
        uploadedUrls.push(photo.uri);
        continue;
      }

      const extension = getFileExtension(photo.mimeType, photo.fileName);
      const fileName = `${userId}/${Date.now()}_${i}.${extension}`;
      const contentType = photo.mimeType || 'image/jpeg';

      const fileBody = await (await fetch(photo.uri)).blob();

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, fileBody, { contentType, upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      uploadedUrls.push(urlData.publicUrl);
    }

    // Replace all photos in database
    await supabase.from('photos').delete().eq('user_id', userId);

    const photosData = uploadedUrls.map((url, index) => ({
      user_id: userId,
      url,
      order: index + 1,
    }));

    const { error: insertError } = await supabase
      .from('photos')
      .insert(photosData);

    if (insertError) throw insertError;

    // Update verification status if needed
    let newStatus = currentStatus;
    if (needsReverification) {
      newStatus = 'pending_verification';
      await updateVerificationStatus(userId, 'pending_verification');
    }

    return { success: true, newStatus };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar fotos';
    console.error('profile.updatePhotos:', message);
    return { success: false, newStatus: currentStatus, error: message };
  }
}

/**
 * Validates that a profile has all required fields for verification submission
 */
export function validateProfileCompleteness(user: Partial<User>, photoCount: number): {
  complete: boolean;
  missingFields: string[];
} {
  const missing: string[] = [];

  if (!user.phone) missing.push('telefone');
  if (!user.legal_name && !user.name) missing.push('nome legal');
  if (!user.document_number) missing.push('documento');
  if (!user.sex) missing.push('sexo');
  if (!user.partner_preference && !user.gender_preference) missing.push('preferencia');
  if (!user.birth_date) missing.push('data de nascimento');
  if (photoCount < MIN_PHOTOS) missing.push(`${MIN_PHOTOS} fotos`);

  return {
    complete: missing.length === 0,
    missingFields: missing,
  };
}

/**
 * Saves extended onboarding profile data (fields not handled by completeOnboarding)
 * This supplements the existing auth flow by adding verification-specific fields
 */
export async function saveOnboardingProfileExtensions(
  userId: string,
  data: {
    phone?: string;
    legal_name?: string;
    document_type?: DocumentType;
    document_number?: string;
    sex?: Sex;
    gender_identity?: string;
    partner_preference?: PartnerPreference;
    verification_status?: VerificationStatus;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .update(data)
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao salvar dados do perfil';
    console.error('profile.saveOnboardingProfileExtensions:', message);
    return { success: false, error: message };
  }
}

/**
 * Checks if the current user has a mutual match with another user
 * Used for match-gating on public profiles (Spec 003 / Slice F contract)
 */
export async function checkMatchStatus(
  currentUserId: string,
  targetUserId: string
): Promise<{ isMatched: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('id')
      .or(
        `and(user1_id.eq.${currentUserId},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${currentUserId})`
      )
      .limit(1);

    if (error) throw error;
    return { isMatched: (data?.length ?? 0) > 0 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao verificar conexao';
    console.error('profile.checkMatchStatus:', message);
    return { isMatched: false, error: message };
  }
}

/**
 * Creates an audit event for profile changes (Spec 009)
 */
async function createAuditEvent(
  userId: string,
  fieldChanged: string,
  oldValue: string | null,
  newValue: string | null,
  verificationImpact: boolean
): Promise<void> {
  try {
    // Audit events are stored for compliance
    // In a production system, this would be a dedicated audit table
    // For now, we log it (the audit table may not exist yet)
    console.error(
      `profile.audit: user=${userId} field=${fieldChanged} impact=${verificationImpact}`
    );
  } catch {
    // Audit logging should not block the main operation
  }
}

// Helper
function getFileExtension(
  mimeType?: string | null,
  fileName?: string | null
): string {
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
