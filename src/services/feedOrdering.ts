/**
 * Feed ordering algorithm for Spec 006.
 *
 * Pipeline:
 * 1. Hard filters — exclude candidates that fail mandatory criteria.
 * 2. Soft scoring — rank remaining candidates by compatibility score.
 * 3. Seeded shuffle — break ties deterministically per session.
 *
 * Policy reference: docs/POLICY_DECISIONS.md §9 (age range), §4 (sex/preference fields).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Sex = 'masculino' | 'feminino' | 'outro';
/** Matches the `gender_preference` column in the `users` table. */
export type PartnerPreference = 'masculino' | 'feminino' | 'todos';

export interface FeedProfile {
  id: string;
  name: string;
  bio: string | null;
  age: number;
  sex: Sex;
  partner_preference: PartnerPreference;
  checked_in_at: string; // ISO-8601
}

export interface ViewerProfile {
  id: string;
  bio: string | null;
  age: number;
  sex: Sex;
  partner_preference: PartnerPreference;
  /** Optional: user-customized age range. Defaults to [age-10, age+10] clamped to 18. */
  min_age_preference?: number;
  max_age_preference?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_AGE_DELTA = 10;
const MINIMUM_AGE = 18;

// Words to exclude from bio similarity scoring (Portuguese stopwords)
const STOPWORDS = new Set([
  'a', 'o', 'e', 'de', 'do', 'da', 'em', 'no', 'na', 'os', 'as', 'um',
  'uma', 'por', 'com', 'se', 'que', 'ao', 'aos', 'das', 'dos', 'para',
  'mas', 'ou', 'is', 'me', 'my', 'eu', 'tu', 'ele', 'ela', 'nos', 'eles',
  'nao', 'nao', 'sou', 'ser', 'ter', 'gosto', 'curto', 'gosto',
]);

// ---------------------------------------------------------------------------
// Hard filters
// ---------------------------------------------------------------------------

/**
 * Returns true when candidate passes all hard filters for this viewer.
 * A candidate that fails any hard filter is excluded from the feed entirely.
 */
export function hardFilter(viewer: ViewerProfile, candidate: FeedProfile): boolean {
  // --- Age hard filter ---
  const minAge = viewer.min_age_preference !== undefined
    ? Math.max(viewer.min_age_preference, MINIMUM_AGE)
    : Math.max(viewer.age - DEFAULT_AGE_DELTA, MINIMUM_AGE);

  const maxAge = viewer.max_age_preference !== undefined
    ? viewer.max_age_preference
    : viewer.age + DEFAULT_AGE_DELTA;

  if (candidate.age < minAge || candidate.age > maxAge) {
    return false;
  }

  // --- Sex / partner preference hard filter ---
  // Viewer must want someone of candidate's sex
  if (!viewerWantsCandidate(viewer.partner_preference, candidate.sex)) {
    return false;
  }

  return true;
}

/**
 * Returns true when the viewer's partner_preference is compatible with
 * the candidate's sex.
 *
 * Policy:
 *   - 'masculino' → candidate must be 'masculino'
 *   - 'feminino'  → candidate must be 'feminino'
 *   - 'todos'     → any sex accepted
 */
export function viewerWantsCandidate(
  viewerPreference: PartnerPreference,
  candidateSex: Sex,
): boolean {
  if (viewerPreference === 'todos') return true;
  if (viewerPreference === 'masculino') return candidateSex === 'masculino';
  if (viewerPreference === 'feminino') return candidateSex === 'feminino';
  return false;
}

// ---------------------------------------------------------------------------
// Soft scoring
// ---------------------------------------------------------------------------

/**
 * Extracts significant keywords from a bio string (non-stopword tokens ≥ 3 chars).
 */
export function extractKeywords(bio: string | null): Set<string> {
  if (!bio) return new Set();
  const words = bio
    .toLowerCase()
    .replace(/[^a-záàâãéêíóôõúüçñ\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  return new Set(words);
}

/**
 * Bio similarity score in [0, 1].
 *
 * Implementation: count shared keywords / max(|kw1|, |kw2|).
 * Both bios empty → 0 (no signal).
 */
export function bioSimilarity(bio1: string | null, bio2: string | null): number {
  const kw1 = extractKeywords(bio1);
  const kw2 = extractKeywords(bio2);

  const maxLen = Math.max(kw1.size, kw2.size);
  if (maxLen === 0) return 0;

  let shared = 0;
  kw1.forEach((word) => {
    if (kw2.has(word)) shared++;
  });

  return shared / maxLen;
}

/**
 * Recency score in [0, 1].
 * Checked in within the last 15 min → 1.0; drops linearly to 0 at 4 hours.
 */
export function recencyScore(checkedInAt: string, nowMs: number = Date.now()): number {
  const ageMs = nowMs - new Date(checkedInAt).getTime();
  const RECENT_MS = 15 * 60 * 1000;   // 15 min
  const MAX_MS = 4 * 60 * 60 * 1000;  // 4 hours

  if (ageMs <= RECENT_MS) return 1;
  if (ageMs >= MAX_MS) return 0;
  return 1 - (ageMs - RECENT_MS) / (MAX_MS - RECENT_MS);
}

/**
 * Composite compatibility score in [0, 1].
 * Weights: bio similarity 60%, recency 40%.
 */
export function computeCompatibilityScore(
  viewer: ViewerProfile,
  candidate: FeedProfile,
  nowMs: number = Date.now(),
): number {
  const bioScore = bioSimilarity(viewer.bio, candidate.bio);
  const recScore = recencyScore(candidate.checked_in_at, nowMs);
  return 0.6 * bioScore + 0.4 * recScore;
}

// ---------------------------------------------------------------------------
// Seeded deterministic shuffle (Mulberry32)
// ---------------------------------------------------------------------------

/**
 * Maps a seed string to a 32-bit unsigned integer using a simple hash.
 */
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

/**
 * Mulberry32 PRNG — returns a function that yields floats in [0, 1).
 * Same seed → same sequence.
 */
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

/**
 * Fisher-Yates shuffle seeded by `seed`.
 * Returns a NEW shuffled array; does not mutate the input.
 */
export function seededShuffle<T>(arr: T[], seed: string): T[] {
  const result = [...arr];
  const rand = mulberry32(hashSeed(seed));
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ---------------------------------------------------------------------------
// Main ordering function
// ---------------------------------------------------------------------------

/**
 * Orders the venue feed for `viewer` given `candidates`.
 *
 * Steps:
 * 1. Apply hard filters (age range, sex/preference).
 * 2. Score each candidate.
 * 3. Sort descending by score; shuffle within each score band using `seed`.
 *
 * @param viewer     - The current logged-in user.
 * @param candidates - All checked-in users at the venue (excluding viewer).
 * @param seed       - Session seed for stable tie-breaking (e.g., check-in ID).
 * @param nowMs      - Optional override for current time (for testing).
 */
export function orderFeed(
  viewer: ViewerProfile,
  candidates: FeedProfile[],
  seed: string,
  nowMs: number = Date.now(),
): FeedProfile[] {
  // Step 1: hard filter
  const eligible = candidates.filter((c) => hardFilter(viewer, c));

  // Step 2: score
  const scored = eligible.map((c) => ({
    candidate: c,
    score: computeCompatibilityScore(viewer, c, nowMs),
  }));

  // Step 3: seeded shuffle for tie-breaking, then sort descending by score
  const shuffled = seededShuffle(scored, seed);
  shuffled.sort((a, b) => b.score - a.score);

  return shuffled.map((s) => s.candidate);
}
