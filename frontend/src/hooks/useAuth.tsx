import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '@/services/authService';
import { LoginDto, RegisterDto, User } from '@/types/auth'; // Ensure path is correct
import api from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (data: LoginDto) => Promise<{ error: Error | null }>;
  signInWithGoogle: (token: string) => Promise<{ error: Error | null }>;
  signUp: (data: RegisterDto) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const profile = await authService.getProfile();
          setUser(profile);
          checkAdminRole(profile);
        } catch (error) {
          console.error('Failed to strict auth', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const checkAdminRole = (user: User) => {
    const admin = user.roles.includes('admin');
    setIsAdmin(admin);
  };

  const signIn = async (data: LoginDto) => {
    try {
      const response = await authService.login(data);
      localStorage.setItem('token', response.access_token);
      setUser(response.user);
      checkAdminRole(response.user);
      return { error: null };
    } catch (err: any) {
      return { error: err.response?.data?.message || err.message };
    }
  };

  const signInWithGoogle = async (token: string) => {
    try {
      const response = await authService.loginWithGoogle(token);
      localStorage.setItem('token', response.access_token);
      setUser(response.user);
      checkAdminRole(response.user);
      return { error: null };
    } catch (err: any) {
      return { error: err.response?.data?.message || err.message };
    }
  };

  const signUp = async (data: RegisterDto) => {
    try {
      const response = await authService.register(data);
      localStorage.setItem('token', response.access_token);
      setUser(response.user);
      checkAdminRole(response.user);
      return { error: null };
    } catch (err: any) {
      return { error: err.response?.data?.message || err.message };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signIn, signInWithGoogle, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
