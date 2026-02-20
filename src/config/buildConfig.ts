/**
 * Build-time configuration constants.
 *
 * IS_DEV_BYPASS is the single source of truth for whether dev bypass is active.
 * It requires BOTH conditions:
 *   1. __DEV__ === true (Metro compile-time; false in production bundles)
 *   2. Explicit EXPO_PUBLIC_IS_DEV_BYPASS=true in the environment
 *
 * Defense-in-depth: in production builds, __DEV__ is false at compile time,
 * so Metro dead-code-eliminates the entire bypass branch. Even if someone
 * sets the env var at runtime, the code path does not exist in the bundle.
 */

import Constants from 'expo-constants';

/**
 * True only in DEV builds with explicit bypass flag enabled.
 * Production builds: always false (compile-time eliminated).
 */
export const IS_DEV_BYPASS: boolean =
  __DEV__ && Constants.expoConfig?.extra?.isDevBypass === true;

/**
 * True when running in Expo development mode.
 */
export const IS_DEV: boolean = __DEV__;
