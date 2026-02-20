/**
 * Google Places API (New) Service
 * Fetches nearby venues using the Google Places Nearby Search endpoint.
 * Uses Field Masking to exclude expensive fields (rating, openingHours).
 */

import type { VenueType, Venue } from '../types/database';
import { isVerifiedVenue, getVerifiedVenueScore } from '../config/verifiedVenues';
import { VENUE_TYPE_SCORES } from '../config/venueTypeScores';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
const GOOGLE_PLACES_BASE_URL = 'https://places.googleapis.com/v1';

// Default search radius in meters
const DEFAULT_RADIUS = 2000;

// Field Masking — excludes rating and openingHours (expensive fields, VENUE-DATA-02)
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.location',
  'places.formattedAddress',
  'places.photos',
  'places.primaryType',
  'places.types',
  'places.priceLevel',
].join(',');

// Types to include in Google Places search request (must be Table A types)
// See: https://developers.google.com/maps/documentation/places/web-service/place-types
const INCLUDED_TYPES = [
  'bar',
  'night_club',
  'pub',
  'lounge_bar',       // replaces 'lounge' (not a valid Table A type)
  'cocktail_bar',
  'wine_bar',
  'brewery',
  'beer_garden',
  'karaoke',
  'comedy_club',
  'live_music_venue',  // replaces 'music_venue' (not a valid Table A type)
  'restaurant',
  // jazz_club removed — not a valid Table A type, covered by night_club + live_music_venue
];

// Whitelist of allowed nightlife venue types
const NIGHTLIFE_TYPES = [
  // Core nightlife
  'bar', 'pub', 'lounge', 'lounge_bar', 'night_club', 'brewery',
  // Bar variants
  'dive_bar', 'gastropub', 'speakeasy', 'tavern', 'beer_bar',
  // Entertainment
  'karaoke', 'jazz_club', 'comedy_club', 'live_music_venue', 'music_venue',
  // Restaurant (from nightlife categories)
  'restaurant',
  // Additional nightlife types
  'cocktail_bar', 'wine_bar', 'beer_garden', 'hookah_bar',
];

// Blacklisted venue types - venues with ANY of these types are excluded
const BLACKLISTED_TYPES = [
  'beauty_salon', 'hair_care', 'spa', 'gym', 'physiotherapist',
  'doctor', 'dentist', 'hospital', 'pharmacy', 'bank', 'atm',
  'finance', 'post_office', 'police', 'school', 'university',
  'library', 'local_government_office', 'car_repair', 'car_wash',
  'veterinary_care', 'laundry', 'storage', 'store', 'clothing_store',
  'home_goods_store', 'electronics_store', 'furniture_store',
  'hardware_store', 'jewelry_store', 'pet_store', 'shoe_store',
  'shopping_mall', 'department_store', 'supermarket', 'grocery_store',
  'convenience_store', 'gas_station', 'fast_food_restaurant',
  'meal_takeaway', 'meal_delivery', 'lodging', 'motel', 'hotel',
  'hostel', 'campground', 'rv_park', 'resort',
];

// Blacklist by name pattern
const BLACKLIST_NAME_PATTERNS = [
  /mcdonalds?/i, /burger king/i, /subway/i, /kfc/i, /wendy'?s/i,
  /taco bell/i, /pizza hut/i, /domino'?s/i, /applebee'?s/i,
  /chili'?s/i, /outback/i, /olive garden/i, /dennys?/i, /ihop/i,
  /tatuagem/i, /tattoo/i, /sobrancelha/i, /maquiagem/i, /barbearia/i,
  /barber/i, /cabeleireir[oa]/i, /hair/i, /dep[óo]sito/i, /g[áa]s/i,
  /mercado/i, /drogaria/i, /farm[áa]cia/i, /est[ée]tica/i, /banco/i,
  /cl[íi]nica/i, /oficina/i, /mecanic[ao]/i, /lava ?jato/i,
  /material de constru[çc][ãa]o/i, /hotel/i, /pousada/i, /motel/i,
  /resort/i, /hostel/i,
];

// Map Google's snake_case types to our internal type strings
const GOOGLE_TYPE_MAP: Record<string, string> = {
  'bar': 'bar',
  'night_club': 'night_club',
  'pub': 'pub',
  'cocktail_bar': 'cocktail_bar',
  'wine_bar': 'wine_bar',
  'brewery': 'brewery',
  'beer_garden': 'beer_garden',
  'karaoke': 'karaoke',
  'jazz_club': 'jazz_club',
  'comedy_club': 'comedy_club',
  'live_music_venue': 'music_venue',  // map Google's type to our internal name
  'music_venue': 'music_venue',
  'restaurant': 'restaurant',
  'lounge': 'lounge',
  'lounge_bar': 'lounge',            // map Google's type to our internal name
};

// Map Google's priceLevel enum strings to integer 0-4
const PRICE_LEVEL_MAP: Record<string, number> = {
  'PRICE_LEVEL_FREE': 0,
  'PRICE_LEVEL_INEXPENSIVE': 1,
  'PRICE_LEVEL_MODERATE': 2,
  'PRICE_LEVEL_EXPENSIVE': 3,
  'PRICE_LEVEL_VERY_EXPENSIVE': 4,
};

type GooglePhoto = {
  name: string; // e.g. "places/{place_id}/photos/{photo_reference}"
};

type GooglePlace = {
  id: string;
  displayName?: { text: string };
  location?: { latitude: number; longitude: number };
  formattedAddress?: string;
  photos?: GooglePhoto[];
  primaryType?: string;
  types?: string[];
  priceLevel?: string;
};

type GooglePlacesResponse = {
  places?: GooglePlace[];
};

/**
 * Build a photo URL from a Google Places photo name
 */
function buildPhotoUrl(photoName: string): string {
  return `${GOOGLE_PLACES_BASE_URL}/${photoName}/media?maxWidthPx=600&key=${GOOGLE_API_KEY}`;
}

/**
 * Normalize Google Places types to our internal type strings
 */
function normalizeGoogleTypes(place: GooglePlace): string[] {
  const allTypes = place.types ?? [];
  const primary = place.primaryType;
  const types: string[] = [];

  // Primary type first
  if (primary) {
    const mapped = GOOGLE_TYPE_MAP[primary];
    if (mapped) types.push(mapped);
    else types.push(primary);
  }

  for (const t of allTypes) {
    if (t === primary) continue;
    const mapped = GOOGLE_TYPE_MAP[t];
    if (mapped) {
      types.push(mapped);
    } else {
      types.push(t);
    }
  }

  return Array.from(new Set(types));
}

async function fetchGooglePlaces(
  latitude: number,
  longitude: number,
  radius: number
): Promise<GooglePlace[]> {
  const safeRadius = Math.max(100, Math.min(radius, 50000));

  if (__DEV__) {
    console.warn(
      `[Places API] BILLING: Calling Google Places searchNearby ` +
      `(lat=${latitude.toFixed(4)}, lng=${longitude.toFixed(4)}, radius=${safeRadius}m)`
    );
  }

  const body = {
    includedTypes: INCLUDED_TYPES,
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude, longitude },
        radius: safeRadius,
      },
    },
  };

  const response = await fetch(`${GOOGLE_PLACES_BASE_URL}/places:searchNearby`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Places API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as GooglePlacesResponse;
  return data.places ?? [];
}

/**
 * Determine venue type from normalized types array
 */
function determineVenueType(types: string[]): VenueType {
  if (!types || types.length === 0) return 'establishment';
  return types[0] as VenueType;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m de você`;
  }
  return `${distanceKm.toFixed(1)} km de você`;
}

/**
 * Check if a venue is allowed based on blacklist + nightlife filter (VENUE-DATA-05)
 */
function isAllowedVenue(types: string[], name: string): boolean {
  if (isVerifiedVenue(name)) {
    return true;
  }

  if (types.some((type) => BLACKLISTED_TYPES.includes(type))) {
    return false;
  }

  if (BLACKLIST_NAME_PATTERNS.some((pattern) => pattern.test(name))) {
    return false;
  }

  return types.some((type) => NIGHTLIFE_TYPES.includes(type));
}

/**
 * Simplified nightlife score for venue filtering.
 */
function calculateNightlifeScore(types: string[], name: string): number {
  const verifiedScore = getVerifiedVenueScore(name);
  if (verifiedScore !== null) return verifiedScore;

  const typeScores = types.map((t) => VENUE_TYPE_SCORES[t] ?? 20);
  const maxTypeScore = Math.max(...typeScores, 0);
  const score = Math.round(maxTypeScore * 0.25) + 20;

  return Math.max(0, Math.min(100, score));
}

function transformToVenue(
  place: GooglePlace,
  userLat: number,
  userLng: number
): (Venue & { distance: number; nightlife_score: number }) | null {
  const name = (place.displayName?.text || '').trim();
  if (!name) return null;

  const placeId = place.id;
  if (!placeId) return null;

  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return null;
  }

  const types = normalizeGoogleTypes(place);
  if (!isAllowedVenue(types, name)) {
    return null;
  }

  const distanceKm = calculateDistance(userLat, userLng, lat, lng);
  const nightlifeScore = calculateNightlifeScore(types, name);

  // Take at most 1 photo
  const photoName = place.photos?.[0]?.name;
  const photoUrl = photoName ? buildPhotoUrl(photoName) : null;
  const photos = photoUrl ? [photoUrl] : [];

  // Map Google price level enum to integer
  const priceLevel = place.priceLevel != null ? (PRICE_LEVEL_MAP[place.priceLevel] ?? null) : null;

  return {
    id: placeId,
    place_id: placeId,
    name,
    address: place.formattedAddress || 'Endereço não informado',
    latitude: lat,
    longitude: lng,
    type: determineVenueType(types),
    types,
    photo_url: photoUrl,
    photo_urls: photos,
    rating: null, // Excluded via Field Masking (VENUE-DATA-02)
    price_level: priceLevel,
    open_now: null, // Excluded via Field Masking (VENUE-DATA-02)
    active_users_count: 0,
    cached_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    distance: distanceKm,
    nightlife_score: nightlifeScore,
  };
}

/**
 * Search for nearby nightlife venues via Google Places API (New).
 * Returns venues in Google's relevance order (not sorted by distance).
 */
export async function searchNearbyVenues(
  latitude: number,
  longitude: number,
  radius: number = DEFAULT_RADIUS,
  options: {
    skipNightlifeFilter?: boolean;
    openNowOnly?: boolean;
  } = {}
): Promise<{ venues: (Venue & { distance: number; nightlife_score?: number })[]; error: string | null }> {
  if (!GOOGLE_API_KEY) {
    return {
      venues: [],
      error: 'Google Places API key não configurada',
    };
  }

  try {
    const places = await fetchGooglePlaces(latitude, longitude, radius);

    const venues = places
      .map((place) => transformToVenue(place, latitude, longitude))
      .filter((venue): venue is Venue & { distance: number; nightlife_score: number } => venue !== null);

    const uniqueVenues = venues.reduce((acc, venue) => {
      if (!acc.find((v) => v.place_id === venue.place_id)) {
        acc.push(venue);
      }
      return acc;
    }, [] as (Venue & { distance: number; nightlife_score: number })[]);

    // Return in Google's relevance order (no distance sort)
    return {
      venues: uniqueVenues,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching venues from Google Places:', error);
    return {
      venues: [],
      error: 'Erro ao buscar venues. Verifique sua conexão.',
    };
  }
}

/**
 * Get venue type display label in Portuguese
 */
export function getVenueTypeLabel(type: VenueType): string {
  const translations: Record<string, string> = {
    bar: 'Bar',
    night_club: 'Boate',
    lounge: 'Lounge',
    restaurant: 'Restaurante',
    cafe: 'Café',
    pub: 'Pub',
    cocktail_bar: 'Bar de Coquetéis',
    wine_bar: 'Wine Bar',
    beer_garden: 'Beer Garden',
    brewery: 'Cervejaria',
    hookah_bar: 'Hookah Bar',
    karaoke: 'Karaokê',
    jazz_club: 'Jazz Club',
    comedy_club: 'Comedy Club',
    music_venue: 'Casa de Shows',
    speakeasy: 'Speakeasy',
    gastropub: 'Gastropub',
    dive_bar: 'Dive Bar',
    food_beverage: 'Comida e Bebida',
    establishment: 'Local',
    nightlife: 'Vida Noturna',
  };

  if (translations[type]) {
    return translations[type];
  }

  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
