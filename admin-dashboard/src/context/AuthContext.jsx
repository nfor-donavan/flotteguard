import React, { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('flotteguard_token');
    if (!token) {
      setLoading(false);
      return;
    }
    client
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem('flotteguard_token'))
      .finally(() => setLoading(false));
  }, []);

  async function login(phone, password) {
    const res = await client.post('/auth/login', { phone, password });
    localStorage.setItem('flotteguard_token', res.data.token);
    setUser(res.data.user);
  }

  function logout() {
    localStorage.removeItem('flotteguard_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
