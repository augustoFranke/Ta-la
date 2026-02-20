/**
 * Unit tests for the feed ordering algorithm — Spec 006
 *
 * Covers:
 * - hardFilter: age range (±10yr default, ≥18 floor)
 * - hardFilter: sex/partner_preference matching
 * - viewerWantsCandidate: all three preference modes
 * - bioSimilarity: shared keywords / max-size ratio
 * - recencyScore: linear decay from 15min to 4h
 * - seededShuffle: determinism + returns all elements
 * - orderFeed: integration (filter → score → shuffle → sort)
 */

import {
  hardFilter,
  viewerWantsCandidate,
  bioSimilarity,
  recencyScore,
  seededShuffle,
  orderFeed,
  type FeedProfile,
  type ViewerProfile,
  type Sex,
  type PartnerPreference,
} from '../../src/services/feedOrdering';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeViewer(overrides: Partial<ViewerProfile> = {}): ViewerProfile {
  return {
    id: 'viewer-1',
    bio: 'Gosto de musica e viagem',
    age: 28,
    sex: 'masculino',
    partner_preference: 'feminino',
    ...overrides,
  };
}

function makeCandidate(overrides: Partial<FeedProfile> = {}): FeedProfile {
  return {
    id: 'candidate-1',
    name: 'Ana',
    bio: 'Curto musica e livros',
    age: 26,
    sex: 'feminino',
    partner_preference: 'todos',
    checked_in_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// hardFilter — age range
// ---------------------------------------------------------------------------

describe('hardFilter — age range', () => {
  test('candidate within default ±10yr range passes', () => {
    const viewer = makeViewer({ age: 30 });
    const candidate = makeCandidate({ age: 25 }); // 30-10 = 20 ≤ 25 ≤ 40
    expect(hardFilter(viewer, candidate)).toBe(true);
  });

  test('candidate exactly at min age passes', () => {
    const viewer = makeViewer({ age: 30 });
    const candidate = makeCandidate({ age: 20 }); // exactly 30-10
    expect(hardFilter(viewer, candidate)).toBe(true);
  });

  test('candidate exactly at max age passes', () => {
    const viewer = makeViewer({ age: 30 });
    const candidate = makeCandidate({ age: 40 }); // exactly 30+10
    expect(hardFilter(viewer, candidate)).toBe(true);
  });

  test('candidate too young is filtered out', () => {
    const viewer = makeViewer({ age: 30 });
    const candidate = makeCandidate({ age: 19 }); // 19 < 20
    expect(hardFilter(viewer, candidate)).toBe(false);
  });

  test('candidate too old is filtered out', () => {
    const viewer = makeViewer({ age: 30 });
    const candidate = makeCandidate({ age: 41 }); // 41 > 40
    expect(hardFilter(viewer, candidate)).toBe(false);
  });

  test('minimum age floor is 18 regardless of viewer age', () => {
    // viewer age 25, default min would be 15 → floored to 18
    const viewer = makeViewer({ age: 25 });
    const candidate17 = makeCandidate({ age: 17 });
    const candidate18 = makeCandidate({ age: 18 });
    expect(hardFilter(viewer, candidate17)).toBe(false);
    expect(hardFilter(viewer, candidate18)).toBe(true);
  });

  test('custom age range respected', () => {
    const viewer = makeViewer({ age: 30, min_age_preference: 22, max_age_preference: 35 });
    expect(hardFilter(viewer, makeCandidate({ age: 21 }))).toBe(false);
    expect(hardFilter(viewer, makeCandidate({ age: 22 }))).toBe(true);
    expect(hardFilter(viewer, makeCandidate({ age: 35 }))).toBe(true);
    expect(hardFilter(viewer, makeCandidate({ age: 36 }))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// hardFilter — sex / partner_preference
// ---------------------------------------------------------------------------

describe('hardFilter — sex/preference', () => {
  test('viewer preferring feminino only sees feminino candidates', () => {
    const viewer = makeViewer({ partner_preference: 'feminino' });
    expect(hardFilter(viewer, makeCandidate({ sex: 'feminino' }))).toBe(true);
    expect(hardFilter(viewer, makeCandidate({ sex: 'masculino' }))).toBe(false);
    expect(hardFilter(viewer, makeCandidate({ sex: 'outro' }))).toBe(false);
  });

  test('viewer preferring masculino only sees masculino candidates', () => {
    const viewer = makeViewer({ partner_preference: 'masculino' });
    expect(hardFilter(viewer, makeCandidate({ sex: 'masculino' }))).toBe(true);
    expect(hardFilter(viewer, makeCandidate({ sex: 'feminino' }))).toBe(false);
  });

  test('viewer with todos sees all sexes', () => {
    const viewer = makeViewer({ partner_preference: 'todos' });
    expect(hardFilter(viewer, makeCandidate({ sex: 'masculino' }))).toBe(true);
    expect(hardFilter(viewer, makeCandidate({ sex: 'feminino' }))).toBe(true);
    expect(hardFilter(viewer, makeCandidate({ sex: 'outro' }))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// viewerWantsCandidate
// ---------------------------------------------------------------------------

describe('viewerWantsCandidate', () => {
  const cases: [PartnerPreference, Sex, boolean][] = [
    ['todos', 'masculino', true],
    ['todos', 'feminino', true],
    ['todos', 'outro', true],
    ['masculino', 'masculino', true],
    ['masculino', 'feminino', false],
    ['masculino', 'outro', false],
    ['feminino', 'feminino', true],
    ['feminino', 'masculino', false],
    ['feminino', 'outro', false],
  ];

  test.each(cases)(
    'preference=%s sex=%s → %s',
    (pref, sex, expected) => {
      expect(viewerWantsCandidate(pref, sex)).toBe(expected);
    }
  );
});

// ---------------------------------------------------------------------------
// bioSimilarity
// ---------------------------------------------------------------------------

describe('bioSimilarity', () => {
  test('identical bios → 1.0', () => {
    const bio = 'Gosto musica viagem fotografia';
    expect(bioSimilarity(bio, bio)).toBe(1);
  });

  test('completely different bios → 0', () => {
    expect(bioSimilarity('Gosto culinaria', 'Adoro programacao')).toBe(0);
  });

  test('partial overlap returns intermediate value', () => {
    const score = bioSimilarity('musica viagem fotografia', 'musica esportes livros');
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  test('both null → 0', () => {
    expect(bioSimilarity(null, null)).toBe(0);
  });

  test('one null → 0', () => {
    expect(bioSimilarity('musica viagem', null)).toBe(0);
  });

  test('stopwords are ignored', () => {
    // 'de', 'e', 'a' are stopwords and should not contribute
    const scoreWithStopwords = bioSimilarity('gosto de musica', 'gosto de musica');
    const scoreWithoutStopwords = bioSimilarity('gosto musica', 'gosto musica');
    // Both should be 1 since keywords are identical
    expect(scoreWithStopwords).toBe(1);
    expect(scoreWithoutStopwords).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// recencyScore
// ---------------------------------------------------------------------------

describe('recencyScore', () => {
  const NOW = 1_700_000_000_000; // fixed reference time

  test('checked in now → 1.0', () => {
    const at = new Date(NOW).toISOString();
    expect(recencyScore(at, NOW)).toBe(1);
  });

  test('checked in 15 min ago → 1.0 (still in fresh window)', () => {
    const at = new Date(NOW - 15 * 60 * 1000).toISOString();
    expect(recencyScore(at, NOW)).toBe(1);
  });

  test('checked in exactly 4h ago → 0', () => {
    const at = new Date(NOW - 4 * 60 * 60 * 1000).toISOString();
    expect(recencyScore(at, NOW)).toBe(0);
  });

  test('checked in 5h ago → 0 (past max)', () => {
    const at = new Date(NOW - 5 * 60 * 60 * 1000).toISOString();
    expect(recencyScore(at, NOW)).toBe(0);
  });

  test('midpoint (~2h 7.5min) → ~0.5', () => {
    const RECENT_MS = 15 * 60 * 1000;
    const MAX_MS = 4 * 60 * 60 * 1000;
    const midAgeMs = RECENT_MS + (MAX_MS - RECENT_MS) / 2;
    const at = new Date(NOW - midAgeMs).toISOString();
    expect(recencyScore(at, NOW)).toBeCloseTo(0.5, 5);
  });
});

// ---------------------------------------------------------------------------
// seededShuffle
// ---------------------------------------------------------------------------

describe('seededShuffle', () => {
  const items = ['a', 'b', 'c', 'd', 'e'];

  test('returns all items (no duplicates, no omissions)', () => {
    const result = seededShuffle(items, 'seed-1');
    expect(result.sort()).toEqual([...items].sort());
  });

  test('same seed → same order every time', () => {
    const r1 = seededShuffle(items, 'my-seed');
    const r2 = seededShuffle(items, 'my-seed');
    expect(r1).toEqual(r2);
  });

  test('different seeds produce different orders (probabilistic)', () => {
    const r1 = seededShuffle(items, 'seed-aaa');
    const r2 = seededShuffle(items, 'seed-zzz');
    // With 5 items, both orderings being identical by chance is 1/120
    expect(r1).not.toEqual(r2);
  });

  test('does not mutate the original array', () => {
    const original = [...items];
    seededShuffle(items, 'test');
    expect(items).toEqual(original);
  });

  test('empty array → empty array', () => {
    expect(seededShuffle([], 'seed')).toEqual([]);
  });

  test('single element → same element', () => {
    expect(seededShuffle(['only'], 'seed')).toEqual(['only']);
  });
});

// ---------------------------------------------------------------------------
// orderFeed — integration
// ---------------------------------------------------------------------------

describe('orderFeed', () => {
  const NOW = 1_700_000_000_000;

  function makeCandidates(): FeedProfile[] {
    return [
      {
        id: 'c1',
        name: 'Ana',
        bio: 'Gosto musica viagem fotografia',
        age: 26,
        sex: 'feminino',
        partner_preference: 'todos',
        checked_in_at: new Date(NOW - 5 * 60 * 1000).toISOString(), // 5 min (recency=1.0)
      },
      {
        id: 'c2',
        name: 'Bia',
        bio: 'Adoro esportes academia corrida',
        age: 28,
        sex: 'feminino',
        partner_preference: 'todos',
        checked_in_at: new Date(NOW - 3 * 60 * 60 * 1000).toISOString(), // 3h (recency≈0.26)
      },
      {
        id: 'c3',
        name: 'Carlos',
        bio: 'Programacao games tecnologia',
        age: 25,
        sex: 'masculino',
        partner_preference: 'todos',
        checked_in_at: new Date(NOW - 10 * 60 * 1000).toISOString(),
      },
    ];
  }

  test('candidates not matching preference are excluded', () => {
    const viewer = makeViewer({ partner_preference: 'feminino', age: 28 });
    const result = orderFeed(viewer, makeCandidates(), 'seed', NOW);
    // Carlos (masculino) should be filtered out
    expect(result.map((c) => c.id)).not.toContain('c3');
    expect(result.map((c) => c.id)).toContain('c1');
    expect(result.map((c) => c.id)).toContain('c2');
  });

  test('candidates outside age range are excluded', () => {
    const viewer = makeViewer({ partner_preference: 'todos', age: 50 });
    // candidates are 26, 28, 25 → max = 60, min = 40 → all outside range
    const result = orderFeed(viewer, makeCandidates(), 'seed', NOW);
    expect(result).toHaveLength(0);
  });

  test('bio similarity lifts score of matching candidate', () => {
    const viewer = makeViewer({
      bio: 'Gosto musica viagem fotografia',
      partner_preference: 'feminino',
      age: 28,
    });
    const result = orderFeed(viewer, makeCandidates(), 'seed', NOW);
    // Ana (c1) shares bio keywords AND is recent → should rank first
    expect(result[0].id).toBe('c1');
  });

  test('same seed → same ordering (deterministic)', () => {
    const viewer = makeViewer({ partner_preference: 'todos', age: 27 });
    const r1 = orderFeed(viewer, makeCandidates(), 'session-id-abc', NOW);
    const r2 = orderFeed(viewer, makeCandidates(), 'session-id-abc', NOW);
    expect(r1.map((c) => c.id)).toEqual(r2.map((c) => c.id));
  });

  test('returns empty array when no candidates pass hard filters', () => {
    const viewer = makeViewer({ partner_preference: 'feminino', age: 50 });
    const result = orderFeed(viewer, makeCandidates(), 'seed', NOW);
    expect(result).toEqual([]);
  });

  test('todos preference includes all sexes', () => {
    const viewer = makeViewer({ partner_preference: 'todos', age: 27 });
    const result = orderFeed(viewer, makeCandidates(), 'seed', NOW);
    expect(result).toHaveLength(3);
  });
});
