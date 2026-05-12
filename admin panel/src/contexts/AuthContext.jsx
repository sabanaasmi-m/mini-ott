import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const storedUser = localStorage.getItem('admin_user');
    if (storedToken) setToken(storedToken);
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        document.body.classList.add(parsed?.role === 'CREATOR' ? 'role-creator' : 'role-admin');
      } catch {}
    }
    setLoading(false);
  }, []);

  const applyRoleClass = (role) => {
    document.body.classList.remove('role-admin', 'role-creator');
    document.body.classList.add(role === 'CREATOR' ? 'role-creator' : 'role-admin');
  };

  const login = ({ token: accessToken, user: userData }) => {
    setToken(accessToken);
    setUser(userData || null);
    localStorage.setItem('admin_token', accessToken);
    if (userData) localStorage.setItem('admin_user', JSON.stringify(userData));
    applyRoleClass(userData?.role);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('admin_user', JSON.stringify(updatedUser));
  };

  const isAdmin = user?.role === 'ADMIN';
  const isCreator = user?.role === 'CREATOR';
  const isAdminOrCreator = isAdmin || isCreator;

  return (
    <AuthContext.Provider value={{
      token, user, login, logout, updateUser,
      isAuthenticated: !!token,
      isAdmin, isCreator, isAdminOrCreator,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};