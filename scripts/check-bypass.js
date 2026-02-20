#!/usr/bin/env node
/**
 * CI guard: asserts that dev bypass is NOT enabled for production builds.
 *
 * Usage:
 *   node scripts/check-bypass.js production   # must exit 0 (bypass disabled)
 *   node scripts/check-bypass.js development  # exits 0 (info: bypass may be enabled)
 *
 * Exit codes:
 *   0 = OK
 *   1 = FAIL: bypass is enabled in production configuration
 */

'use strict';

const fs = require('fs');
const path = require('path');

const profile = process.argv[2] || 'production';
const rootDir = path.resolve(__dirname, '..');

// ─── 1. Check EXPO_PUBLIC_IS_DEV_BYPASS environment variable ─────────────────
const envBypassValue = process.env.EXPO_PUBLIC_IS_DEV_BYPASS;
const envBypassEnabled = envBypassValue === 'true';

// ─── 2. Check .env.production if it exists ───────────────────────────────────
function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    result[key] = value;
  }
  return result;
}

const prodEnvFile = path.join(rootDir, '.env.production');
const prodEnv = readEnvFile(prodEnvFile);
const prodBypassEnabled = prodEnv.EXPO_PUBLIC_IS_DEV_BYPASS === 'true';

// ─── 3. Check app.config.js if it exists ─────────────────────────────────────
let configBypassEnabled = false;
try {
  const appConfigPath = path.join(rootDir, 'app.config.js');
  if (fs.existsSync(appConfigPath)) {
    // Temporarily set env to production values (clear bypass var)
    const originalBypass = process.env.EXPO_PUBLIC_IS_DEV_BYPASS;
    if (profile === 'production') {
      delete process.env.EXPO_PUBLIC_IS_DEV_BYPASS;
    }
    const appConfig = require(appConfigPath);
    const resolvedConfig = typeof appConfig === 'function' ? appConfig({ config: {} }) : appConfig;
    configBypassEnabled = resolvedConfig?.extra?.isDevBypass === true;
    if (originalBypass !== undefined) {
      process.env.EXPO_PUBLIC_IS_DEV_BYPASS = originalBypass;
    }
  }
} catch (err) {
  // If we can't parse app.config.js, default to safe (enabled = false)
  configBypassEnabled = false;
}

// ─── 4. Evaluate ─────────────────────────────────────────────────────────────
if (profile === 'production') {
  const violations = [];

  if (envBypassEnabled) {
    violations.push(`EXPO_PUBLIC_IS_DEV_BYPASS=${envBypassValue} is set in environment`);
  }
  if (prodBypassEnabled) {
    violations.push(`EXPO_PUBLIC_IS_DEV_BYPASS=true found in .env.production`);
  }
  if (configBypassEnabled) {
    violations.push(`isDevBypass=true resolved in app.config.js for production profile`);
  }

  if (violations.length > 0) {
    console.error('\n[FAIL] Dev bypass is enabled in production configuration!\n');
    for (const v of violations) {
      console.error(`  - ${v}`);
    }
    console.error('\nDev bypass MUST be disabled before shipping to production.');
    console.error('Remove EXPO_PUBLIC_IS_DEV_BYPASS from your production environment.\n');
    process.exit(1);
  }

  console.log('[PASS] Dev bypass is correctly disabled for production build.');
  process.exit(0);
} else {
  // Development profile — bypass may be enabled, just report status
  const isEnabled = envBypassEnabled || prodBypassEnabled || configBypassEnabled;
  if (isEnabled) {
    console.log('[INFO] Dev bypass is ENABLED (development profile). This is expected for local dev.');
  } else {
    console.log('[INFO] Dev bypass is disabled in development profile.');
  }
  process.exit(0);
}
