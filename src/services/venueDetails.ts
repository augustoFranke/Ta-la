/**
 * Venue Details Service
 * Fetches Google Places Details API and caches in Supabase
 * Analyzes operating hours and reviews for nightlife scoring
 */

import { supabase } from './supabase';
import type {
  VenueMetadata,
  GooglePlaceDetailsResponse,
  GooglePlaceOpeningPeriod,
  GooglePlaceReview,
} from '../types/database';
import { getVerifiedVenueScore, isVerifiedVenue } from '../config/verifiedVenues';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
const PLACES_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

// Cache TTL: 7 days in milliseconds
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Nightlife score threshold for filtering
export const NIGHTLIFE_SCORE_THRESHOLD = 40;

// Keywords for review analysis
const NIGHTLIFE_POSITIVE_KEYWORDS = [
  // Portuguese
  'balada',
  'drinks',
  'musica',
  'música',
  'dj',
  'dança',
  'danca',
  'noite',
  'happy hour',
  'cerveja',
  'cocktail',
  'coquetel',
  'boate',
  'pista',
  'festa',
  'chopinho',
  'chopp',
  'bar',
  'pub',
  'danceteria',
  'pagode',
  'sertanejo',
  'funk',
  'eletronico',
  'eletrônico',
  // English (tourists/reviews)
  'nightlife',
  'clubbing',
  'party',
  'dancing',
  'live music',
  'nightclub',
];

const NIGHTLIFE_NEGATIVE_KEYWORDS = [
  // Portuguese
  'familia',
  'família',
  'criancas',
  'crianças',
  'almoco',
  'almoço',
  'cafe da manha',
  'café da manhã',
  'trabalho',
  'reuniao',
  'reunião',
  'infantil',
  'kids',
  'brinquedo',
  'playground',
  'almoco executivo',
  'almoço executivo',
  'self-service',
  'buffet',
  'por quilo',
  // English
  'family',
  'children',
  'kids friendly',
  'business lunch',
  'breakfast',
];

/**
 * Fetch venue details from Google Places Details API
 */
async function fetchGooglePlaceDetails(
  placeId: string
): Promise<GooglePlaceDetailsResponse | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.error('Google Places API key not configured');
    return null;
  }

  const fields = [
    'place_id',
    'name',
    'formatted_address',
    'types',
    'opening_hours',
    'reviews',
    'rating',
    'user_ratings_total',
    'price_level',
  ].join(',');

  const url = `${PLACES_DETAILS_URL}?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${GOOGLE_PLACES_API_KEY}&language=pt-BR`;

  try {
    const response = await fetch(url);
    const data: GooglePlaceDetailsResponse = await response.json();

    if (data.status !== 'OK') {
      console.error(`Places Details API error for ${placeId}:`, data.status, data.error_message);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error fetching place details for ${placeId}:`, error);
    return null;
  }
}

/**
 * Analyze opening hours to determine if venue is nightlife-oriented
 * Returns true if venue closes late (>= 23:00) on Friday or Saturday
 */
export function analyzeOperatingHours(periods: GooglePlaceOpeningPeriod[] | undefined): {
  closesLateWeekend: boolean;
  opensEvening: boolean;
} {
  if (!periods || periods.length === 0) {
    return { closesLateWeekend: false, opensEvening: false };
  }

  let closesLateWeekend = false;
  let opensEvening = false;

  for (const period of periods) {
    const openDay = period.open.day;
    const openTime = parseInt(period.open.time || '0000', 10);
    const openHour = Math.floor(openTime / 100);

    // Check if opens in evening (after 18:00)
    if (openHour >= 18) {
      opensEvening = true;
    }

    // Check weekend closing times (Friday = 5, Saturday = 6)
    if (openDay === 5 || openDay === 6) {
      if (period.close) {
        const closeTime = parseInt(period.close.time || '0000', 10);
        const closeHour = Math.floor(closeTime / 100);
        const closeDay = period.close.day;

        // Closes late same day (>= 23:00) or closes next day (early morning)
        if (closeHour >= 23 || closeDay !== openDay) {
          closesLateWeekend = true;
        }
      } else {
        // No close time = open 24 hours, counts as late
        closesLateWeekend = true;
      }
    }
  }

  return { closesLateWeekend, opensEvening };
}

/**
 * Analyze reviews for nightlife-related keywords
 * Returns count of positive and negative keyword matches
 */
export function analyzeReviewKeywords(reviews: GooglePlaceReview[] | undefined): {
  positive: number;
  negative: number;
} {
  if (!reviews || reviews.length === 0) {
    return { positive: 0, negative: 0 };
  }

  let positive = 0;
  let negative = 0;

  for (const review of reviews) {
    const text = review.text.toLowerCase();

    for (const keyword of NIGHTLIFE_POSITIVE_KEYWORDS) {
      if (text.includes(keyword.toLowerCase())) {
        positive++;
        break; // Count once per review
      }
    }

    for (const keyword of NIGHTLIFE_NEGATIVE_KEYWORDS) {
      if (text.includes(keyword.toLowerCase())) {
        negative++;
        break; // Count once per review
      }
    }
  }

  return { positive, negative };
}

/**
 * Check if cached metadata is still valid (within TTL)
 */
function isCacheValid(lastFetch: string | null): boolean {
  if (!lastFetch) return false;

  const fetchTime = new Date(lastFetch).getTime();
  const now = Date.now();

  return now - fetchTime < CACHE_TTL_MS;
}

async function hasSupabaseSession(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return false;
    return Boolean(data.session?.user?.id);
  } catch {
    return false;
  }
}

/**
 * Get venue metadata from cache or fetch from Google Places Details API
 * Returns null if venue should be filtered out (blocked or fetch failed)
 */
export async function getOrFetchVenueMetadata(
  placeId: string,
  types: string[] = [],
  venueName: string = ''
): Promise<VenueMetadata | null> {
  // Check cache first
  const { data: cached, error: cacheError } = await supabase
    .from('venue_metadata')
    .select('*')
    .eq('place_id', placeId)
    .single();

  if (cached && !cacheError) {
    // Return cached if blocked
    if (cached.is_blocked) {
      return cached as VenueMetadata;
    }

    // Return cached if still valid
    if (isCacheValid(cached.last_details_fetch)) {
      return cached as VenueMetadata;
    }
  }

  // Fetch fresh details from Google
  const details = await fetchGooglePlaceDetails(placeId);

  if (!details || !details.result) {
    // If fetch failed but we have stale cache, use it
    if (cached) {
      return cached as VenueMetadata;
    }

    // No cache, no details - create minimal metadata
    return createMinimalMetadata(placeId, types, venueName);
  }

  // Analyze the details
  const { closesLateWeekend, opensEvening } = analyzeOperatingHours(
    details.result.opening_hours?.periods
  );
  const { positive, negative } = analyzeReviewKeywords(details.result.reviews);

  // Calculate nightlife score
  const nightlifeScore = calculateNightlifeScoreFromDetails({
    types: details.result.types || types,
    venueName: details.result.name,
    placeId,
    closesLateWeekend,
    opensEvening,
    reviewPositive: positive,
    reviewNegative: negative,
    isVerified: cached?.is_verified_nightlife ?? null,
    isBlocked: cached?.is_blocked ?? false,
    flagCount: cached?.user_flag_count ?? 0,
  });

  // Check if this is a verified venue and update the flag
  const isVerifiedFromConfig = isVerifiedVenue(details.result.name, placeId);

  // Upsert metadata
  const metadata: Partial<VenueMetadata> = {
    place_id: placeId,
    opening_hours: details.result.opening_hours || null,
    closes_late_weekend: closesLateWeekend,
    opens_evening: opensEvening,
    review_keywords_positive: positive,
    review_keywords_negative: negative,
    is_verified_nightlife: isVerifiedFromConfig || cached?.is_verified_nightlife || null,
    is_blocked: cached?.is_blocked ?? false,
    user_flag_count: cached?.user_flag_count ?? 0,
    nightlife_score: nightlifeScore,
    last_details_fetch: new Date().toISOString(),
  };

  const fallbackMetadata = {
    id: cached?.id || '',
    ...metadata,
    created_at: cached?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as VenueMetadata;

  const canWrite = await hasSupabaseSession();
  if (!canWrite) {
    return fallbackMetadata;
  }

  const { data: upserted, error: upsertError } = await supabase
    .from('venue_metadata')
    .upsert(metadata, { onConflict: 'place_id' })
    .select()
    .single();

  if (upsertError) {
    console.error('Error upserting venue metadata:', upsertError);
    // Return what we calculated even if save failed
    return fallbackMetadata;
  }

  return upserted as VenueMetadata;
}

/**
 * Create minimal metadata for venues where we can't fetch details
 * Uses type-based scoring only
 */
async function createMinimalMetadata(
  placeId: string,
  types: string[],
  venueName: string = ''
): Promise<VenueMetadata> {
  const nightlifeScore = calculateNightlifeScoreFromDetails({
    types,
    venueName,
    placeId,
    closesLateWeekend: false,
    opensEvening: false,
    reviewPositive: 0,
    reviewNegative: 0,
    isVerified: null,
    isBlocked: false,
    flagCount: 0,
  });

  // Check if this is a verified venue from our curated list
  const isVerifiedFromConfig = venueName ? isVerifiedVenue(venueName, placeId) : false;

  const metadata: Partial<VenueMetadata> = {
    place_id: placeId,
    opening_hours: null,
    closes_late_weekend: false,
    opens_evening: false,
    review_keywords_positive: 0,
    review_keywords_negative: 0,
    is_verified_nightlife: isVerifiedFromConfig || null,
    is_blocked: false,
    user_flag_count: 0,
    nightlife_score: nightlifeScore,
    last_details_fetch: null, // Mark as not fetched
  };

  const fallbackMetadata = {
    id: '',
    ...metadata,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as VenueMetadata;

  const canWrite = await hasSupabaseSession();
  if (!canWrite) {
    return fallbackMetadata;
  }

  const { data: upserted, error } = await supabase
    .from('venue_metadata')
    .upsert(metadata, { onConflict: 'place_id' })
    .select()
    .single();

  if (error || !upserted) {
    return fallbackMetadata;
  }

  return upserted as VenueMetadata;
}

/**
 * Calculate nightlife score from analyzed details
 * Score range: 0-100
 */
interface NightlifeScoreInput {
  types: string[];
  venueName: string;
  placeId: string;
  closesLateWeekend: boolean;
  opensEvening: boolean;
  reviewPositive: number;
  reviewNegative: number;
  isVerified: boolean | null;
  isBlocked: boolean;
  flagCount: number;
}

// Type scores for nightlife relevance (imported from places.ts would create circular dep)
const NIGHTLIFE_TYPE_SCORES: Record<string, number> = {
  night_club: 100,
  dance_club: 100,
  cocktail_bar: 95,
  wine_bar: 90,
  lounge: 90,
  rooftop_bar: 85,
  bar: 70,
  pub: 60,
  gastropub: 55,
  beer_garden: 50,
  hookah_bar: 50,
  jazz_club: 50,
  karaoke: 45,
  restaurant: 30,
  cafe: 20,
};

function getTypeScore(types: string[]): number {
  if (!types || types.length === 0) return 20;
  const scores = types.map((t) => NIGHTLIFE_TYPE_SCORES[t] ?? 20);
  return Math.max(...scores);
}

function calculateNightlifeScoreFromDetails(input: NightlifeScoreInput): number {
  // Blocked venues get 0
  if (input.isBlocked) return 0;

  // Check if this is a verified venue from our curated list
  const verifiedScore = getVerifiedVenueScore(input.venueName, input.placeId);
  if (verifiedScore !== null) {
    // Verified venues get their configured score directly
    // Still apply flag penalty if users have reported issues
    const flagPenalty = Math.min(10, input.flagCount * 2);
    return Math.max(0, verifiedScore - flagPenalty);
  }

  let score = 0;

  // Type contribution (0-25)
  const typeScore = getTypeScore(input.types);
  score += Math.round(typeScore * 0.25);

  // Operating hours contribution (0-30)
  if (input.closesLateWeekend) {
    score += 30;
  } else if (input.opensEvening) {
    score += 15;
  }

  // Review keywords contribution (0-15)
  const netKeywords = input.reviewPositive - input.reviewNegative;
  score += Math.min(15, Math.max(0, netKeywords * 3));

  // Community verification contribution (0-20)
  if (input.isVerified === true) {
    score += 20;
  }
  // Note: isVerified === false could penalize, but null is neutral

  // Flag penalty (0 to -10)
  score -= Math.min(10, input.flagCount * 2);

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Batch fetch metadata for multiple venues
 * Optimized for venue list loading - fetches from cache first, then fills gaps
 */
export async function batchGetVenueMetadata(
  venues: { place_id: string; name: string; types?: string[] }[]
): Promise<Map<string, VenueMetadata>> {
  if (venues.length === 0) {
    return new Map();
  }

  const placeIds = venues.map(v => v.place_id);
  const venueMap = new Map(venues.map(v => [v.place_id, v]));
  const result = new Map<string, VenueMetadata>();

  // Fetch all cached metadata in one query
  const { data: cached, error } = await supabase
    .from('venue_metadata')
    .select('*')
    .in('place_id', placeIds);

  if (error) {
    console.error('Error batch fetching venue metadata:', error);
  }

  // Separate valid cache from stale/missing
  const staleOrMissing: string[] = [];
  const cachedMap = new Map<string, VenueMetadata>();

  if (cached) {
    for (const meta of cached) {
      cachedMap.set(meta.place_id, meta as VenueMetadata);

      if (meta.is_blocked || isCacheValid(meta.last_details_fetch)) {
        result.set(meta.place_id, meta as VenueMetadata);
      } else {
        staleOrMissing.push(meta.place_id);
      }
    }
  }

  // Find completely missing
  for (const placeId of placeIds) {
    if (!cachedMap.has(placeId)) {
      staleOrMissing.push(placeId);
    }
  }

  // Fetch stale/missing in parallel (with rate limiting)
  // Limit concurrent requests to avoid API rate limits
  const BATCH_SIZE = 5;
  for (let i = 0; i < staleOrMissing.length; i += BATCH_SIZE) {
    const batch = staleOrMissing.slice(i, i + BATCH_SIZE);
    const promises = batch.map((placeId) => {
      const venueInfo = venueMap.get(placeId);
      return getOrFetchVenueMetadata(
        placeId,
        venueInfo?.types || [],
        venueInfo?.name || ''
      ).then((meta) => {
        if (meta) {
          result.set(placeId, meta);
        }
      });
    });

    await Promise.all(promises);

    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < staleOrMissing.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return result;
}

/**
 * Check if a venue passes the nightlife filter
 */
export function passesNightlifeFilter(metadata: VenueMetadata | null): boolean {
  if (!metadata) return true; // Allow if no metadata (will be fetched later)
  if (metadata.is_blocked) return false;
  return metadata.nightlife_score >= NIGHTLIFE_SCORE_THRESHOLD;
}
