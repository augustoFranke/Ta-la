import { create } from 'zustand';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  errorMsg: string | null;
  permissionGranted: boolean;
  isLoading: boolean;

  setLocation: (lat: number, long: number) => void;
  setError: (msg: string | null) => void;
  setPermission: (granted: boolean) => void;
  setLoading: (loading: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  latitude: null,
  longitude: null,
  errorMsg: null,
  permissionGranted: false,
  isLoading: false,

  setLocation: (latitude, longitude) => set({ latitude, longitude }),
  setError: (errorMsg) => set({ errorMsg }),
  setPermission: (permissionGranted) => set({ permissionGranted }),
  setLoading: (isLoading) => set({ isLoading }),
}));
