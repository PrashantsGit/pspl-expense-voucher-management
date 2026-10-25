import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await authApi.getProfile();
          setUser((prev) => ({ ...prev, ...res.data }));
          localStorage.setItem('user', JSON.stringify({ ...user, ...res.data }));
        } catch (err) {
          console.error('Session expired or invalid', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (username, password) => {
    const response = await authApi.login(username, password);
    const data = response.data;
    const userData = {
      id: data.id,
      username: data.username,
      fullName: data.fullName,
      employeeId: data.employeeId,
      department: data.department,
      role: data.role,
    };
    setToken(data.token);
    setUser(userData);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isEmployee = user?.role === 'ROLE_EMPLOYEE';
  const isDirector = user?.role === 'ROLE_DIRECTOR';
  const isAccounts = user?.role === 'ROLE_ACCOUNTS';

  const getDashboardRoute = () => {
    if (isDirector) return '/director/dashboard';
    if (isAccounts) return '/accounts/dashboard';
    return '/employee/dashboard';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        isEmployee,
        isDirector,
        isAccounts,
        getDashboardRoute,
      }}
    >
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
