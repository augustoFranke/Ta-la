/**
 * DEV bypass configuration and mock data.
 *
 * This module provides:
 * - Typed bypass state (enabled/disabled)
 * - Mock user, session, check-in, and match data for local testing
 * - Simulatable states: guest, registered, verified, checked_in, matched
 *
 * In production builds, IS_DEV_BYPASS is compile-time false, so all mock
 * data is dead-code-eliminated from the bundle.
 */

import { IS_DEV_BYPASS } from './buildConfig';
import type { User, CheckIn, Gender, GenderPreference } from '../types/database';

// ---------------------------------------------------------------------------
// Simulated state types
// ---------------------------------------------------------------------------

/**
 * Possible simulated user states in DEV mode.
 */
export type SimulatedState =
  | 'guest'
  | 'registered'
  | 'verified'
  | 'checked_in'
  | 'matched';

export const SIMULATED_STATE_LABELS: Record<SimulatedState, string> = {
  guest: 'Visitante (sem login)',
  registered: 'Cadastrado (sem perfil)',
  verified: 'Verificado (perfil completo)',
  checked_in: 'Com check-in ativo',
  matched: 'Com match confirmado',
};

export const SIMULATED_STATES: SimulatedState[] = [
  'guest',
  'registered',
  'verified',
  'checked_in',
  'matched',
];

// ---------------------------------------------------------------------------
// Mock data (only used in DEV bypass)
// ---------------------------------------------------------------------------

const MOCK_USER_ID = '00000000-0000-4000-8000-000000000001';
const MOCK_VENUE_ID = '00000000-0000-4000-8000-000000000099';
const MOCK_MATCH_USER_ID = '00000000-0000-4000-8000-000000000002';

export const MOCK_USER: User = {
  id: MOCK_USER_ID,
  email: 'dev@tala.local',
  name: 'Dev User',
  birth_date: '1995-01-15',
  bio: 'Desenvolvedor testando o app localmente',
  occupation: 'Developer',
  gender: 'masculino' as Gender,
  gender_preference: 'todos' as GenderPreference,
  is_verified: true,
  is_available: true,
  location: null,
  last_active: new Date().toISOString(),
  created_at: new Date().toISOString(),
};

export const MOCK_CHECK_IN: CheckIn = {
  id: '00000000-0000-4000-8000-000000000010',
  user_id: MOCK_USER_ID,
  venue_id: MOCK_VENUE_ID,
  is_active: true,
  open_to_meeting: true,
  visibility: 'public',
  checked_in_at: new Date().toISOString(),
  checked_out_at: null,
};

export const MOCK_MATCH = {
  id: '00000000-0000-4000-8000-000000000020',
  user1_id: MOCK_USER_ID,
  user2_id: MOCK_MATCH_USER_ID,
  venue_id: MOCK_VENUE_ID,
  confirmed: true,
  matched_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// State resolution helpers
// ---------------------------------------------------------------------------

/**
 * Returns mock session data for a given simulated state.
 * Returns null for 'guest' (no session).
 */
export function getMockSession(state: SimulatedState) {
  if (state === 'guest') return null;
  return {
    user: { id: MOCK_USER_ID, email: MOCK_USER.email },
    access_token: 'dev-bypass-token',
    refresh_token: 'dev-bypass-refresh',
  };
}

/**
 * Returns mock user data for a given simulated state.
 * Returns null for 'guest' and 'registered' (no profile yet).
 */
export function getMockUser(state: SimulatedState): User | null {
  if (state === 'guest' || state === 'registered') return null;
  return { ...MOCK_USER };
}

/**
 * Returns mock check-in for states that include an active check-in.
 */
export function getMockCheckIn(state: SimulatedState): CheckIn | null {
  if (state === 'checked_in' || state === 'matched') {
    return { ...MOCK_CHECK_IN };
  }
  return null;
}

/**
 * Returns mock match for the 'matched' state.
 */
export function getMockMatch(state: SimulatedState) {
  if (state === 'matched') {
    return { ...MOCK_MATCH };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main bypass export
// ---------------------------------------------------------------------------

export interface DevBypassConfig {
  /** Whether bypass is active. False in production (compile-time). */
  enabled: boolean;
}

/**
 * Dev bypass configuration.
 *
 * Usage:
 * ```ts
 * import { devBypass } from '@/config/devBypass';
 * if (devBypass.enabled) { ... }
 * ```
 *
 * In production, `devBypass.enabled` is always `false` and the bypass
 * branch is dead-code-eliminated by Metro bundler.
 */
export const devBypass: DevBypassConfig = {
  enabled: IS_DEV_BYPASS,
};
