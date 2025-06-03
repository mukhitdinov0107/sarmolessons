"use client";

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { User } from '@/lib/types';
import { AuthService } from '@/lib/services/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, telegramUsername?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<Pick<User, 'firstName' | 'lastName' | 'telegramUsername' | 'photoURL'>>) => Promise<{ success: boolean; error?: string }>;
  updatePreferences: (preferences: Partial<User['preferences']>) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await AuthService.signIn(email, password);
    if (result.success && result.data) {
      setUser(result.data);
    }
    return result;
  };

  const signUp = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    telegramUsername?: string
  ) => {
    const result = await AuthService.register(email, password, firstName, lastName, telegramUsername);
    if (result.success && result.data) {
      setUser(result.data);
    }
    return result;
  };

  const signOut = async () => {
    const result = await AuthService.signOut();
    if (result.success) {
      setUser(null);
    }
    return result;
  };

  const updateProfile = async (updates: Partial<Pick<User, 'firstName' | 'lastName' | 'telegramUsername' | 'photoURL'>>) => {
    const result = await AuthService.updateProfile(updates);
    if (result.success && result.data) {
      setUser(result.data);
    }
    return result;
  };

  const updatePreferences = async (preferences: Partial<User['preferences']>) => {
    const result = await AuthService.updatePreferences(preferences);
    if (result.success && result.data) {
      setUser(result.data);
    }
    return result;
  };

  const resetPassword = async (email: string) => {
    return await AuthService.resetPassword(email);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    return await AuthService.changePassword(currentPassword, newPassword);
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updatePreferences,
    resetPassword,
    changePassword
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