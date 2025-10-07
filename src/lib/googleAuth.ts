import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import {
  GOOGLE_OAUTH_CLIENT_ID_IOS,
  GOOGLE_OAUTH_CLIENT_ID_ANDROID,
  GOOGLE_OAUTH_WEB_CLIENT_ID,
} from '@env';
import { supabase } from './supabase';

// Complete the WebBrowser authentication session
// This is required for the authentication flow to work properly
WebBrowser.maybeCompleteAuthSession();

/**
 * Google OAuth Configuration for Expo
 * Uses expo-auth-session for cross-platform OAuth support
 */

// Validate environment variables
const validateGoogleOAuthConfig = () => {
  const missingVars: string[] = [];
  
  if (!GOOGLE_OAUTH_CLIENT_ID_IOS) missingVars.push('GOOGLE_OAUTH_CLIENT_ID_IOS');
  if (!GOOGLE_OAUTH_CLIENT_ID_ANDROID) missingVars.push('GOOGLE_OAUTH_CLIENT_ID_ANDROID');
  if (!GOOGLE_OAUTH_WEB_CLIENT_ID) missingVars.push('GOOGLE_OAUTH_WEB_CLIENT_ID');
  
  if (missingVars.length > 0) {
    console.warn(
      `Missing Google OAuth environment variables: ${missingVars.join(', ')}\n` +
      'Google Sign-In may not work correctly. Please check your .env file.'
    );
    return false;
  }
  
  return true;
};

/**
 * Hook to handle Google OAuth authentication
 * @returns Google authentication request, response, and prompt function
 */
export const useGoogleAuth = () => {
  validateGoogleOAuthConfig();

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_OAUTH_CLIENT_ID_IOS,
    androidClientId: GOOGLE_OAUTH_CLIENT_ID_ANDROID,
    webClientId: GOOGLE_OAUTH_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
    redirectUri: makeRedirectUri({
      scheme: 'voiceflow', // This should match your app's custom scheme in app.json
      path: 'auth/callback',
    }),
  });

  return {
    request,
    response,
    promptAsync,
  };
};

/**
 * Sign in with Google using Supabase Auth
 * @param idToken - The ID token from Google OAuth
 * @param accessToken - The access token from Google OAuth
 * @returns Supabase session
 */
export const signInWithGoogle = async (
  idToken: string,
  accessToken: string
) => {
  try {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
      access_token: accessToken,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Failed to sign in with Google') 
    };
  }
};

/**
 * Handle Google OAuth response
 * This should be called when the OAuth response is received
 * @param response - The response from Google OAuth
 * @returns Supabase session or error
 */
export const handleGoogleOAuthResponse = async (
  response: Google.GoogleAuthSessionResult
) => {
  if (response?.type === 'success') {
    const { authentication } = response;
    
    if (!authentication) {
      return { 
        data: null, 
        error: new Error('No authentication data received') 
      };
    }

    // Sign in with Supabase using the Google tokens
    return await signInWithGoogle(
      authentication.idToken!,
      authentication.accessToken
    );
  } else if (response?.type === 'error') {
    console.error('Google OAuth error:', response.error);
    return { 
      data: null, 
      error: new Error(response.error?.message || 'OAuth failed') 
    };
  } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
    return { 
      data: null, 
      error: new Error('Sign-in cancelled by user') 
    };
  }

  return { 
    data: null, 
    error: new Error('Unexpected OAuth response') 
  };
};

/**
 * Alternative: Sign in with Google using Supabase's built-in OAuth
 * This uses Supabase's OAuth flow which handles everything
 * Note: This opens a WebBrowser and is simpler but less customizable
 */
export const signInWithGoogleSupabase = async () => {
  try {
    const redirectUrl = makeRedirectUri({
      scheme: 'voiceflow',
      path: 'auth/callback',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        scopes: 'email profile',
        skipBrowserRedirect: false,
      },
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error with Supabase Google OAuth:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Failed to sign in') 
    };
  }
};

/**
 * Sign out from Google (and Supabase)
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear any Google auth session
    await WebBrowser.dismissBrowser();
    
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { 
      error: error instanceof Error ? error : new Error('Failed to sign out') 
    };
  }
};

/**
 * Get current user info from Google
 * @param accessToken - Google access token
 * @returns User info from Google
 */
export const getGoogleUserInfo = async (accessToken: string) => {
  try {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo = await response.json();
    return { data: userInfo, error: null };
  } catch (error) {
    console.error('Error fetching Google user info:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Failed to fetch user info') 
    };
  }
};

/**
 * Error messages for common OAuth errors
 */
export const GoogleAuthErrors = {
  CANCELLED: 'Sign-in was cancelled',
  NETWORK_ERROR: 'Network error. Please check your connection',
  INVALID_CONFIG: 'Invalid Google OAuth configuration',
  TOKEN_EXCHANGE_FAILED: 'Failed to exchange tokens with Supabase',
  UNKNOWN: 'An unknown error occurred during sign-in',
} as const;

/**
 * Get user-friendly error message
 */
export const getGoogleAuthErrorMessage = (error: Error): string => {
  const message = error.message.toLowerCase();
  
  if (message.includes('cancel') || message.includes('dismiss')) {
    return GoogleAuthErrors.CANCELLED;
  }
  if (message.includes('network')) {
    return GoogleAuthErrors.NETWORK_ERROR;
  }
  if (message.includes('config') || message.includes('client')) {
    return GoogleAuthErrors.INVALID_CONFIG;
  }
  if (message.includes('token')) {
    return GoogleAuthErrors.TOKEN_EXCHANGE_FAILED;
  }
  
  return GoogleAuthErrors.UNKNOWN;
};

export default {
  useGoogleAuth,
  signInWithGoogle,
  handleGoogleOAuthResponse,
  signInWithGoogleSupabase,
  signOut,
  getGoogleUserInfo,
  getGoogleAuthErrorMessage,
};

