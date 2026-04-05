import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

interface AuthContextType {
  user: any;
  isLoadingAuth: boolean;
  login: (data: any) => Promise<void>;
  registerFlow: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    // Implicitly check backend on load
    authApi.getProfile()
      .then((data) => setUser(data))
      .catch((err) => {
        // If 401 Unauthorized, we just set user to null (not an error to log globally)
        setUser(null);
      })
      .finally(() => setIsLoadingAuth(false));
  }, []);

  const login = async (data: any) => {
    const res = await authApi.login(data);
    setUser(res.user);
    localStorage.setItem('bide_user', JSON.stringify(res.user)); // Optional fallback
  };

  const registerFlow = async (data: any) => {
    await authApi.register(data);
    const profile = await authApi.getProfile();
    setUser(profile);
    localStorage.setItem('bide_user', JSON.stringify(profile));
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {} // ignore if already invalid server side
    setUser(null);
    localStorage.removeItem('bide_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoadingAuth, login, registerFlow, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
