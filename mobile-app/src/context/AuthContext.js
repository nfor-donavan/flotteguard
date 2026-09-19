import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('flotteguard_token').then((token) => {
      if (!token) return setLoading(false);
      client
        .get('/auth/me')
        .then((res) => setUser(res.data.user))
        .catch(() => AsyncStorage.removeItem('flotteguard_token'))
        .finally(() => setLoading(false));
    });
  }, []);

  async function login(phone, password) {
    const res = await client.post('/auth/login', { phone, password });
    await AsyncStorage.setItem('flotteguard_token', res.data.token);
    setUser(res.data.user);
  }

  async function logout() {
    await AsyncStorage.removeItem('flotteguard_token');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
