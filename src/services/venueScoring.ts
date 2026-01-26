/**
 * Venue Dating Score Service
 * Calculates how suitable a venue is for dating based on multiple factors
 */

import { VENUE_TYPE_SCORES } from './places';

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
 * Get emoji for dating score tier
 */
export function getDatingScoreEmoji(score: number): string {
  if (score >= 200) return '🔥';
  if (score >= 150) return '✨';
  if (score >= 100) return '👍';
  if (score >= 50) return '😊';
  return '🤷';
}
