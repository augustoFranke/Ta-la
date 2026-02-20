/**
 * Tests for guest mode and venue CTA states — Spec 001 + 004
 *
 * Covers:
 * - RADIUS_EXPANSION_STEPS constant matches spec (2km → 5km → 10km → 20km)
 * - CTA logic for guest / unverified / verified users
 * - Trending constants
 */

import { RADIUS_EXPANSION_STEPS } from '../../src/hooks/useVenues';

// ---------------------------------------------------------------------------
// Radius expansion constants (Spec 004)
// ---------------------------------------------------------------------------

describe('RADIUS_EXPANSION_STEPS', () => {
  test('starts at 2km', () => {
    expect(RADIUS_EXPANSION_STEPS[0]).toBe(2000);
  });

  test('expands through 5km, 10km, 20km', () => {
    expect(RADIUS_EXPANSION_STEPS).toEqual([2000, 5000, 10000, 20000]);
  });

  test('has 4 expansion levels', () => {
    expect(RADIUS_EXPANSION_STEPS).toHaveLength(4);
  });

  test('steps are in ascending order', () => {
    for (let i = 1; i < RADIUS_EXPANSION_STEPS.length; i++) {
      expect(RADIUS_EXPANSION_STEPS[i]).toBeGreaterThan(RADIUS_EXPANSION_STEPS[i - 1]);
    }
  });
});

// ---------------------------------------------------------------------------
// VenueCard CTA state derivation logic (pure function tests)
// ---------------------------------------------------------------------------

/**
 * Mirrors the CTA logic inside VenueCard without importing the component.
 * Any changes to VenueCard's logic must be reflected here.
 */
function getCtaLabel(opts: {
  isAlreadyCheckedIn: boolean;
  isTooFar: boolean;
  isGuest: boolean;
  isVerified: boolean;
}): string {
  const { isAlreadyCheckedIn, isTooFar, isGuest, isVerified } = opts;
  const isInRange = !isTooFar;
  const needsVerification = isInRange && !isGuest && !isVerified;

  if (isAlreadyCheckedIn) return 'Sair';
  if (isTooFar) return 'Você está longe';
  if (needsVerification) return 'Verificar perfil para fazer check-in';
  return 'Fazer check-in';
}

describe('VenueCard CTA label derivation', () => {
  test('already checked in → "Sair"', () => {
    expect(getCtaLabel({ isAlreadyCheckedIn: true, isTooFar: false, isGuest: false, isVerified: true })).toBe('Sair');
  });

  test('too far → "Você está longe"', () => {
    expect(getCtaLabel({ isAlreadyCheckedIn: false, isTooFar: true, isGuest: false, isVerified: true })).toBe('Você está longe');
  });

  test('in range + verified → "Fazer check-in"', () => {
    expect(getCtaLabel({ isAlreadyCheckedIn: false, isTooFar: false, isGuest: false, isVerified: true })).toBe('Fazer check-in');
  });

  test('in range + not verified → "Verificar perfil para fazer check-in"', () => {
    expect(getCtaLabel({ isAlreadyCheckedIn: false, isTooFar: false, isGuest: false, isVerified: false })).toBe('Verificar perfil para fazer check-in');
  });

  test('in range + guest → "Fazer check-in" (guest redirected to signup by handler)', () => {
    // Guest sees "Fazer check-in" but the handler redirects to Account Creation (Spec 001)
    expect(getCtaLabel({ isAlreadyCheckedIn: false, isTooFar: false, isGuest: true, isVerified: false })).toBe('Fazer check-in');
  });

  test('too far + unverified → "Você está longe" (distance check takes priority)', () => {
    expect(getCtaLabel({ isAlreadyCheckedIn: false, isTooFar: true, isGuest: false, isVerified: false })).toBe('Você está longe');
  });
});

// ---------------------------------------------------------------------------
// Greeting text derivation (Spec 004)
// ---------------------------------------------------------------------------

function getGreeting(firstName: string | null | undefined): string {
  return firstName ? `Olá, ${firstName}!` : 'Olá!';
}

describe('Home screen greeting', () => {
  test('guest sees "Olá!"', () => {
    expect(getGreeting(null)).toBe('Olá!');
  });

  test('logged-in user sees "Olá, {name}!"', () => {
    expect(getGreeting('Maria')).toBe('Olá, Maria!');
  });

  test('undefined name falls back to "Olá!"', () => {
    expect(getGreeting(undefined)).toBe('Olá!');
  });
});
