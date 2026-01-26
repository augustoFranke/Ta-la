/**
 * Google Places API Service
 * Fetches nearby nightlife venues (bars, clubs, lounges)
 */

import type { GooglePlacesResponse, GooglePlaceResult, VenueType, Venue } from '../types/database';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
const PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// Venue types to search for via Google Places API
const SEARCH_TYPES = ['bar', 'night_club', 'restaurant'];

// Default search radius in meters (2km)
const DEFAULT_RADIUS = 2000;

// Blacklisted venue types - venues with ANY of these types are excluded
const BLACKLISTED_TYPES = [
  'beauty_salon',
  'hair_care',
  'spa',
  'gym',
  'physiotherapist',
  'doctor',
  'dentist',
  'hospital',
  'pharmacy',
  'bank',
  'atm',
  'finance',
  'post_office',
  'police',
  'school',
  'university',
  'library',
  'local_government_office',
  'car_repair',
  'car_wash',
  'veterinary_care',
  'laundry',
  'storage',
  'store',
  'clothing_store',
  'home_goods_store',
  'electronics_store',
  'furniture_store',
  'hardware_store',
  'jewelry_store',
  'pet_store',
  'shoe_store',
  'shopping_mall',
  'department_store',
  'supermarket',
  'grocery_store',
  'convenience_store',
  'gas_station',
  'bowling_alley',
  'casino',
  'sports_bar',
  'fast_food_restaurant',
  'meal_takeaway',
  'meal_delivery',
  // Accommodation
  'lodging',
  'motel',
  'hotel',
  'hostel',
  'campground',
  'rv_park',
  'resort',
];

// Blacklist by name pattern - common chains and sports-focused venues
const BLACKLIST_NAME_PATTERNS = [
  // Fast food & Chains
  /mcdonalds?/i,
  /burger king/i,
  /subway/i,
  /kfc/i,
  /wendy'?s/i,
  /taco bell/i,
  /pizza hut/i,
  /domino'?s/i,
  /hooters/i,
  /buffalo wild wings/i,
  /b-?dubs/i,
  /sports (bar|grill)/i,
  /wing stop/i,
  /wingstop/i,
  /applebee'?s/i,
  /chili'?s/i,
  /outback/i,
  /olive garden/i,
  /red lobster/i,
  /dennys?/i,
  /ihop/i,

  // Unwanted business keywords
  /tatuagem/i,
  /tattoo/i,
  /sobrancelha/i,
  /maquiagem/i,
  /make ?up/i,
  /barbearia/i,
  /barber/i,
  /cabeleireir[oa]/i,
  /hair/i,
  /dep[óo]sito/i,
  /g[áa]s/i,
  /mercado/i,
  /drogaria/i,
  /farm[áa]cia/i,
  /est[ée]tica/i,
  /banco/i,
  /caixa ?(eletr[ôo]nico)?/i,
  /cl[íi]nica/i,
  /oficina/i,
  /mecanic[ao]/i,
  /lava ?jato/i,
  /material de constru[çc][ãa]o/i,

  // Accommodation
  /hotel/i,
  /pousada/i,
  /motel/i,
  /resort/i,
  /\binn\b/i,
  /hostel/i,
  /guest ?house/i,
  /bed ?& ?breakfast/i,
  /\bb ?& ?b\b/i,
];

// Dating-friendly scoring by venue type (higher = better for dating)
export const VENUE_TYPE_SCORES: Record<string, number> = {
  // Top tier - Intimate, sophisticated
  'cocktail_bar': 100,
  'wine_bar': 100,
  'speakeasy': 100,
  'rooftop_bar': 95,
  'lounge': 90,
  // High tier - Upscale dining
  'bistro': 80,
  'gastropub': 75,
  'jazz_club': 75,
  // Mid tier - Good atmosphere
  'bar': 60,
  'night_club': 60,
  'dance_club': 60,
  'beer_garden': 55,
  'hookah_bar': 50,
  // Lower tier - More casual
  'restaurant': 40,
  'pub': 30,
  'brewery': 30,
  'tavern': 30,
  'dive_bar': 25,
  // Entertainment - Context dependent
  'karaoke': 45,
  'comedy_club': 50,
  'music_venue': 45,
  'concert_hall': 40,
  'nightlife': 50,
};

/**
 * Get photo URL for a place using photo_reference
 */
export function getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
  const encodedReference = encodeURIComponent(photoReference);
  return `${PLACES_BASE_URL}/photo?maxwidth=${maxWidth}&photoreference=${encodedReference}&key=${GOOGLE_PLACES_API_KEY}`;
}

/**
 * Determine venue type from Google Places types array
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
  const R = 6371; // Earth's radius in km
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
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

/**
 * Check if a venue is allowed based on blacklist + scoring approach
 * Returns false if venue is blacklisted, true if it has any positive score
 */
function isAllowedVenue(types: string[], name: string): boolean {
  // Check type blacklist - if ANY type is blacklisted, exclude venue
  if (types.some((type) => BLACKLISTED_TYPES.includes(type))) {
    return false;
  }

  // Check name blacklist - exclude common chains and family restaurants
  if (BLACKLIST_NAME_PATTERNS.some((pattern) => pattern.test(name))) {
    return false;
  }

  // Allow if any type has a positive score
  return types.some((type) => (VENUE_TYPE_SCORES[type] ?? 0) > 0);
}

/**
 * Get the dating-friendliness score for a venue based on its types
 */
export function getVenueTypeScore(types: string[]): number {
  const scores = types.map((type) => VENUE_TYPE_SCORES[type] ?? 20);
  return Math.max(...scores, 0);
}

/**
 * Transform Google Place result to Venue
 */
function transformToVenue(
  place: GooglePlaceResult,
  userLat: number,
  userLng: number
): (Venue & { distance: number }) | null {
  // Only allow venues that pass blacklist and have positive dating score
  if (!isAllowedVenue(place.types, place.name)) {
    return null;
  }
  const photoUrls = place.photos?.length
    ? place.photos.map((photo) => getPhotoUrl(photo.photo_reference))
    : [];
  const photoUrl = photoUrls[0] || null;
  const openNow = place.opening_hours?.open_now ?? null;

  const distance = calculateDistance(
    userLat,
    userLng,
    place.geometry.location.lat,
    place.geometry.location.lng
  );

  return {
    id: place.place_id, // Use place_id as temporary id
    place_id: place.place_id,
    name: place.name,
    address: place.vicinity,
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
    type: determineVenueType(place.types),
    types: place.types, // Include all types for scoring
    photo_url: photoUrl,
    photo_urls: photoUrls,
    rating: place.rating || null,
    price_level: place.price_level || null,
    open_now: openNow,
    active_users_count: 0, // Will be populated from Supabase
    cached_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    distance,
  };
}

/**
 * Search for nearby nightlife venues
 */
export async function searchNearbyVenues(
  latitude: number,
  longitude: number,
  radius: number = DEFAULT_RADIUS
): Promise<{ venues: (Venue & { distance: number })[]; error: string | null }> {
  if (!GOOGLE_PLACES_API_KEY) {
    return {
      venues: [],
      error: 'Google Places API key não configurada',
    };
  }

  try {
    const allVenues: (Venue & { distance: number })[] = [];

    // Search for each venue type
    for (const type of SEARCH_TYPES) {
      const url = `${PLACES_BASE_URL}/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(url);
      const data: GooglePlacesResponse = await response.json();

      if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
        const venues = data.results
          .map((place) => transformToVenue(place, latitude, longitude))
          .filter((venue): venue is Venue & { distance: number } => venue !== null);
        allVenues.push(...venues);
      } else if (data.status === 'REQUEST_DENIED') {
        return {
          venues: [],
          error: 'Acesso à API negado. Verifique sua chave.',
        };
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        return {
          venues: [],
          error: 'Limite de requisições excedido. Tente novamente mais tarde.',
        };
      }
    }

    // Remove duplicates (same place might appear in multiple type searches)
    const uniqueVenues = allVenues.reduce((acc, venue) => {
      if (!acc.find((v) => v.place_id === venue.place_id)) {
        acc.push(venue);
      }
      return acc;
    }, [] as (Venue & { distance: number })[]);

    // Filter to only show currently open venues
    const openVenues = uniqueVenues.filter((venue) => venue.open_now === true);

    // Sort by distance
    openVenues.sort((a, b) => a.distance - b.distance);

    return {
      venues: openVenues,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching venues:', error);
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
    bakery: 'Padaria',
    meal_takeaway: 'Para Levar',
    meal_delivery: 'Delivery',
    gym: 'Academia',
    spa: 'Spa',
    park: 'Parque',
    store: 'Loja',
    clothing_store: 'Loja de Roupas',
    shopping_mall: 'Shopping',
    movie_theater: 'Cinema',
    museum: 'Museu',
    art_gallery: 'Galeria de Arte',
    point_of_interest: 'Local',
    establishment: 'Local',
    food: 'Comida',
    grocery_or_supermarket: 'Mercado',
  };

  if (translations[type]) {
    return translations[type];
  }

  // Fallback: capitalize snake_case -> Title Case
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
