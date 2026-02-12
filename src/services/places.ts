/**
 * Foursquare Places API Service
 * Fetches nearby venues and applies nightlife filtering/scoring
 * Uses the new places-api.foursquare.com endpoint
 */

import type { VenueType, Venue } from '../types/database';
import { isVerifiedVenue, getVerifiedVenueScore } from '../config/verifiedVenues';
import { VENUE_TYPE_SCORES, getVenueTypeScore } from '../config/venueTypeScores';

const FSQ_API_KEY = process.env.EXPO_PUBLIC_FSQ_API_KEY || '';
const FSQ_BASE_URL = 'https://places-api.foursquare.com';
const FSQ_API_VERSION = '2025-06-17';

// Default search radius in meters
const DEFAULT_RADIUS = 10000;

// Response fields to request from the API (photos is Rich Data, not returned by default)
const FSQ_FIELDS = 'fsq_id,name,geocodes,location,categories,distance,photos,rating,price,hours,tel,website';

const FSQ_CATEGORIES = [
  '13003', // Bar
  '13065', // Night Club
  '13014', // Cocktail Bar
  '13029', // Lounge
  '13032', // Pub
  '13064', // Wine Bar
  '13009', // Brewery
  '13034', // Restaurant
  '13025', // Hotel Bar
  '13063', // Karaoke Bar
  '13019', // Beer Garden
  '13057', // Hookah Bar
].join(',');

// Whitelist of allowed nightlife venue types
const NIGHTLIFE_TYPES = [
  // Core nightlife
  'bar', 'pub', 'lounge', 'night_club', 'brewery',
  // Bar variants
  'dive_bar', 'gastropub', 'speakeasy', 'tavern', 'beer_bar',
  // Entertainment
  'karaoke', 'jazz_club', 'comedy_club', 'music_venue',
  // Restaurant (from Foursquare nightlife categories)
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

// Map Foursquare category names to our internal type keys
const FSQ_CATEGORY_MAP: Record<string, string> = {
  'bar': 'bar',
  'cocktail bar': 'cocktail_bar',
  'wine bar': 'wine_bar',
  'beer bar': 'bar',
  'beer garden': 'beer_garden',
  'brewery': 'brewery',
  'dive bar': 'dive_bar',
  'hotel bar': 'bar',
  'lounge': 'lounge',
  'night club': 'night_club',
  'pub': 'pub',
  'hookah bar': 'hookah_bar',
  'karaoke bar': 'karaoke',
  'restaurant': 'restaurant',
  'café': 'cafe',
  'coffee shop': 'cafe',
  'jazz club': 'jazz_club',
  'comedy club': 'comedy_club',
  'music venue': 'music_venue',
  'speakeasy': 'speakeasy',
  'gastropub': 'gastropub',
};

type FsqCategory = {
  fsq_category_id: string;
  name: string;
  short_name?: string;
  plural_name?: string;
  icon?: { prefix: string; suffix: string };
};

type FsqPhoto = {
  id: string;
  prefix: string;
  suffix: string;
  width: number;
  height: number;
};

type FsqPlace = {
  fsq_place_id?: string;
  fsq_id?: string;
  name: string;
  latitude?: number;
  longitude?: number;
  geocodes?: {
    main?: { latitude: number; longitude: number };
  };
  location?: {
    formatted_address?: string;
    address?: string;
    locality?: string;
    region?: string;
    country?: string;
  };
  categories?: FsqCategory[];
  distance?: number;
  photos?: FsqPhoto[];
  rating?: number;
  price?: number;
  hours?: {
    open_now?: boolean;
  };
  tel?: string;
  website?: string;
};

type FsqSearchResponse = {
  results?: FsqPlace[];
};

/**
 * Build a photo URL from Foursquare photo prefix/suffix
 */
function buildPhotoUrl(photo: FsqPhoto, size: string = '400x400'): string {
  return `${photo.prefix}${size}${photo.suffix}`;
}

/**
 * Normalize Foursquare categories to our internal type strings
 */
function normalizeFsqTypes(place: FsqPlace): string[] {
  const categories = place.categories ?? [];
  const types: string[] = [];

  for (const cat of categories) {
    const catName = (cat.name || '').toLowerCase();
    const mapped = FSQ_CATEGORY_MAP[catName];
    if (mapped) {
      types.push(mapped);
    } else {
      // Convert to snake_case
      types.push(catName.replace(/\s+/g, '_'));
    }
  }

  return Array.from(new Set(types));
}

async function fetchFsqPlaces(
  latitude: number,
  longitude: number,
  radius: number
): Promise<FsqPlace[]> {
  const safeRadius = Math.max(100, Math.min(radius, 100000));
  const url = `${FSQ_BASE_URL}/places/search?ll=${latitude},${longitude}&radius=${safeRadius}&categories=${FSQ_CATEGORIES}&fields=${FSQ_FIELDS}&limit=3`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${FSQ_API_KEY}`,
      Accept: 'application/json',
      'X-Places-Api-Version': FSQ_API_VERSION,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Foursquare API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as FsqSearchResponse;
  return data.results ?? [];
}

/**
 * Determine venue type from normalized types array
 */
function determineVenueType(types: string[]): VenueType {
  if (!types || types.length === 0) return 'establishment';
  return types[0];
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
 * Retained for compatibility with previous API surface.
 */
export function getPhotoUrl(): string {
  return '';
}

/**
 * Check if a venue is allowed based on blacklist + scoring approach
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
  place: FsqPlace,
  userLat: number,
  userLng: number
): (Venue & { distance: number; nightlife_score: number }) | null {
  const name = (place.name || '').trim();
  if (!name) return null;

  // Resolve place ID (v3 returns fsq_id, legacy returns fsq_place_id)
  const placeId = place.fsq_id || place.fsq_place_id;
  if (!placeId) return null;

  // Resolve coordinates (v3 returns geocodes.main, legacy returns top-level lat/lng)
  const lat = place.latitude ?? place.geocodes?.main?.latitude;
  const lng = place.longitude ?? place.geocodes?.main?.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return null;
  }

  const types = normalizeFsqTypes(place);
  if (!isAllowedVenue(types, name)) {
    return null;
  }

  // Use Foursquare-provided distance (meters) or calculate
  const distanceKm = place.distance != null
    ? place.distance / 1000
    : calculateDistance(userLat, userLng, lat, lng);

  const nightlifeScore = calculateNightlifeScore(types, name);

  // Extract photos
  const photos = (place.photos ?? []).slice(0, 1).map((p) => buildPhotoUrl(p, '600x400'));
  const photoUrl = photos[0] ?? null;

  // Map Foursquare rating (0-10) to 0-5 scale
  const rating = place.rating != null ? Math.round((place.rating / 2) * 10) / 10 : null;

  return {
    id: placeId,
    place_id: placeId,
    name,
    address: place.location?.formatted_address || place.location?.address || 'Endereço não informado',
    latitude: lat,
    longitude: lng,
    type: determineVenueType(types),
    types,
    photo_url: photoUrl,
    photo_urls: photos,
    rating,
    price_level: place.price ?? null,
    open_now: place.hours?.open_now ?? null,
    active_users_count: 0,
    cached_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    distance: distanceKm,
    nightlife_score: nightlifeScore,
  };
}

// Re-export for backward compatibility
export { VENUE_TYPE_SCORES, getVenueTypeScore } from '../config/venueTypeScores';

/**
 * Fetch photos for a specific place from Foursquare Places API v3.
 * Used on venue detail screen for richer photo gallery.
 */
export async function fetchPlacePhotos(
  fsqId: string,
  limit: number = 10
): Promise<string[]> {
  if (!FSQ_API_KEY || !fsqId) return [];

  try {
    const url = `${FSQ_BASE_URL}/places/${fsqId}/photos?limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${FSQ_API_KEY}`,
        Accept: 'application/json',
        'X-Places-Api-Version': FSQ_API_VERSION,
      },
    });

    if (!response.ok) return [];

    const photos = (await response.json()) as FsqPhoto[];
    return photos.map((p) => buildPhotoUrl(p, '600x400'));
  } catch {
    return [];
  }
}

/**
 * Search for nearby nightlife venues via Foursquare Places API v3.
 */
export async function searchNearbyVenues(
  latitude: number,
  longitude: number,
  radius: number = DEFAULT_RADIUS,
  options: {
    skipNightlifeFilter?: boolean;
    includeVerifiedVenues?: boolean;
    openNowOnly?: boolean;
  } = {}
): Promise<{ venues: (Venue & { distance: number; nightlife_score?: number })[]; error: string | null }> {
  if (!FSQ_API_KEY) {
    return {
      venues: [],
      error: 'Foursquare API key não configurada',
    };
  }

  try {
    const places = await fetchFsqPlaces(latitude, longitude, radius);

    let venues = places
      .map((place) => transformToVenue(place, latitude, longitude))
      .filter((venue): venue is Venue & { distance: number; nightlife_score: number } => venue !== null);

    const uniqueVenues = venues.reduce((acc, venue) => {
      if (!acc.find((v) => v.place_id === venue.place_id)) {
        acc.push(venue);
      }
      return acc;
    }, [] as (Venue & { distance: number; nightlife_score: number })[]);

    uniqueVenues.sort((a, b) => a.distance - b.distance);

    return {
      venues: uniqueVenues,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching venues from Foursquare:', error);
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
