import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Backend base URL for local development.
 *
 * - Web / iOS Simulator: localhost
 * - Android Emulator: 10.0.2.2 (host machine)
 * - Physical device: set PHYSICAL_DEVICE_HOST to your PC's LAN IP
 */
const ANDROID_EMULATOR_HOST = '10.0.2.2';
const PHYSICAL_DEVICE_HOST = '192.168.1.100';

function getDevMachineHost(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }
  return PHYSICAL_DEVICE_HOST;
}

const API_PORT = 8001;

export function getApiBaseUrl(): string {
  if (Platform.OS === 'web') {
    return `http://localhost:${API_PORT}`;
  }
  if (Platform.OS === 'android') {
    const host = getDevMachineHost();
    if (host !== PHYSICAL_DEVICE_HOST) {
      return `http://${host}:${API_PORT}`;
    }
    return `http://${ANDROID_EMULATOR_HOST}:${API_PORT}`;
  }
  return `http://localhost:${API_PORT}`;
}

export const GOOGLE_AUTH_ENDPOINT = '/api/auth/google';

export const GOOGLE_WEB_CLIENT_ID =
  '1077337845085-rjlu5q5jlou94s8hmlc41csm3k2e7pqs.apps.googleusercontent.com';
