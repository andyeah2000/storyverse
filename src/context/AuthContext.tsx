import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  plan: 'free' | 'pro';
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSupabaseMode: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// HELPER: Convert Supabase User to App User
// ============================================

const supabaseUserToAppUser = (user: SupabaseUser): User => ({
  id: user.id,
  email: user.email || '',
  name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
  avatar: user.user_metadata?.avatar_url,
  createdAt: user.created_at,
  plan: user.user_metadata?.plan || 'free',
});

// ============================================
// LOCAL STORAGE FALLBACK (Development Only)
// ============================================

const LOCAL_KEYS = {
  USER: 'storyverse_user',
  USERS: 'storyverse_users',
  SESSION: 'storyverse_session',
};

const generateId = () => crypto.randomUUID?.() || Math.random().toString(36).substring(2) + Date.now().toString(36);

// Secure password hashing for local dev (NOT for production!)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'storyverse_local_salt_dev_only');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const getLocalUsers = (): Record<string, { password: string; user: User }> => {
  try {
    const data = localStorage.getItem(LOCAL_KEYS.USERS);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const saveLocalUsers = (users: Record<string, { password: string; user: User }>) => {
  localStorage.setItem(LOCAL_KEYS.USERS, JSON.stringify(users));
};

// ============================================
// AUTH PROVIDER
// ============================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isSupabaseMode: isSupabaseConfigured(),
  });

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    const initAuth = async () => {
      if (isSupabaseConfigured()) {
        // SUPABASE MODE
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            setState({
              user: supabaseUserToAppUser(session.user),
              isLoading: false,
              isAuthenticated: true,
              isSupabaseMode: true,
            });
          } else {
            setState(s => ({ ...s, isLoading: false, isSupabaseMode: true }));
          }

          // Listen for auth changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
              if (session?.user) {
                setState({
                  user: supabaseUserToAppUser(session.user),
                  isLoading: false,
                  isAuthenticated: true,
                  isSupabaseMode: true,
                });
              } else {
                setState({
                  user: null,
                  isLoading: false,
                  isAuthenticated: false,
                  isSupabaseMode: true,
                });
              }
            }
          );

          return () => subscription.unsubscribe();
        } catch (error) {
          console.error('Supabase auth init error:', error);
          setState(s => ({ ...s, isLoading: false }));
        }
      } else {
        // LOCAL MODE (Development)
        try {
          const sessionData = localStorage.getItem(LOCAL_KEYS.SESSION);
          if (sessionData) {
            const { userId, expiresAt } = JSON.parse(sessionData);
            
            if (new Date(expiresAt) > new Date()) {
              const users = getLocalUsers();
              const userData = Object.values(users).find(u => u.user.id === userId);
              
              if (userData) {
                setState({
                  user: userData.user,
                  isLoading: false,
                  isAuthenticated: true,
                  isSupabaseMode: false,
                });
                return;
              }
            }
            localStorage.removeItem(LOCAL_KEYS.SESSION);
          }
        } catch (e) {
          console.error('Local auth check failed:', e);
        }
        
        setState(s => ({ ...s, isLoading: false, isSupabaseMode: false }));
      }
    };

    initAuth();
  }, []);

  // ============================================
  // LOGIN
  // ============================================

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured()) {
      // SUPABASE
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          return { success: false, error: error.message };
        }
        
        if (data.user) {
          setState({
            user: supabaseUserToAppUser(data.user),
            isLoading: false,
            isAuthenticated: true,
            isSupabaseMode: true,
          });
          return { success: true };
        }
        
        return { success: false, error: 'Login failed' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    } else {
      // LOCAL
      try {
        const users = getLocalUsers();
        const normalizedEmail = email.toLowerCase().trim();
        const userData = users[normalizedEmail];
        
        if (!userData) {
          return { success: false, error: 'No account found with this email' };
        }
        
        const hashedPassword = await hashPassword(password);
        if (userData.password !== hashedPassword) {
          return { success: false, error: 'Invalid password' };
        }
        
        // Create session
        const session = {
          userId: userData.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        };
        localStorage.setItem(LOCAL_KEYS.SESSION, JSON.stringify(session));
        
        setState({
          user: userData.user,
          isLoading: false,
          isAuthenticated: true,
          isSupabaseMode: false,
        });
        
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }
  }, []);

  // ============================================
  // SIGNUP
  // ============================================

  const signup = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured()) {
      // SUPABASE
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, plan: 'free' },
          },
        });
        
        if (error) {
          return { success: false, error: error.message };
        }
        
        if (data.user) {
          // Check if email confirmation is required
          if (data.session) {
            setState({
              user: supabaseUserToAppUser(data.user),
              isLoading: false,
              isAuthenticated: true,
              isSupabaseMode: true,
            });
          }
          return { success: true };
        }
        
        return { success: false, error: 'Signup failed' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    } else {
      // LOCAL
      try {
        const users = getLocalUsers();
        const normalizedEmail = email.toLowerCase().trim();
        
        if (users[normalizedEmail]) {
          return { success: false, error: 'An account with this email already exists' };
        }
        
        const hashedPassword = await hashPassword(password);
        const newUser: User = {
          id: generateId(),
          email: normalizedEmail,
          name: name.trim(),
          createdAt: new Date().toISOString(),
          plan: 'free',
        };
        
        users[normalizedEmail] = { password: hashedPassword, user: newUser };
        saveLocalUsers(users);
        
        // Auto-login
        const session = {
          userId: newUser.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
        localStorage.setItem(LOCAL_KEYS.SESSION, JSON.stringify(session));
        
        setState({
          user: newUser,
          isLoading: false,
          isAuthenticated: true,
          isSupabaseMode: false,
        });
        
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }
  }, []);

  // ============================================
  // LOGOUT
  // ============================================

  const logout = useCallback(async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem(LOCAL_KEYS.SESSION);
    }
    
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isSupabaseMode: isSupabaseConfigured(),
    });
  }, []);

  // ============================================
  // FORGOT PASSWORD
  // ============================================

  const forgotPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        
        if (error) {
          return { success: false, error: error.message };
        }
        
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    } else {
      // Local mode - just simulate success
      return { success: true };
    }
  }, []);

  // ============================================
  // RESET PASSWORD
  // ============================================

  const resetPassword = useCallback(async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured()) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          return { success: false, error: 'Reset link is invalid or has expired. Please request a new one.' };
        }

        const { error } = await supabase.auth.updateUser({ password });
        
        if (error) {
          return { success: false, error: error.message };
        }
        
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    } else {
      return { success: true };
    }
  }, []);

  // ============================================
  // UPDATE PROFILE
  // ============================================

  const updateProfile = useCallback(async (data: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!state.user) {
      return { success: false, error: 'Not authenticated' };
    }

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.updateUser({
          data: { name: data.name, avatar_url: data.avatar },
        });
        
        if (error) {
          return { success: false, error: error.message };
        }
        
        setState(s => ({
          ...s,
          user: s.user ? { ...s.user, ...data } : null,
        }));
        
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    } else {
      // Local
      const users = getLocalUsers();
      const userEntry = Object.entries(users).find(([_, v]) => v.user.id === state.user!.id);
      
      if (userEntry) {
        const [email, userData] = userEntry;
        users[email] = { ...userData, user: { ...userData.user, ...data } };
        saveLocalUsers(users);
        
        setState(s => ({
          ...s,
          user: s.user ? { ...s.user, ...data } : null,
        }));
      }
      
      return { success: true };
    }
  }, [state.user]);

  // ============================================
  // UPDATE PASSWORD
  // ============================================

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!state.user) {
      return { success: false, error: 'Not authenticated' };
    }

    if (isSupabaseConfigured()) {
      try {
        // Verify current password by re-signing in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: state.user.email,
          password: currentPassword,
        });
        
        if (signInError) {
          return { success: false, error: 'Current password is incorrect' };
        }
        
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        
        if (error) {
          return { success: false, error: error.message };
        }
        
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    } else {
      // Local
      const users = getLocalUsers();
      const userEntry = Object.entries(users).find(([_, v]) => v.user.id === state.user!.id);
      
      if (userEntry) {
        const [email, userData] = userEntry;
        const hashedCurrent = await hashPassword(currentPassword);
        
        if (userData.password !== hashedCurrent) {
          return { success: false, error: 'Current password is incorrect' };
        }
        
        const hashedNew = await hashPassword(newPassword);
        users[email] = { ...userData, password: hashedNew };
        saveLocalUsers(users);
      }
      
      return { success: true };
    }
  }, [state.user]);

  // ============================================
  // DELETE ACCOUNT
  // ============================================

  const deleteAccount = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!state.user) {
      return { success: false, error: 'Not authenticated' };
    }

    if (isSupabaseConfigured()) {
      try {
        // Get session for JWT token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          return { success: false, error: 'Not authenticated' };
        }

        // Call edge function to delete user account
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const response = await fetch(`${supabaseUrl}/functions/v1/manage-user/delete-user`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: state.user.id }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to delete account' }));
          return { success: false, error: errorData.error || 'Failed to delete account' };
        }

        // Sign out after successful deletion
        await supabase.auth.signOut();
        
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          isSupabaseMode: true,
        });
        
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    } else {
      // Local
      const users = getLocalUsers();
      const userEntry = Object.entries(users).find(([_, v]) => v.user.id === state.user!.id);
      
      if (userEntry) {
        delete users[userEntry[0]];
        saveLocalUsers(users);
      }
      
      localStorage.removeItem(LOCAL_KEYS.SESSION);
      
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isSupabaseMode: false,
      });
      
      return { success: true };
    }
  }, [state.user]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    updatePassword,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================
// HOOK
// ============================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
