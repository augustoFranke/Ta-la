/**
 * Tests for profile verification rules — Spec 003 + 009
 *
 * Covers:
 * - Age validation (>= 18, underage block)
 * - Document format validation (CPF, RG, CNH)
 * - Photo minimum enforcement (4 required)
 * - OTP lockout (5 attempts -> 30-min lockout)
 * - Check-in gating by verification status
 * - Re-verification when identity-critical fields change
 * - Duplicate photo detection
 */

import {
  validateAge,
  validateCpf,
  validateDocument,
  createPhoneOtpState,
  isOtpLockedOut,
  isOtpExpired,
  verifyPhoneOtp,
  VERIFICATION_CONSTANTS,
  isIdentityCriticalChange,
  doesPhotoChangeTriggerReverification,
  findDuplicatePhotos,
} from '../../src/services/verification';
import { MIN_PHOTOS, IDENTITY_CRITICAL_FIELDS } from '../../src/types/database';

// ---------------------------------------------------------------------------
// Age validation
// ---------------------------------------------------------------------------

describe('validateAge', () => {
  const today = new Date();

  function isoDate(years: number): string {
    const d = new Date(today);
    d.setFullYear(d.getFullYear() - years);
    return d.toISOString().split('T')[0];
  }

  test('accepts exactly 18 years old', () => {
    const result = validateAge(isoDate(18));
    expect(result.valid).toBe(true);
  });

  test('accepts 30 years old', () => {
    const result = validateAge(isoDate(30));
    expect(result.valid).toBe(true);
  });

  test('rejects 17 years old', () => {
    const result = validateAge(isoDate(17));
    expect(result.valid).toBe(false);
    expect(result.age).toBe(17);
  });

  test('rejects 0 years old', () => {
    const result = validateAge(isoDate(0));
    expect(result.valid).toBe(false);
  });

  test('returns age in result', () => {
    const result = validateAge(isoDate(25));
    expect(result.valid).toBe(true);
    expect(result.age).toBe(25);
  });

  test('rejects impossibly old date', () => {
    const result = validateAge('1800-01-01');
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CPF validation
// ---------------------------------------------------------------------------

describe('validateCpf', () => {
  // Known valid CPFs (from public test data)
  test('accepts valid CPF with dots and dash', () => {
    const result = validateCpf('529.982.247-25');
    expect(result.valid).toBe(true);
  });

  test('accepts valid CPF digits only', () => {
    const result = validateCpf('52998224725');
    expect(result.valid).toBe(true);
  });

  test('rejects all-same digits (111.111.111-11)', () => {
    const result = validateCpf('111.111.111-11');
    expect(result.valid).toBe(false);
  });

  test('rejects short CPF', () => {
    const result = validateCpf('123456');
    expect(result.valid).toBe(false);
  });

  test('rejects CPF with invalid check digit', () => {
    const result = validateCpf('529.982.247-99');
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Document validation (delegating to validateCpf)
// ---------------------------------------------------------------------------

describe('validateDocument', () => {
  test('CPF: valid', () => {
    expect(validateDocument('cpf', '529.982.247-25').valid).toBe(true);
  });

  test('CPF: invalid', () => {
    expect(validateDocument('cpf', '000.000.000-00').valid).toBe(false);
  });

  test('RG: valid (7+ digits)', () => {
    expect(validateDocument('rg', '12.345.678-9').valid).toBe(true);
  });

  test('RG: too short', () => {
    expect(validateDocument('rg', '1234').valid).toBe(false);
  });

  test('CNH: valid (11 digits)', () => {
    expect(validateDocument('cnh', '12345678901').valid).toBe(true);
  });

  test('CNH: wrong length', () => {
    expect(validateDocument('cnh', '123456').valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Photo minimum (Spec 003 + 009)
// ---------------------------------------------------------------------------

describe('MIN_PHOTOS constant', () => {
  test('MIN_PHOTOS is 4', () => {
    expect(MIN_PHOTOS).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// Phone OTP rate limiting (Spec 003)
// ---------------------------------------------------------------------------

describe('Phone OTP state machine', () => {
  const { OTP_MAX_ATTEMPTS, OTP_LOCKOUT_MINUTES, OTP_EXPIRY_MINUTES } = VERIFICATION_CONSTANTS;

  test('OTP_MAX_ATTEMPTS is 5', () => {
    expect(OTP_MAX_ATTEMPTS).toBe(5);
  });

  test('OTP_LOCKOUT_MINUTES is 30', () => {
    expect(OTP_LOCKOUT_MINUTES).toBe(30);
  });

  test('OTP_EXPIRY_MINUTES is 10', () => {
    expect(OTP_EXPIRY_MINUTES).toBe(10);
  });

  test('new state is not locked out', () => {
    const state = createPhoneOtpState('+5511999999999');
    expect(isOtpLockedOut(state)).toBe(false);
  });

  test('locked state blocks verification', () => {
    const futureTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const lockedState = {
      phone: '+5511999999999',
      attempts: 5,
      max_attempts: 5,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      locked_until: futureTime,
      last_sent_at: new Date().toISOString(),
    };
    expect(isOtpLockedOut(lockedState)).toBe(true);
  });

  test('expired OTP is detected', () => {
    const pastTime = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const expiredState = {
      phone: '+5511999999999',
      attempts: 0,
      max_attempts: 5,
      expires_at: pastTime,
      locked_until: null,
      last_sent_at: new Date().toISOString(),
    };
    expect(isOtpExpired(expiredState)).toBe(true);
  });

  test('locks out after max attempts', async () => {
    const base = {
      phone: '+5511999999999',
      attempts: OTP_MAX_ATTEMPTS - 1, // one less than max
      max_attempts: OTP_MAX_ATTEMPTS,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      locked_until: null,
      last_sent_at: new Date().toISOString(),
    };

    const result = await verifyPhoneOtp(base, '000000');
    expect(result.success).toBe(false);
    expect(result.state.locked_until).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Verification status gating (Spec 003)
// ---------------------------------------------------------------------------

describe('identity-critical field detection', () => {
  test('IDENTITY_CRITICAL_FIELDS contains legal_name', () => {
    expect(IDENTITY_CRITICAL_FIELDS).toContain('legal_name');
  });

  test('IDENTITY_CRITICAL_FIELDS contains document_number', () => {
    expect(IDENTITY_CRITICAL_FIELDS).toContain('document_number');
  });

  test('bio is NOT identity-critical', () => {
    expect(isIdentityCriticalChange('bio', 'verified')).toBe(false);
  });

  test('legal_name IS identity-critical for verified users', () => {
    expect(isIdentityCriticalChange('legal_name', 'verified')).toBe(true);
  });

  test('document_number IS identity-critical for verified users', () => {
    expect(isIdentityCriticalChange('document_number', 'verified')).toBe(true);
  });

  test('identity-critical field does NOT revert incomplete profile', () => {
    // A user who is incomplete doesn't have verification to revert
    expect(isIdentityCriticalChange('legal_name', 'incomplete')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Photo change re-verification (Spec 009)
// ---------------------------------------------------------------------------

describe('photo change re-verification', () => {
  test('main photo change triggers re-verification for verified user', () => {
    expect(doesPhotoChangeTriggerReverification(0, 'verified')).toBe(true);
  });

  test('secondary photo change does NOT trigger re-verification', () => {
    expect(doesPhotoChangeTriggerReverification(1, 'verified')).toBe(false);
    expect(doesPhotoChangeTriggerReverification(2, 'verified')).toBe(false);
    expect(doesPhotoChangeTriggerReverification(3, 'verified')).toBe(false);
  });

  test('main photo change for non-verified user does NOT trigger re-verification', () => {
    expect(doesPhotoChangeTriggerReverification(0, 'incomplete')).toBe(false);
    expect(doesPhotoChangeTriggerReverification(0, 'pending_verification')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Duplicate photo detection (Spec 003)
// ---------------------------------------------------------------------------

describe('findDuplicatePhotos', () => {
  test('no duplicates returns empty array', () => {
    const result = findDuplicatePhotos(['uri1', 'uri2', 'uri3', 'uri4']);
    expect(result).toHaveLength(0);
  });

  test('detects duplicate pair', () => {
    const result = findDuplicatePhotos(['uri1', 'uri2', 'uri1', 'uri4']);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual([0, 2]);
  });

  test('detects multiple duplicates', () => {
    const result = findDuplicatePhotos(['uri1', 'uri1', 'uri2', 'uri2']);
    expect(result).toHaveLength(2);
  });

  test('all same URIs detected', () => {
    const result = findDuplicatePhotos(['same', 'same', 'same', 'same']);
    expect(result.length).toBeGreaterThan(0);
  });
});
