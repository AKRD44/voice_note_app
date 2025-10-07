/**
 * Authentication Context
 * Manages user authentication state and session persistence
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import * as Google from 'expo-auth-session/providers/google';
import { supabase, getUserProfile } from '../lib/supabase';
import { handleGoogleOAuthResponse, useGoogleAuth } from '../lib/googleAuth';

/**
 * User profile data
 */
export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'premium';
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Auth context state
 */
interface AuthContextState {
  // State
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  
  // Google OAuth
  googleRequest: Google.GoogleAuthRequestConfig | null;
  googlePromptAsync: (() => Promise<Google.GoogleAuthSessionResult>) | null;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

/**
 * Custom secure storage adapter for Supabase
 */
const SecureStoreAdapter = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

/**
 * Auth Provider Component
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Google OAuth hook
  const { request, response, promptAsync } = useGoogleAuth();

  // Configure Supabase to use secure storage
  useEffect(() => {
    (supabase.auth as any).storage = SecureStoreAdapter;
  }, []);

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  // Listen for Google OAuth response
  useEffect(() => {
    if (response) {
      handleGoogleResponse(response);
    }
  }, [response]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);

        setSession(session);
        setUser(session?.user ?? null);

        // Load or clear profile based on session
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setProfile(null);
        }

        // Handle specific events
        if (event === 'SIGNED_OUT') {
          await clearAuthData();
        }

        if (event === 'TOKEN_REFRESHED') {
          console.log('Session refreshed successfully');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  /**
   * Initialize authentication state on app start
   */
  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      // Try to restore session from secure storage
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error restoring session:', error);
        return;
      }

      if (session) {
        setSession(session);
        setUser(session.user);
        await loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load user profile from database
   */
  const loadUserProfile = async (userId: string) => {
    try {
      const profileData = await getUserProfile(userId);
      setProfile(profileData as UserProfile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Profile might not exist yet (new user)
      // It will be created by the database trigger
    }
  };

  /**
   * Handle Google OAuth response
   */
  const handleGoogleResponse = async (response: Google.GoogleAuthSessionResult) => {
    try {
      setIsLoading(true);

      const result = await handleGoogleOAuthResponse(response);

      if (result.error) {
        throw result.error;
      }

      if (result.data?.session) {
        setSession(result.data.session);
        setUser(result.data.session.user);
        await loadUserProfile(result.data.session.user.id);
      }
    } catch (error) {
      console.error('Error handling Google OAuth response:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in with Google
   */
  const signInWithGoogle = async () => {
    try {
      if (!promptAsync) {
        throw new Error('Google OAuth not initialized');
      }

      setIsLoading(true);
      await promptAsync();
      // Response will be handled by useEffect above
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setIsLoading(false);
      throw error;
    }
  };

  /**
   * Sign out current user
   */
  const signOut = async () => {
    try {
      setIsLoading(true);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      await clearAuthData();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear all authentication data
   */
  const clearAuthData = async () => {
    setUser(null);
    setProfile(null);
    setSession(null);

    // Clear secure storage
    try {
      await SecureStore.deleteItemAsync('supabase.auth.token');
    } catch (error) {
      console.error('Error clearing secure storage:', error);
    }
  };

  /**
   * Refresh the current session
   */
  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error) throw error;

      if (session) {
        setSession(session);
        setUser(session.user);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      throw error;
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      const { updateUserProfile } = await import('../lib/supabase');
      const updatedProfile = await updateUserProfile(user.id, updates);
      setProfile(updatedProfile as UserProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value: AuthContextState = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signOut,
    refreshSession,
    updateProfile,
    googleRequest: request,
    googlePromptAsync: promptAsync,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use authentication context
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextState => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * HOC to require authentication
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return null; // Or loading component
    }

    if (!isAuthenticated) {
      return null; // Or redirect to login
    }

    return <Component {...props} />;
  };
};

export default AuthContext;

