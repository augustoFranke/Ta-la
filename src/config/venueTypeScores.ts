/**
 * Venue Type Scores
 * Shared scoring constants for nightlife and dating relevance
 * Extracted to avoid circular dependencies between places.ts and venueScoring.ts
 */

// Dating-friendly scoring by venue type (higher = better for dating)
export const VENUE_TYPE_SCORES: Record<string, number> = {
  // Top tier - Intimate, sophisticated
  cocktail_bar: 100,
  wine_bar: 100,
  speakeasy: 100,
  rooftop_bar: 95,
  lounge: 90,
  // High tier - Upscale dining
  bistro: 80,
  gastropub: 75,
  jazz_club: 75,
  // Mid tier - Good atmosphere
  bar: 60,
  night_club: 60,
  dance_club: 60,
  beer_garden: 55,
  hookah_bar: 50,
  // Lower tier - More casual
  restaurant: 40,
  pub: 30,
  brewery: 30,
  tavern: 30,
  dive_bar: 25,
  // Entertainment - Context dependent
  karaoke: 45,
  comedy_club: 50,
  music_venue: 45,
  concert_hall: 40,
  nightlife: 50,
};

/**
 * Get the dating-friendliness score for a venue based on its types
 */
export function getVenueTypeScore(types: string[]): number {
  const scores = types.map((type) => VENUE_TYPE_SCORES[type] ?? 20);
  return Math.max(...scores, 0);
}
