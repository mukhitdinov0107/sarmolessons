"use client";

import { useState, useEffect, useContext, createContext } from 'react';
import { User } from '@/lib/types';
import { AuthService } from '@/lib/services/auth';
import { sessionManager } from '@/lib/utils/cookies';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, telegramUsername?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, 'firstName' | 'lastName' | 'telegramUsername' | 'photoURL'>>) => Promise<{ success: boolean; error?: string; message?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Check session validity on mount
  useEffect(() => {
    const checkSession = async () => {
      const sessionUserId = sessionManager.getUserSession();
      const lastActivity = sessionManager.getLastActivity();
      
      // If session expired (older than 24 hours), clear it
      if (lastActivity && Date.now() - lastActivity > 24 * 60 * 60 * 1000) {
        sessionManager.clearUserSession();
        await AuthService.signOut();
      } else if (sessionUserId && !user) {
        // Session exists but user not loaded, try to get current user
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          sessionManager.clearUserSession();
        }
      }
      setLoading(false);
    };

    checkSession();
  }, [user]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await AuthService.signIn(email, password);
      
      if (result.success && result.data) {
        setUser(result.data);
        return { success: true, message: result.message };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Kirishda xatolik yuz berdi' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    telegramUsername?: string
  ) => {
    setLoading(true);
    try {
      const result = await AuthService.register(email, password, firstName, lastName, telegramUsername);
      
      if (result.success && result.data) {
        setUser(result.data);
        return { success: true, message: result.message };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Ro\'yxatdan o\'tishda xatolik yuz berdi' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await AuthService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Pick<User, 'firstName' | 'lastName' | 'telegramUsername' | 'photoURL'>>) => {
    try {
      const result = await AuthService.updateProfile(updates);
      
      if (result.success && result.data) {
        setUser(result.data);
        return { success: true, message: result.message };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Profilni yangilashda xatolik yuz berdi' };
    }
  };

  const refreshUser = async () => {
    if (user) {
      const updatedUser = await AuthService.getCurrentUser();
      if (updatedUser) {
        setUser(updatedUser);
      }
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
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

// Simple hook for components that just need to check auth state
export function useAuthState() {
  const { user, loading } = useAuth();
  return { user, loading, isAuthenticated: !!user };
} 