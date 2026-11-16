import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For an EAS build that testers will install on their own phones, this
// MUST be your live Render backend URL - a LAN IP or localhost only works
// on a device on the same network as your dev machine.
// Replace REPLACE_ME with your actual backend service name from Render.
const BASE_URL = 'https://REPLACE_ME.onrender.com/api';

// For local development in Expo Go on a phone on the same Wi-Fi as your
// computer, swap the line above for your machine's LAN IP instead, e.g.:
// const BASE_URL = 'http://192.168.1.100:5000/api';

const client = axios.create({ baseURL: BASE_URL });

// Image URLs from the API are either absolute (Cloudinary uploads) or relative
// paths like "/demo/vehicles/prado-1.jpg" served by the backend itself. This
// resolves both to something <Image> can load.
export const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');
export function assetUrl(u) {
  if (!u) return null;
  return /^https?:\/\//.test(u) ? u : `${API_ORIGIN}${u.startsWith('/') ? '' : '/'}${u}`;
}

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('flotteguard_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
