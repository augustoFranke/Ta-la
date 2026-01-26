import * as Location from 'expo-location';
import { useLocationStore } from '../stores/locationStore';

export async function requestLocationPermissions() {
  const { setPermission, setError, setLoading } = useLocationStore.getState();
  
  setLoading(true);
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      setError('Permissão de localização negada');
      setPermission(false);
      return false;
    }
    
    setPermission(true);
    setError(null);
    return true;
  } catch (error: any) {
    setError(error.message);
    setPermission(false);
    return false;
  } finally {
    setLoading(false);
  }
}

export async function syncLocationPermission() {
  const { setPermission, setError } = useLocationStore.getState();

  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    const granted = status === 'granted';
    setPermission(granted);
    setError(null);
    return granted;
  } catch (error: any) {
    setPermission(false);
    setError(error?.message || 'Erro ao verificar permissões');
    return false;
  }
}

export async function bootstrapLocation() {
  const granted = await syncLocationPermission();
  if (!granted) return null;
  return getCurrentLocation();
}

export async function getCurrentLocation() {
  const { setLocation, setError, setLoading, permissionGranted } = useLocationStore.getState();

  if (!permissionGranted) {
    const granted = await requestLocationPermissions();
    if (!granted) return null;
  }

  setLoading(true);
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    setLocation(location.coords.latitude, location.coords.longitude);
    return location.coords;
  } catch (error: any) {
    setError(error.message);
    return null;
  } finally {
    setLoading(false);
  }
}
