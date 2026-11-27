import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser, IPostOffice, UserRole } from '@postmate/shared';
import { apiFetch } from '../services/api';

interface AuthContextType {
  token: string | null;
  user: IUser | null;
  office: IPostOffice | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (employeeId: string, password?: string) => Promise<boolean>;
  quickLogin: (role: 'POSTMASTER' | 'POSTAL_STAFF' | 'DELIVERY' | 'ADMIN') => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('postmate_token'));
  const [user, setUser] = useState<IUser | null>(() => {
    const saved = localStorage.getItem('postmate_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [office, setOffice] = useState<IPostOffice | null>(() => {
    const saved = localStorage.getItem('postmate_office');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // If token exists, verify session or initialize default
    if (token && !user) {
      quickLogin('POSTMASTER').finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (employeeId: string, password = 'password123'): Promise<boolean> => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, password })
      });
      const data = await res.json();
      if (data.success && data.token) {
        setToken(data.token);
        setUser(data.user);
        setOffice(data.office);
        localStorage.setItem('postmate_token', data.token);
        localStorage.setItem('postmate_user', JSON.stringify(data.user));
        localStorage.setItem('postmate_office', JSON.stringify(data.office));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Login error:', e);
      return false;
    }
  };

  const quickLogin = async (role: 'POSTMASTER' | 'POSTAL_STAFF' | 'DELIVERY' | 'ADMIN'): Promise<boolean> => {
    let empId = 'PM600040';
    if (role === 'ADMIN') empId = 'ADMIN001';
    if (role === 'POSTAL_STAFF') empId = 'PA600041';
    if (role === 'DELIVERY') empId = 'PMTS600042';

    return login(empId, 'password123');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setOffice(null);
    localStorage.removeItem('postmate_token');
    localStorage.removeItem('postmate_user');
    localStorage.removeItem('postmate_office');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        office,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        quickLogin,
        logout
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
