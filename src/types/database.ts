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
          last_active?: string
          created_at?: string
        }
      }
    }
  }
}

// Domain types
export type Gender = 'masculino' | 'feminino' | 'outro';
export type GenderPreference = 'masculino' | 'feminino' | 'todos';
export type CheckInVisibility = 'public' | 'friends_only' | 'private';

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
