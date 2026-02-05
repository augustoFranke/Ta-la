import { create } from 'zustand';
import * as Location from 'expo-location';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  errorMsg: string | null;
  permissionGranted: boolean;
  isLoading: boolean;

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
}

export const useLocationStore = create<LocationState>((set, get) => ({
  latitude: null,
  longitude: null,
  errorMsg: null,
  permissionGranted: false,
  isLoading: false,

  setLocation: (latitude, longitude) => set({ latitude, longitude }),
  setError: (errorMsg) => set({ errorMsg }),
  setPermission: (permissionGranted) => set({ permissionGranted }),
  setLoading: (isLoading) => set({ isLoading }),

  requestPermissions: async () => {
    set({ isLoading: true });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      
      set({ 
        permissionGranted: granted, 
        errorMsg: granted ? null : 'Permissão de localização negada' 
      });
      return granted;
    } catch (error: any) {
      set({ 
        errorMsg: error.message, 
        permissionGranted: false 
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
    } catch (error: any) {
      set({ 
        permissionGranted: false, 
        errorMsg: error?.message || 'Erro ao verificar permissões' 
      });
      return false;
    }
  },

  getCurrentLocation: async () => {
    const { permissionGranted, requestPermissions } = get();
    
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
        longitude: location.coords.longitude 
      });
      return location.coords;
    } catch (error: any) {
      set({ errorMsg: error.message });
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
  }
}));
