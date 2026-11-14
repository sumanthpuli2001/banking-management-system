import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { UserProfile, RoleType, LoginResponseData, ApiResponse } from '../types/auth';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (data: LoginResponseData) => void;
  logout: () => void;
  hasRole: (roles: RoleType | RoleType[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('apex_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('apex_access_token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('apex_access_token');
      if (storedToken) {
        try {
          const res = await api.get<ApiResponse<UserProfile>>('/auth/me');
          if (res.data.success && res.data.data) {
            setUser(res.data.data);
            localStorage.setItem('apex_user', JSON.stringify(res.data.data));
          }
        } catch {
          // Token invalid or expired
          logout();
        }
      }
      setLoading(false);
    };

    verifySession();
  }, []);

  const login = (data: LoginResponseData) => {
    localStorage.setItem('apex_access_token', data.accessToken);
    localStorage.setItem('apex_refresh_token', data.refreshToken);
    setToken(data.accessToken);

    const userProfile: UserProfile = {
      id: data.userId,
      username: data.username,
      email: data.email,
      fullName: data.fullName,
      active: true,
      branchId: data.branchId,
      branchCode: data.branchCode,
      branchName: data.branchName,
      isHeadOffice: data.isHeadOffice,
      roles: data.roles,
      permissions: data.permissions,
    };

    setUser(userProfile);
    localStorage.setItem('apex_user', JSON.stringify(userProfile));
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch {
      // Ignore network fail on logout
    } finally {
      localStorage.removeItem('apex_access_token');
      localStorage.removeItem('apex_refresh_token');
      localStorage.removeItem('apex_user');
      setUser(null);
      setToken(null);
    }
  };

  const hasRole = (roles: RoleType | RoleType[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.some((r) => user.roles.includes(r));
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission) || user.roles.includes('SUPER_ADMIN');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole, hasPermission }}>
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
