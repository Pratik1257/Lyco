import React, { createContext, useContext, useState, useEffect } from 'react';
import { type LoginResponse } from '../api/authApi';

interface AuthContextType {
  user: LoginResponse | null;
  login: (userData: LoginResponse) => void;
  logout: () => void;
  updateUser: (userData: Partial<LoginResponse>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('lyco_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        
        // Simple JWT expiration check
        if (parsedUser.token) {
          try {
            const base64Url = parsedUser.token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));
            const isExpired = payload.exp * 1000 < Date.now();
            
            if (isExpired) {
              console.warn('Session expired on load');
              localStorage.removeItem('lyco_user');
              setUser(null);
            } else {
              setUser(parsedUser);
            }
          } catch (e) {
            console.error('Error parsing token payload', e);
            setUser(parsedUser); // Fallback to current behavior if parse fails
          }
        } else {
          setUser(parsedUser);
        }
      } catch (e) {
        localStorage.removeItem('lyco_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: LoginResponse) => {
    setUser(userData);
    localStorage.setItem('lyco_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lyco_user');
    
    // Reset dashboard animations on logout
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('countup_done_') || key === 'countup_global_done') {
        sessionStorage.removeItem(key);
      }
    });
  };

  const updateUser = (userData: Partial<LoginResponse>) => {
    if (!user) return;
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('lyco_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
