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
          location: any | null // PostGIS point
          push_token: string | null
          last_active: string
          created_at: string
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
          location?: any | null
          push_token?: string | null
          last_active?: string
          created_at?: string
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
          location?: any | null
          push_token?: string | null
          last_active?: string
          created_at?: string
        }
      }
      // ... (other tables omitted for brevity if not strictly needed yet)
    }
  }
}

// Domain types
export type Gender = 'masculino' | 'feminino' | 'outro';
export type GenderPreference = 'masculino' | 'feminino' | 'todos';

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
  location: any | null;
  push_token: string | null;
  last_active: string;
  created_at: string;
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
}

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

// Venue types
export type VenueType = string;

export interface Venue {
  id: string;
  place_id: string; // Google Places ID
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: VenueType;
  types?: string[]; // All Google Places types for scoring
  photo_url: string | null;
  photo_urls: string[];
  rating: number | null;
  price_level: number | null; // 1-4
  open_now: boolean | null;
  active_users_count: number;
  // Dating-specific fields
  open_to_meeting_count?: number;
  top_vibes?: VibeType[];
  dating_score?: number;
  cached_at: string;
  created_at: string;
}

// Google Places API response types
export interface GooglePlaceResult {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  photos?: {
    photo_reference: string;
    width: number;
    height: number;
  }[];
  rating?: number;
  price_level?: number;
  opening_hours?: {
    open_now: boolean;
  };
}

export interface GooglePlacesResponse {
  results: GooglePlaceResult[];
  status: string;
  next_page_token?: string;
}

// Vibe types for venue tagging
export type VibeType =
  | 'good_for_dating'
  | 'singles_friendly'
  | 'great_atmosphere'
  | 'easy_conversation'
  | 'intimate_setting'
  | 'upscale_crowd'
  | 'casual_vibes';

// Vibe configuration with labels and icon names
export const VIBE_CONFIG: Record<VibeType, { label: string; icon: string }> = {
  good_for_dating: { label: 'Bom para encontros', icon: 'heart' },
  singles_friendly: { label: 'Amigável para solteiros', icon: 'people' },
  great_atmosphere: { label: 'Ótima atmosfera', icon: 'sparkles' },
  easy_conversation: { label: 'Fácil conversar', icon: 'chatbubble-ellipses' },
  intimate_setting: { label: 'Ambiente íntimo', icon: 'moon' },
  upscale_crowd: { label: 'Público sofisticado', icon: 'wine' },
  casual_vibes: { label: 'Casual e relaxado', icon: 'happy' },
};

// Venue vibe record from database
export interface VenueVibe {
  id: string;
  venue_id: string;
  user_id: string;
  vibe: VibeType;
  created_at: string;
}

// Dating-specific data for venue display
export interface VenueDatingData {
  datingScore: number;
  openToMeetingCount: number;
  topVibes: VibeType[];
}

// Check-in with open_to_meeting status
export interface CheckIn {
  id: string;
  user_id: string;
  venue_id: string;
  is_active: boolean;
  open_to_meeting: boolean;
  checked_in_at: string;
  checked_out_at: string | null;
}

// Conexões (matches confirmados)
export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  venue_id: string | null;
  confirmed: boolean;
  matched_at: string;
  confirmed_at: string | null;
}

// Pedido de conexão
export interface ConnectionRequest {
  id: string;
  requester_id: string;
  requested_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'canceled';
  created_at: string;
  responded_at: string | null;
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

// Mensagens (chat)
export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  media_path: string | null;
  media_mime: string | null;
  media_width: number | null;
  media_height: number | null;
}

// ============================================================================
// Venue Filtering & Metadata Types
// ============================================================================

// Venue metadata for nightlife scoring and community curation
export interface VenueMetadata {
  id: string;
  place_id: string;
  // Operating hours analysis
  opening_hours: GooglePlaceOpeningHours | null;
  closes_late_weekend: boolean;
  opens_evening: boolean;
  // Review keyword signals
  review_keywords_positive: number;
  review_keywords_negative: number;
  // Community curation
  is_verified_nightlife: boolean | null;
  is_blocked: boolean;
  user_flag_count: number;
  // Computed score
  nightlife_score: number;
  // Cache management
  last_details_fetch: string | null;
  created_at: string;
  updated_at: string;
}

// User flag types for community curation
export type VenueFlagType = 'not_nightlife' | 'closed' | 'wrong_category';

// Venue flag record from database
export interface VenueFlag {
  id: string;
  place_id: string;
  user_id: string;
  flag_type: VenueFlagType;
  note: string | null;
  created_at: string;
}

// Flag type configuration with labels
export const VENUE_FLAG_CONFIG: Record<VenueFlagType, { label: string; description: string }> = {
  not_nightlife: {
    label: 'Nao e bar/balada',
    description: 'Este lugar nao e um bar, boate ou local de vida noturna',
  },
  closed: {
    label: 'Lugar fechou',
    description: 'Este estabelecimento fechou permanentemente',
  },
  wrong_category: {
    label: 'Categoria errada',
    description: 'O tipo de estabelecimento esta incorreto',
  },
};

// ============================================================================
// Google Places Details API Types
// ============================================================================

// Opening hours period from Google Places Details API
export interface GooglePlaceOpeningPeriod {
  open: {
    day: number; // 0 = Sunday, 6 = Saturday
    time: string; // HHMM format, e.g., "1800"
  };
  close?: {
    day: number;
    time: string;
  };
}

// Full opening hours object from Google Places Details API
export interface GooglePlaceOpeningHours {
  open_now?: boolean;
  periods?: GooglePlaceOpeningPeriod[];
  weekday_text?: string[];
}

// Review from Google Places Details API
export interface GooglePlaceReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  language?: string;
}

// Google Places Details API response
export interface GooglePlaceDetailsResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  url?: string; // Google Maps URL
  types: string[];
  opening_hours?: GooglePlaceOpeningHours;
  reviews?: GooglePlaceReview[];
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: {
    photo_reference: string;
    width: number;
    height: number;
  }[];
}

export interface GooglePlaceDetailsResponse {
  result: GooglePlaceDetailsResult;
  status: string;
  error_message?: string;
}
