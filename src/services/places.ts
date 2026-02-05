/**
 * Google Places API Service
 * Fetches nearby nightlife venues (bars, clubs, lounges)
 * Integrates with venue metadata for multi-signal filtering
 */

import type { GooglePlacesResponse, GooglePlaceResult, VenueType, Venue, VenueMetadata } from '../types/database';
import { batchGetVenueMetadata, passesNightlifeFilter, NIGHTLIFE_SCORE_THRESHOLD } from './venueDetails';
import { calculateNightlifeScore } from './venueScoring';
import { isVerifiedVenue } from '../config/verifiedVenues';
import { VENUE_TYPE_SCORES, getVenueTypeScore } from '../config/venueTypeScores';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
const PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// Venue types to search for via Google Places API
const SEARCH_TYPES = ['bar', 'night_club', 'restaurant'];

// Default search radius in meters (50km to cover entire city of Dourados)
const DEFAULT_RADIUS = 50000;

// Verified venue names to search for directly (ensures they always appear)
// These are the top nightlife spots that should always be shown
const VERIFIED_VENUE_SEARCH_TERMS = [
  'Barão Botequim Dourados',
  'Bar Mattos Dourados',
  'Bar do Lau Dourados',
  'Vibes Bar Dourados',
  'Dona Olinda Botequim Dourados',
  'Eden Beer Dourados',
  'Boutique in Chopp Dourados',
  'Big Conveniência Dourados',
  'Two Conveniência Dourados',
];

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

// Re-export for backward compatibility
export { VENUE_TYPE_SCORES, getVenueTypeScore } from '../config/venueTypeScores';

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
 * Verified venues from our curated list always pass
 * Returns false if venue is blacklisted, true if it has any positive score
 */
function isAllowedVenue(types: string[], name: string): boolean {
  // ALWAYS allow verified venues from our curated list
  if (isVerifiedVenue(name)) {
    return true;
  }

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
 * Search for a specific venue using Text Search API
 * Used to find verified venues that might not appear in Nearby Search
 */
async function searchVerifiedVenue(
  searchTerm: string,
  userLat: number,
  userLng: number,
  openNowOnly: boolean
): Promise<(Venue & { distance: number }) | null> {
  try {
    const openNowParam = openNowOnly ? '&opennow=true' : '';
    const url = `${PLACES_BASE_URL}/textsearch/json?query=${encodeURIComponent(searchTerm)}${openNowParam}&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const place = data.results[0];
      
      const photoUrls = place.photos?.length
        ? place.photos.map((photo: any) => getPhotoUrl(photo.photo_reference))
        : [];
      const photoUrl = photoUrls[0] || null;
      
      const distance = calculateDistance(
        userLat,
        userLng,
        place.geometry.location.lat,
        place.geometry.location.lng
      );

      return {
        id: place.place_id,
        place_id: place.place_id,
        name: place.name,
        address: place.formatted_address || place.vicinity || '',
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        type: determineVenueType(place.types || []),
        types: place.types || [],
        photo_url: photoUrl,
        photo_urls: photoUrls,
        rating: place.rating || null,
        price_level: place.price_level || null,
        open_now: place.opening_hours?.open_now ?? null,
        active_users_count: 0,
        cached_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        distance,
      };
    }

    return null;
  } catch (err) {
    console.error(`Error searching for verified venue "${searchTerm}":`, err);
    return null;
  }
}

/**
 * Fetch all verified venues using Text Search API
 * These are guaranteed to appear in the results
 */
async function fetchVerifiedVenues(
  userLat: number,
  userLng: number,
  openNowOnly: boolean
): Promise<(Venue & { distance: number })[]> {
  // Search for all verified venues in parallel
  const searchPromises = VERIFIED_VENUE_SEARCH_TERMS.map((term) =>
    searchVerifiedVenue(term, userLat, userLng, openNowOnly)
  );

  const results = await Promise.all(searchPromises);
  
  // Filter out nulls (failed searches)
  return results.filter((venue): venue is Venue & { distance: number } => venue !== null);
}

/**
 * Search for nearby nightlife venues with multi-signal filtering
 * 
 * Pipeline:
 * 1. Fetch verified venues using Text Search (guaranteed to appear)
 * 2. Fetch from Google Places Nearby Search (bar, night_club, restaurant)
 * 3. Merge and deduplicate results
 * 4. Apply quick blacklist filter (verified venues bypass blacklist)
 * 5. Fetch/check venue metadata from cache
 * 6. Calculate nightlife score for each venue
 * 7. Filter out venues with nightlife_score < threshold
 * 8. Sort by nightlife score (primary), distance (secondary)
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
  if (!GOOGLE_PLACES_API_KEY) {
    return {
      venues: [],
      error: 'Google Places API key não configurada',
    };
  }

  try {
    const allVenues: (Venue & { distance: number })[] = [];

    // Step 1: Fetch verified venues first (they always appear at top)
    // Default to true - always include verified venues
    if (options.includeVerifiedVenues !== false) {
      const verifiedVenues = await fetchVerifiedVenues(latitude, longitude, Boolean(options.openNowOnly));
      allVenues.push(...verifiedVenues);
    }

    // Step 2: Search for each venue type in parallel from Google Places
    // Note: No opennow filter - we show all venues sorted by nightlife score
    const openNowParam = options.openNowOnly ? '&opennow=true' : '';

    const searchPromises = SEARCH_TYPES.map(async (type) => {
      const url = `${PLACES_BASE_URL}/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}${openNowParam}&key=${GOOGLE_PLACES_API_KEY}`;
      
      try {
        const response = await fetch(url);
        const data: GooglePlacesResponse = await response.json();

        if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
           return data.results
            .map((place) => transformToVenue(place, latitude, longitude))
            .filter((venue): venue is Venue & { distance: number } => venue !== null);
        }
        return [];
      } catch (err) {
        console.error(`Error fetching type ${type}:`, err);
        return [];
      }
    });

    const results = await Promise.all(searchPromises);
    results.forEach(venues => allVenues.push(...venues));

    // Step 3: Remove duplicates (same place might appear in multiple searches)
    // Verified venues take priority (they're added first)
    const uniqueVenues = allVenues.reduce((acc, venue) => {
      if (!acc.find((v) => v.place_id === venue.place_id)) {
        acc.push(venue);
      }
      return acc;
    }, [] as (Venue & { distance: number })[]);

    // Filter only open venues if required (hide open_now = null or false)
    const filteredVenues = options.openNowOnly
      ? uniqueVenues.filter((venue) => venue.open_now === true)
      : uniqueVenues;

    // If skipping nightlife filter, just sort by distance and return
    if (options.skipNightlifeFilter) {
      filteredVenues.sort((a, b) => a.distance - b.distance);
      return {
        venues: filteredVenues,
        error: null,
      };
    }

    // Step 3: Batch fetch venue metadata for nightlife scoring
    const venueInfoForMetadata = filteredVenues.map((v) => ({
      place_id: v.place_id,
      name: v.name,
      types: v.types || [v.type],
    }));
    const metadataMap = await batchGetVenueMetadata(venueInfoForMetadata);

    // Step 4: Calculate nightlife scores and filter
    const venuesWithScores: (Venue & { distance: number; nightlife_score: number; metadata?: VenueMetadata })[] = [];

    for (const venue of filteredVenues) {
      const metadata = metadataMap.get(venue.place_id) ?? undefined;
      
      // Calculate nightlife score
      const nightlifeScore = calculateNightlifeScore({
        types: venue.types || [venue.type],
        name: venue.name,
        metadata: metadata ?? null,
      });

      // Step 5: Filter by nightlife score threshold
      if (nightlifeScore >= NIGHTLIFE_SCORE_THRESHOLD || passesNightlifeFilter(metadata ?? null)) {
        venuesWithScores.push({
          ...venue,
          nightlife_score: nightlifeScore,
          metadata,
        });
      }
    }

    // Step 6: Sort by nightlife score (primary), then by distance (secondary)
    // Sort by distance (closest first) for the main list
    venuesWithScores.sort((a, b) => a.distance - b.distance);

    return {
      venues: venuesWithScores,
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
    convenience_store: 'Conveniência',
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
