import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const auth = JSON.parse(localStorage.getItem('trayva-auth') || '{}');

      if (!auth.token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/account/profile');
        setUser(response.data.data);
      } catch (error) {
        console.error('Failed to load user:', error);
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = (userData, token, refreshToken) => {
    localStorage.setItem('trayva-auth', JSON.stringify({ token, refreshToken, user: userData }));
    setUser(userData);
  };

  // Clear local state and redirect
  const clearSession = () => {
    localStorage.clear();
    setUser(null);
    window.location.href = '/auth/login';
  };

  // Logout from current device
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Logout locally regardless of API success or failure
      console.error('Logout API error:', error);
    } finally {
      clearSession();
    }
  };

  // Logout from all devicesa
  const logoutAll = async () => {
    try {
      await api.post('/auth/logout-all');
    } catch (error) {
      console.error('Logout all API error:', error);
    } finally {
      clearSession();
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    const auth = JSON.parse(localStorage.getItem('trayva-auth') || '{}');
    localStorage.setItem('trayva-auth', JSON.stringify({ ...auth, user: userData }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, logoutAll, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};