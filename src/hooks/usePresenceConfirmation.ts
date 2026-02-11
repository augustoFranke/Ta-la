import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

const CONFIRMATION_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export function usePresenceConfirmation(hasActiveCheckIn: boolean) {
  const [showPrompt, setShowPrompt] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setShowPrompt(true);
    }, CONFIRMATION_INTERVAL_MS);
  }, []);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!hasActiveCheckIn) {
      stopInterval();
      setShowPrompt(false);
      return;
    }

    startInterval();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        // Returning to foreground — restart interval
        startInterval();
      } else if (nextState.match(/inactive|background/)) {
        stopInterval();
      }
      appStateRef.current = nextState;
    });

    return () => {
      stopInterval();
      subscription.remove();
    };
  }, [hasActiveCheckIn, startInterval, stopInterval]);

  const confirmPresence = useCallback(() => {
    setShowPrompt(false);
    startInterval(); // Reset the 30-min timer
  }, [startInterval]);

  const denyPresence = useCallback(() => {
    setShowPrompt(false);
    stopInterval();
    // Caller is responsible for triggering checkout
  }, [stopInterval]);

  return { showPrompt, confirmPresence, denyPresence };
}
