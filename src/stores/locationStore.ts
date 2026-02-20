import { create } from 'zustand';
import * as Location from 'expo-location';

/** Location freshness threshold — locations older than this are considered stale for check-in eligibility. */
export const LOCATION_FRESHNESS_MS = 120 * 1000; // 120 seconds

/** Minimum accuracy required to be eligible for check-in. */
export const LOCATION_MAX_ACCURACY_M = 50; // 50 metres

/** Check-in venue radius. */
export const CHECKIN_RADIUS_M = 100; // 100 metres

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  /** GPS accuracy in metres. Null until first fix obtained. */
  accuracy: number | null;
  /** Unix timestamp (ms) of the last GPS reading. */
  locationTimestamp: number | null;
  errorMsg: string | null;
  permissionGranted: boolean;
  isLoading: boolean;

  // Dev override state (only active in __DEV__ builds)
  devOverride: boolean;
  devLat: number | null;
  devLng: number | null;

  // Actions
  requestPermissions: () => Promise<boolean>;
  syncPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<Location.LocationObjectCoords | null>;
  bootstrap: () => Promise<Location.LocationObjectCoords | null>;

  // Simple Setters (can be used for manual updates if needed)
  setLocation: (lat: number, long: number) => void;
  setError: (msg: string | null) => void;
  setPermission: (granted: boolean) => void;
  setLoading: (loading: boolean) => void;

  // Dev override actions (no-ops in production)
  setDevOverride: (lat: number, lng: number) => void;
  clearDevOverride: () => void;

  // Helpers
  /** Returns true if the stored location is fresh enough for check-in eligibility. */
  isLocationFresh: () => boolean;
  /** Returns true if accuracy is good enough for check-in. */
  isAccuracyGood: () => boolean;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  latitude: null,
  longitude: null,
  accuracy: null,
  locationTimestamp: null,
  errorMsg: null,
  permissionGranted: false,
  isLoading: false,

  devOverride: false,
  devLat: null,
  devLng: null,

  setLocation: (latitude, longitude) => set({ latitude, longitude }),
  setError: (errorMsg) => set({ errorMsg }),
  setPermission: (permissionGranted) => set({ permissionGranted }),
  setLoading: (isLoading) => set({ isLoading }),

  isLocationFresh: () => {
    const { locationTimestamp } = get();
    if (locationTimestamp === null) return false;
    return Date.now() - locationTimestamp <= LOCATION_FRESHNESS_MS;
  },

  isAccuracyGood: () => {
    const { accuracy } = get();
    if (accuracy === null) return false;
    return accuracy <= LOCATION_MAX_ACCURACY_M;
  },

  setDevOverride: (lat: number, lng: number) => {
    if (!__DEV__) return;
    set({
      devOverride: true,
      devLat: lat,
      devLng: lng,
      latitude: lat,
      longitude: lng,
      accuracy: 5,
      locationTimestamp: Date.now(),
    });
  },

  clearDevOverride: () => {
    if (!__DEV__) return;
    set({ devOverride: false, devLat: null, devLng: null });
    // Restore real GPS coords
    get().getCurrentLocation();
  },

  requestPermissions: async () => {
    set({ isLoading: true });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';

      set({
        permissionGranted: granted,
        errorMsg: granted ? null : 'Permissão de localização negada',
      });
      return granted;
    } catch (error: unknown) {
      set({
        errorMsg: error instanceof Error ? error.message : 'Erro ao solicitar permissão',
        permissionGranted: false,
      });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  syncPermission: async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      const granted = status === 'granted';
      set({ permissionGranted: granted, errorMsg: null });
      return granted;
    } catch (error: unknown) {
      set({
        permissionGranted: false,
        errorMsg: error instanceof Error ? error.message : 'Erro ao verificar permissões',
      });
      return false;
    }
  },

  getCurrentLocation: async () => {
    const { permissionGranted, requestPermissions, devOverride, devLat, devLng } = get();

    // Short-circuit when dev override is active
    if (__DEV__ && devOverride && devLat !== null && devLng !== null) {
      const now = Date.now();
      set({ latitude: devLat, longitude: devLng, accuracy: 5, locationTimestamp: now });
      return {
        latitude: devLat,
        longitude: devLng,
        accuracy: 5,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      };
    }

    // If we don't think we have permission, try to request it first
    if (!permissionGranted) {
      const granted = await requestPermissions();
      if (!granted) return null;
    }

    set({ isLoading: true });
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      set({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? null,
        locationTimestamp: location.timestamp ?? Date.now(),
      });
      return location.coords;
    } catch (error: unknown) {
      set({ errorMsg: error instanceof Error ? error.message : 'Erro ao obter localização' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  bootstrap: async () => {
    const { syncPermission, getCurrentLocation } = get();
    const granted = await syncPermission();
    if (!granted) return null;
    return getCurrentLocation();
  },
}));
