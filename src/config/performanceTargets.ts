/**
 * Performance targets — Spec 012 §7
 *
 * Hard targets that must be met on mid-tier devices.
 * These constants are used in tests and can be referenced in monitoring tooling.
 */

/** Maximum time (ms) from input to visible feedback — Spec 012 §7 */
export const MAX_INPUT_FEEDBACK_MS = 100;

/** Maximum perceived screen transition time (ms) — Spec 012 §7 */
export const MAX_SCREEN_TRANSITION_MS = 400;

/** Target scroll frame rate (fps) — Spec 012 §7 */
export const TARGET_SCROLL_FPS = 60;

/** Minimum crash-free session rate during beta (%) — Spec 012 §7 */
export const MIN_CRASH_FREE_SESSIONS_PCT = 99.5;

/** optimistic message bubble appears within this many ms after send (Spec 007 §7) */
export const MAX_OPTIMISTIC_BUBBLE_MS = 300;

/** Push notification delivery SLO P95 (ms) — Spec 008 §7 */
export const PUSH_DELIVERY_P95_MS = 30_000;

/** Notifications list load P95 (ms) — Spec 008 §7 */
export const NOTIF_LIST_LOAD_P95_MS = 1_000;
