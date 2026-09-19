import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Point this at your deployed Render URL, or your machine's LAN IP for
// local development (localhost won't resolve from a physical device).
const BASE_URL = 'http://192.168.1.100:5000/api';

const client = axios.create({ baseURL: BASE_URL });

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('flotteguard_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
