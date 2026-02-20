/**
 * DevBypassGuard
 *
 * Wraps content that should only be visible when dev bypass is enabled.
 * In production builds, IS_DEV_BYPASS is compile-time false, so children
 * are never rendered and the component tree is eliminated.
 *
 * Usage:
 * ```tsx
 * <DevBypassGuard>
 *   <DevOnlyComponent />
 * </DevBypassGuard>
 *
 * <DevBypassGuard fallback={<ProductionComponent />}>
 *   <DevOnlyComponent />
 * </DevBypassGuard>
 * ```
 */

import React from 'react';
import { IS_DEV_BYPASS } from '../config/buildConfig';

interface DevBypassGuardProps {
  children: React.ReactNode;
  /** Optional fallback to render when bypass is NOT active */
  fallback?: React.ReactNode;
}

/**
 * Renders children ONLY when dev bypass is active.
 * In production: renders fallback (or nothing).
 */
export function DevBypassGuard({ children, fallback = null }: DevBypassGuardProps): React.ReactElement | null {
  if (!IS_DEV_BYPASS) {
    return fallback as React.ReactElement | null;
  }

  return <>{children}</>;
}

/**
 * Renders children ONLY when dev bypass is NOT active (production guard).
 * Useful for hiding content in dev bypass mode.
 */
export function ProductionOnlyGuard({ children, fallback = null }: DevBypassGuardProps): React.ReactElement | null {
  if (IS_DEV_BYPASS) {
    return fallback as React.ReactElement | null;
  }

  return <>{children}</>;
}
