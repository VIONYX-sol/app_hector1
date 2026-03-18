/**
 * Authentication context for admin users.
 * Provides secure authentication state management using httpOnly cookies.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await adminApi.getMe();
        setUser(userData);
      } catch {
        // Not authenticated - this is normal for public pages
        setUser(null);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      const response = await adminApi.login(email, password);
      setUser(response.user);
      return response;
    } catch (err) {
      setAuthError(err.message || 'Error al iniciar sesión');
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      setUser(null);
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoadingAuth,
    authError,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Protected Route wrapper for admin pages.
 * Redirects to login if not authenticated.
 */
export function RequireAuth({ children }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      navigate('/admin/login', { replace: true });
    }
  }, [isLoadingAuth, isAuthenticated, navigate]);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
