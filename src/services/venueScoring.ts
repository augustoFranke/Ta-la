/**
 * Venue Dating Score Service
 * Calculates how suitable a venue is for dating based on multiple factors
 * Also provides nightlife scoring for venue filtering
 */

import { VENUE_TYPE_SCORES } from '../config/venueTypeScores';
import type { VenueMetadata } from '../types/database';
import { getVerifiedVenueScore } from '../config/verifiedVenues';

export interface VenueScoreInput {
  types: string[];
  name: string;
  rating: number | null;
  priceLevel: number | null;
  distance: number; // in kilometers
  openToMeetingCount: number;
  positiveVibeCount: number;
}

export interface VenueDatingData {
  datingScore: number;
  openToMeetingCount: number;
  topVibes: string[];
}

// ============================================================================
// Nightlife Score Calculation
// ============================================================================

export interface NightlifeScoreInput {
  types: string[];
  name?: string; // Optional venue name for verified venue check
  metadata: VenueMetadata | null;
}

/**
 * Calculate nightlife fitness score for a venue
 * Used for filtering venues that don't fit the nightlife/dating app context
 *
 * Score breakdown:
 * - Type score: 0-25 (based on venue type)
 * - Operating hours: 0-30 (closes late on weekends)
 * - Review keywords: 0-15 (nightlife keywords in reviews)
 * - Community verification: 0-20 (admin-verified nightlife)
 * - Flag penalty: 0 to -10 (user reports)
 *
 * Total range: 0-100
 */
export function calculateNightlifeScore(input: NightlifeScoreInput): number {
  const { types, name, metadata } = input;

  // If blocked, always return 0
  if (metadata?.is_blocked) return 0;

  // Check if this is a verified venue from our curated list
  // This provides immediate high score even before metadata is fetched
  if (name) {
    const verifiedScore = getVerifiedVenueScore(name);
    if (verifiedScore !== null) {
      // Apply flag penalty if users have reported issues
      const flagPenalty = metadata ? Math.min(10, metadata.user_flag_count * 2) : 0;
      return Math.max(0, verifiedScore - flagPenalty);
    }
  }

  // If metadata has the nightlife_score already calculated, use it
  // (This is the score calculated by venueDetails.ts which includes all signals)
  if (metadata?.nightlife_score !== undefined && metadata.nightlife_score > 0) {
    return metadata.nightlife_score;
  }

  let score = 0;

  // Type contribution (0-25)
  const typeScores = types.map((t) => VENUE_TYPE_SCORES[t] ?? 20);
  const maxTypeScore = Math.max(...typeScores, 0);
  score += Math.round(maxTypeScore * 0.25);

  // If we have metadata, use detailed signals
  if (metadata) {
    // Operating hours contribution (0-30)
    if (metadata.closes_late_weekend) {
      score += 30;
    } else if (metadata.opens_evening) {
      score += 15;
    }

    // Review keywords contribution (0-15)
    const netKeywords =
      metadata.review_keywords_positive - metadata.review_keywords_negative;
    score += Math.min(15, Math.max(0, netKeywords * 3));

    // Community verification contribution (0-20)
    if (metadata.is_verified_nightlife === true) {
      score += 20;
    }

    // Flag penalty (0 to -10)
    score -= Math.min(10, metadata.user_flag_count * 2);
  } else {
    // No metadata yet - give benefit of doubt with type-only scoring
    // Add a small buffer so venues aren't filtered before we fetch details
    score += 20;
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get a human-readable label for the nightlife score
 */
export function getNightlifeScoreLabel(score: number): string {
  if (score >= 80) return 'Vida noturna';
  if (score >= 60) return 'Bar/Balada';
  if (score >= 40) return 'Noite casual';
  if (score >= 20) return 'Pode funcionar';
  return 'Provavelmente nao e balada';
}

/**
 * Calculate a dating-friendliness score for a venue
 * Higher scores indicate better venues for meeting people
 *
 * Score breakdown:
 * - Type score: 0-100 (based on venue type)
 * - Activity bonus: 0-100 (people open to meeting)
 * - Vibe bonus: 0-50 (positive user tags)
 * - Rating bonus: 0-20 (Google rating)
 * - Distance penalty: -30 to 0
 *
 * Total range: ~-30 to ~270
 */
export function calculateDatingScore(input: VenueScoreInput): number {
  // Type score (0-100): Based on how dating-friendly the venue type is
  const typeScores = input.types.map((t) => VENUE_TYPE_SCORES[t] ?? 20);
  const typeScore = Math.max(...typeScores, 0);

  // Activity bonus (0-100): People currently checked in and open to meeting
  // Each person adds 20 points, capped at 100
  const activityScore = Math.min(100, input.openToMeetingCount * 20);

  // Vibe bonus (0-50): Positive dating-related tags from users
  // Each vibe adds 10 points, capped at 50
  const vibeScore = Math.min(50, input.positiveVibeCount * 10);

  // Rating bonus (0-20): Higher rated venues are generally better
  // Only applies if venue has a rating
  const ratingScore = input.rating ? Math.round((input.rating / 5) * 20) : 10;

  // Distance penalty (-30 to 0): Closer venues are preferred
  // Penalty increases with distance (3 points per km, max 30)
  const distancePenalty = -Math.min(30, Math.round(input.distance * 3));

  const totalScore = typeScore + activityScore + vibeScore + ratingScore + distancePenalty;

  return totalScore;
}

/**
 * Sort venues by dating score (highest first)
 */
export function sortByDatingScore<T extends { datingScore?: number }>(venues: T[]): T[] {
  return [...venues].sort((a, b) => (b.datingScore ?? 0) - (a.datingScore ?? 0));
}

/**
 * Get a human-readable label for the dating score
 */
export function getDatingScoreLabel(score: number): string {
  if (score >= 200) return 'Excelente para conhecer pessoas';
  if (score >= 150) return 'Otimo para encontros';
  if (score >= 100) return 'Bom para socializar';
  if (score >= 50) return 'Ambiente casual';
  return 'Pode funcionar';
}

/**
 * Get icon name for dating score tier
 */
export function getDatingScoreIconName(score: number): string {
  if (score >= 200) return 'flame';
  if (score >= 150) return 'sparkles';
  if (score >= 100) return 'thumbs-up';
  if (score >= 50) return 'happy';
  return 'help-circle';
}
