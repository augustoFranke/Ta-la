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

// Vibe configuration with labels and emojis
export const VIBE_CONFIG: Record<VibeType, { label: string; emoji: string }> = {
  good_for_dating: { label: 'Bom para encontros', emoji: '💕' },
  singles_friendly: { label: 'Singles friendly', emoji: '💫' },
  great_atmosphere: { label: 'Otima atmosfera', emoji: '✨' },
  easy_conversation: { label: 'Facil conversar', emoji: '💬' },
  intimate_setting: { label: 'Ambiente intimo', emoji: '🕯️' },
  upscale_crowd: { label: 'Publico sofisticado', emoji: '🥂' },
  casual_vibes: { label: 'Casual e relaxado', emoji: '😎' },
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
