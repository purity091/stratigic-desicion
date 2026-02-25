import React, { useState, useEffect } from 'react';

const STORAGE_KEY_AUTH = 'simulator_auth';
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin123';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (newPassword: string) => boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    username: null
  });

  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem(STORAGE_KEY_AUTH);
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed.isAuthenticated) {
          setAuthState(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load auth state', e);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const storedPassword = localStorage.getItem('simulator_password') || DEFAULT_PASSWORD;
    
    if (username === DEFAULT_USERNAME && password === storedPassword) {
      const newState = {
        isAuthenticated: true,
        username
      };
      setAuthState(newState);
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(newState));
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      username: null
    });
    localStorage.removeItem(STORAGE_KEY_AUTH);
  };

  const changePassword = (newPassword: string): boolean => {
    try {
      localStorage.setItem('simulator_password', newPassword);
      return true;
    } catch (e) {
      console.error('Failed to change password', e);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
