export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          birth_date: string
          bio: string | null
          occupation: string | null
          gender: string
          gender_preference: string
          is_verified: boolean
          is_available: boolean
          location: any | null // PostGIS point
          last_active: string
          created_at: string
          phone: string | null
          legal_name: string | null
          document_type: string | null
          document_number: string | null
          sex: string | null
          gender_identity: string | null
          partner_preference: string | null
          verification_status: string
          rejection_reason: string | null
          rejection_details: string | null
          verification_completed_at: string | null
        }
        Insert: {
          id?: string
          email: string
          name: string
          birth_date: string
          bio?: string | null
          occupation?: string | null
          gender: string
          gender_preference: string
          is_verified?: boolean
          is_available?: boolean
          location?: any | null
          last_active?: string
          created_at?: string
          phone?: string | null
          legal_name?: string | null
          document_type?: string | null
          document_number?: string | null
          sex?: string | null
          gender_identity?: string | null
          partner_preference?: string | null
          verification_status?: string
          rejection_reason?: string | null
          rejection_details?: string | null
          verification_completed_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          birth_date?: string
          bio?: string | null
          occupation?: string | null
          gender?: string
          gender_preference?: string
          is_verified?: boolean
          is_available?: boolean
          location?: any | null
          last_active?: string
          created_at?: string
          phone?: string | null
          legal_name?: string | null
          document_type?: string | null
          document_number?: string | null
          sex?: string | null
          gender_identity?: string | null
          partner_preference?: string | null
          verification_status?: string
          rejection_reason?: string | null
          rejection_details?: string | null
          verification_completed_at?: string | null
        }
      }
    }
  }
}

// Domain types
export type Gender = 'masculino' | 'feminino' | 'outro';
export type GenderPreference = 'masculino' | 'feminino' | 'todos';
export type CheckInVisibility = 'public' | 'friends_only' | 'private';

// Profile verification types (Spec 003)
export type VerificationStatus = 'incomplete' | 'pending_verification' | 'verified' | 'rejected';
export type RejectionReason = 'photo_quality' | 'document_invalid' | 'face_mismatch' | 'other';
export type DocumentType = 'cpf' | 'rg' | 'cnh';
export type Sex = 'masculino' | 'feminino' | 'outro';
export type PartnerPreference = 'homens' | 'mulheres' | 'todos';

export const SEX_OPTIONS: readonly { value: Sex; label: string }[] = [
  { value: 'masculino', label: 'Homem' },
  { value: 'feminino', label: 'Mulher' },
  { value: 'outro', label: 'Outro' },
] as const;

export const PARTNER_PREFERENCE_OPTIONS: readonly { value: PartnerPreference; label: string }[] = [
  { value: 'homens', label: 'Homens' },
  { value: 'mulheres', label: 'Mulheres' },
  { value: 'todos', label: 'Todos' },
] as const;

export const REJECTION_REASON_LABELS: Record<RejectionReason, string> = {
  photo_quality: 'Qualidade da foto insuficiente',
  document_invalid: 'Documento invalido',
  face_mismatch: 'Rosto nao corresponde ao documento',
  other: 'Outro motivo',
};

// Minimum photo count required (Spec 003 / Policy 15)
export const MIN_PHOTOS = 4;
export const MAX_PHOTOS = 4;
export const MAIN_PHOTO_SLOT = 0;

export type ReportReason =
  | 'comportamento_inadequado'
  | 'fotos_falsas'
  | 'spam'
  | 'assedio'
  | 'outro';

export const REPORT_REASONS: readonly { value: ReportReason; label: string }[] = [
  { value: 'comportamento_inadequado', label: 'Comportamento inadequado' },
  { value: 'fotos_falsas', label: 'Fotos falsas' },
  { value: 'spam', label: 'Spam' },
  { value: 'assedio', label: 'Assedio' },
  { value: 'outro', label: 'Outro' },
] as const;

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: ReportReason;
  details: string | null;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  birth_date: string;
  bio: string | null;
  occupation: string | null;
  gender: Gender;
  gender_preference: GenderPreference;
  is_verified: boolean;
  is_available: boolean;
  location: any | null;
  last_active: string;
  created_at: string;
  // Profile verification fields (Spec 003)
  phone?: string | null;
  legal_name?: string | null;
  document_type?: DocumentType | null;
  document_number?: string | null;
  sex?: Sex | null;
  gender_identity?: string | null;
  partner_preference?: PartnerPreference | null;
  verification_status?: VerificationStatus;
  rejection_reason?: RejectionReason | null;
  rejection_details?: string | null;
  verification_completed_at?: string | null;
}

export interface OnboardingData {
  name: string;
  birth_date: string;
  bio: string;
  occupation: string;
  gender: Gender;
  gender_preference: GenderPreference;
  photos: string[];
  interests: string[];
  // Extended fields (Spec 003)
  phone?: string;
  legal_name?: string;
  document_type?: DocumentType;
  document_number?: string;
  sex?: Sex;
  gender_identity?: string;
  partner_preference?: PartnerPreference;
}

// Verification attempt tracking (Spec 003)
export interface VerificationAttempt {
  id: string;
  user_id: string;
  attempt_type: 'phone_otp' | 'face_validation' | 'document_submission';
  status: 'success' | 'failure';
  failure_reason?: string | null;
  created_at: string;
}

// Phone OTP state (Spec 003)
export interface PhoneOtpState {
  phone: string;
  attempts: number;
  max_attempts: number;
  expires_at: string | null;
  locked_until: string | null;
  last_sent_at: string | null;
}

// Face validation state (Spec 003)
export interface FaceValidationState {
  attempts_today: number;
  max_attempts_per_day: number;
  last_attempt_at: string | null;
  next_available_at: string | null;
}

// Profile audit event (Spec 009)
export interface ProfileAuditEvent {
  id: string;
  user_id: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  verification_impact: boolean;
  created_at: string;
}

// Identity-critical fields that trigger re-verification (Policy 10)
export const IDENTITY_CRITICAL_FIELDS: readonly string[] = [
  'legal_name',
  'document_number',
] as const;

// Photo from photos table
export interface Photo {
  id: string;
  user_id: string;
  url: string;
  order: number;
  created_at: string;
}

// Interest from interests table
export interface Interest {
  id: string;
  user_id: string;
  tag: string;
  created_at: string;
}

// Notification preference types
export type NotificationCategory = 'social_drinks' | 'social_matches' | 'venue_offers';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  social_drinks: boolean;
  social_matches: boolean;
  venue_offers: boolean;
  updated_at: string;
}

export const NOTIFICATION_CATEGORIES: readonly { value: NotificationCategory; label: string }[] = [
  { value: 'social_drinks', label: 'Convites de drink' },
  { value: 'social_matches', label: 'Conexoes e matches' },
  { value: 'venue_offers', label: 'Ofertas do local' },
] as const;

// Interaction types
export type InteractionType = 'drink' | 'wave' | 'like';

export interface Interaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  venue_id: string;
  interaction_type: InteractionType;
  created_at: string;
}

export interface ReceivedInteraction {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_photo_url: string | null;
  interaction_type: InteractionType;
  created_at: string;
}

export const INTERACTION_LABELS: Record<InteractionType, string> = {
  drink: 'um drink',
  wave: 'uma onda',
  like: 'uma curtida',
};

// Venue types
export type VenueType = string;

export interface Venue {
  id: string;
  place_id: string; // Provider place ID (Radar)
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: VenueType;
  types?: string[]; // Provider categories/types for scoring
  photo_url: string | null;
  photo_urls: string[];
  rating: number | null;
  price_level: number | null; // 1-4
  open_now: boolean | null;
  active_users_count: number;
  open_to_meeting_count?: number;
  cached_at: string;
  created_at: string;
}

// Check-in with open_to_meeting status
export interface CheckIn {
  id: string;
  user_id: string;
  venue_id: string;
  is_active: boolean;
  open_to_meeting: boolean;
  visibility: CheckInVisibility;
  checked_in_at: string;
  checked_out_at: string | null;
}

// Conexoes (matches confirmados)
export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  venue_id: string | null;
  confirmed: boolean;
  matched_at: string;
  confirmed_at: string | null;
}

// Favoritos
export interface UserFavoritePlace {
  id: string;
  user_id: string;
  place_id: string;
  name: string;
  address: string | null;
  photo_url: string | null;
  created_at: string;
}
