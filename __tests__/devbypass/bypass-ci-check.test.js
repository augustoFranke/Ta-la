/**
 * Tests for the CI bypass check script (scripts/check-bypass.js).
 *
 * These tests verify that:
 * 1. The script exits 1 (fail) when bypass is enabled in production
 * 2. The script exits 0 (pass) when bypass is disabled in production
 * 3. The script exits 0 (info) for development profile regardless
 *
 * Note: These tests use child_process.spawnSync to run the script
 * in isolation, simulating real CI execution.
 */

'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const scriptPath = path.resolve(__dirname, '../../scripts/check-bypass.js');

function runScript(profile, env = {}) {
  const result = spawnSync('node', [scriptPath, profile], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return {
    exitCode: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

describe('check-bypass.js CI script', () => {
  describe('production profile', () => {
    test('PASS: exits 0 when EXPO_PUBLIC_IS_DEV_BYPASS is not set', () => {
      const { exitCode, stdout } = runScript('production', {
        EXPO_PUBLIC_IS_DEV_BYPASS: '',
      });
      expect(exitCode).toBe(0);
      expect(stdout).toContain('[PASS]');
    });

    test('PASS: exits 0 when EXPO_PUBLIC_IS_DEV_BYPASS=false', () => {
      const { exitCode, stdout } = runScript('production', {
        EXPO_PUBLIC_IS_DEV_BYPASS: 'false',
      });
      expect(exitCode).toBe(0);
      expect(stdout).toContain('[PASS]');
    });

    test('FAIL: exits 1 when EXPO_PUBLIC_IS_DEV_BYPASS=true', () => {
      const { exitCode, stderr } = runScript('production', {
        EXPO_PUBLIC_IS_DEV_BYPASS: 'true',
      });
      expect(exitCode).toBe(1);
      expect(stderr).toContain('[FAIL]');
    });

    test('FAIL: exit code is 1 (non-zero) so CI job fails', () => {
      const { exitCode } = runScript('production', {
        EXPO_PUBLIC_IS_DEV_BYPASS: 'true',
      });
      expect(exitCode).not.toBe(0);
    });
  });

  describe('development profile', () => {
    test('exits 0 regardless of bypass flag', () => {
      const withBypass = runScript('development', {
        EXPO_PUBLIC_IS_DEV_BYPASS: 'true',
      });
      expect(withBypass.exitCode).toBe(0);

      const withoutBypass = runScript('development', {
        EXPO_PUBLIC_IS_DEV_BYPASS: '',
      });
      expect(withoutBypass.exitCode).toBe(0);
    });

    test('reports INFO about bypass status', () => {
      const { stdout } = runScript('development', {
        EXPO_PUBLIC_IS_DEV_BYPASS: 'true',
      });
      expect(stdout).toContain('[INFO]');
    });
  });

  describe('default (no profile arg)', () => {
    test('defaults to production profile behavior', () => {
      const result = spawnSync('node', [scriptPath], {
        encoding: 'utf8',
        env: { ...process.env, EXPO_PUBLIC_IS_DEV_BYPASS: '' },
      });
      expect(result.status).toBe(0);
    });
  });
});
