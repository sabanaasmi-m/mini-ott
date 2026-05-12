import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('ott_token');
    const u = localStorage.getItem('ott_user');
    if (t) setToken(t);
    if (u) { try { setUser(JSON.parse(u)); } catch {} }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await api.post('auth/login/', { username, password });
    const accessToken = res.data.access;
    if (!accessToken) throw new Error('No token');

    localStorage.setItem('ott_token', accessToken);
    const profile = await api.get('auth/profile/', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userData = {
      ...profile.data,
      role: profile.data.role || profile.data.profile?.role || 'VIEWER',
    };
    setToken(accessToken);
    setUser(userData);
    localStorage.setItem('ott_user', JSON.stringify(userData));
    return userData;
  };

  // BUG FIX 4: Accept role parameter and pass it to backend
  const register = async (username, email, password, role = 'VIEWER') => {
    await api.post('auth/register/', { username, email, password, role });
    return login(username, password);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ott_token');
    localStorage.removeItem('ott_user');
  };

  const updateUser = (updated) => {
    const merged = { ...user, ...updated };
    setUser(merged);
    localStorage.setItem('ott_user', JSON.stringify(merged));
  };

  return (
    <AuthContext.Provider value={{
      token, user, login, register, logout, updateUser,
      isAuthenticated: !!token,
      isSubscribed: user?.is_subscribed || false,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};