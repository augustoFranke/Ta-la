/**
 * Verified Venues Configuration
 * 
 * These are manually curated venues known to be nightlife/bar establishments
 * in Dourados, MS. They receive automatic high nightlife scores.
 * 
 * To add more venues:
 * 1. Add the venue name pattern (case-insensitive regex or exact match)
 * 2. Optionally add the Google Place ID if known
 */

export interface VerifiedVenue {
  // Name pattern to match (case-insensitive)
  namePattern: string | RegExp;
  // Google Place ID (optional - for exact matching)
  placeId?: string;
  // Nightlife score override (default: 100)
  score?: number;
  // Notes about the venue
  notes?: string;
}

/**
 * List of verified nightlife venues in Dourados, MS
 * These venues are known to be bars, clubs, or nightlife establishments
 * and will receive the highest nightlife scores automatically.
 */
export const VERIFIED_VENUES: VerifiedVenue[] = [
  // Top-tier bars and botequins
  {
    namePattern: /bar[aã]o\s*(botequim)?/i,
    notes: 'Barão Botequim - Popular bar in Dourados',
    score: 100,
  },
  {
    namePattern: /bar\s*mattos/i,
    notes: 'Bar Mattos - Traditional bar',
    score: 100,
  },
  {
    namePattern: /bar\s*do\s*lau/i,
    notes: 'Bar do Lau - Local favorite',
    score: 100,
  },
  {
    namePattern: /vibes\s*(bar)?/i,
    notes: 'Vibes Bar - Popular nightlife spot',
    score: 100,
  },
  {
    namePattern: /dona\s*olinda/i,
    notes: 'Dona Olinda Botequim - Trendy botequim',
    score: 100,
  },
  {
    namePattern: /eden\s*beer/i,
    notes: 'Eden Beer - Beer-focused bar',
    score: 100,
  },
  {
    namePattern: /boutique'?i?n\s*chopp/i,
    notes: "Boutique'in Chopp Dourados - Chopp bar",
    score: 95,
  },
  
  // Conveniências that operate as bars at night
  {
    namePattern: /big\s*conveni[eê]ncia/i,
    notes: 'Big Conveniência - Conveniência with bar atmosphere',
    score: 85,
  },
  {
    namePattern: /two\.?\s*conveni[eê]ncia/i,
    notes: 'Two.Conveniência - Conveniência with nightlife crowd',
    score: 85,
  },
];

/**
 * Check if a venue name matches any verified venue
 * Returns the verified venue config if matched, null otherwise
 */
export function findVerifiedVenue(name: string): VerifiedVenue | null {
  const normalizedName = name.trim();
  
  for (const venue of VERIFIED_VENUES) {
    if (venue.namePattern instanceof RegExp) {
      if (venue.namePattern.test(normalizedName)) {
        return venue;
      }
    } else {
      // Exact string match (case-insensitive)
      if (normalizedName.toLowerCase() === venue.namePattern.toLowerCase()) {
        return venue;
      }
    }
  }
  
  return null;
}

/**
 * Check if a venue is verified by place ID
 */
export function findVerifiedVenueByPlaceId(placeId: string): VerifiedVenue | null {
  return VERIFIED_VENUES.find(v => v.placeId === placeId) || null;
}

/**
 * Get the verified venue score, or null if not verified
 */
export function getVerifiedVenueScore(name: string, placeId?: string): number | null {
  // First check by place ID (more accurate)
  if (placeId) {
    const byPlaceId = findVerifiedVenueByPlaceId(placeId);
    if (byPlaceId) {
      return byPlaceId.score ?? 100;
    }
  }
  
  // Then check by name pattern
  const byName = findVerifiedVenue(name);
  if (byName) {
    return byName.score ?? 100;
  }
  
  return null;
}

/**
 * Check if a venue is in the verified list
 */
export function isVerifiedVenue(name: string, placeId?: string): boolean {
  return getVerifiedVenueScore(name, placeId) !== null;
}
