import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axiosInstance';

// ============================================================
// Auth Context — Global autentifikatsiya holati
// ============================================================
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Ilk yuklanish

  // ============================================================
  // Ilk yuklanishda localStorage'dan tiklash
  // ============================================================
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // Token hali ham amal qiladimi? /me ga so'rov yuborib tekshiramiz
          setAccessToken(storedToken);
          setUser(JSON.parse(storedUser));

          const response = await api.get('/auth/me');
          if (response.data.success) {
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }
        } catch {
          // Token muddati o'tgan — interceptor avtomatik refresh qiladi
          // Agar refresh ham muvaffaqiyatsiz bo'lsa, localStorage tozalanadi
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          setUser(null);
          setAccessToken(null);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // ============================================================
  // Ro'yxatdan o'tish
  // ============================================================
  const register = useCallback(async (name, email, password, role, deviceName) => {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      role,
      deviceName,
    });

    if (response.data.success) {
      const { accessToken: token, user: userData } = response.data;
      setAccessToken(token);
      setUser(userData);
      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
    }

    return response.data;
  }, []);

  // ============================================================
  // Tizimga kirish
  // ============================================================
  const login = useCallback(async (email, password, deviceName) => {
    const response = await api.post('/auth/login', {
      email,
      password,
      deviceName,
    });

    if (response.data.success) {
      const { accessToken: token, user: userData } = response.data;
      setAccessToken(token);
      setUser(userData);
      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
    }

    return response.data;
  }, []);

  // ============================================================
  // Chiqish (Logout)
  // ============================================================
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Xato bo'lsa ham local'ni tozalaymiz
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  }, []);

  // ============================================================
  // Token Rotation (manual — tugma bosilganda)
  // ============================================================
  const rotateToken = useCallback(async () => {
    const response = await api.post('/auth/refresh');
    if (response.data.success) {
      const { accessToken: newToken, user: userData } = response.data;
      setAccessToken(newToken);
      setUser(userData);
      localStorage.setItem('accessToken', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
    }
    return response.data;
  }, []);

  // ============================================================
  // Foydali computed qiymatlar
  // ============================================================
  const isAuthenticated = !!user && !!accessToken;
  const isAdmin = user?.role === 'admin';
  const isDispatcher = user?.role === 'dispatcher' || user?.role === 'admin';

  const value = {
    user,
    accessToken,
    isAuthenticated,
    isAdmin,
    isDispatcher,
    isLoading,
    register,
    login,
    logout,
    rotateToken,
    setUser,
    setAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth AuthProvider ichida ishlatilishi kerak');
  }
  return context;
};

export default AuthContext;

