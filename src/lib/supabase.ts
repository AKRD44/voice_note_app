import { createClient } from '@supabase/supabase-js';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from '@env';

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.\n' +
    'Required: SUPABASE_URL, SUPABASE_ANON_KEY'
  );
}

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Auto-refresh tokens
    autoRefreshToken: true,
    // Persist session in secure storage
    persistSession: true,
    // Detect session from URL (for OAuth callbacks)
    detectSessionInUrl: true,
    // Storage will be configured in AuthContext
    storage: undefined,
  },
  // Configure realtime for data sync
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database types (will be generated from Supabase later)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          subscription_tier: 'free' | 'premium';
          subscription_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      recordings: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          audio_url: string;
          original_transcript: string | null;
          enhanced_transcript: string | null;
          language: string;
          style: 'note' | 'email' | 'blog' | 'summary' | 'transcript' | 'custom';
          duration: number;
          word_count: number | null;
          character_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['recordings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['recordings']['Insert']>;
      };
      folders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['folders']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['folders']['Insert']>;
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string | null;
        };
        Insert: Omit<Database['public']['Tables']['tags']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['tags']['Insert']>;
      };
    };
  };
};

// Helper functions for common operations

/**
 * Get the current authenticated user
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

/**
 * Get the current session
 */
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Get user profile
 */
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: Database['public']['Tables']['profiles']['Update']
) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Get user recordings with optional filters
 */
export const getUserRecordings = async (
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    folderId?: string;
    tags?: string[];
    searchQuery?: string;
  }
) => {
  let query = supabase
    .from('recordings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  if (options?.searchQuery) {
    query = query.or(
      `title.ilike.%${options.searchQuery}%,` +
      `original_transcript.ilike.%${options.searchQuery}%,` +
      `enhanced_transcript.ilike.%${options.searchQuery}%`
    );
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return data;
};

/**
 * Create a new recording
 */
export const createRecording = async (
  recording: Database['public']['Tables']['recordings']['Insert']
) => {
  const { data, error } = await supabase
    .from('recordings')
    .insert(recording)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Update a recording
 */
export const updateRecording = async (
  recordingId: string,
  updates: Database['public']['Tables']['recordings']['Update']
) => {
  const { data, error } = await supabase
    .from('recordings')
    .update(updates)
    .eq('id', recordingId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Delete a recording
 */
export const deleteRecording = async (recordingId: string) => {
  const { error } = await supabase
    .from('recordings')
    .delete()
    .eq('id', recordingId);
  
  if (error) throw error;
};

/**
 * Upload audio file to Supabase Storage
 */
export const uploadAudioFile = async (
  userId: string,
  recordingId: string,
  audioFile: Blob | File,
  onProgress?: (progress: number) => void
) => {
  const filePath = `${userId}/${recordingId}.m4a`;
  
  const { data, error } = await supabase.storage
    .from('audio-recordings')
    .upload(filePath, audioFile, {
      cacheControl: '3600',
      upsert: false,
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('audio-recordings')
    .getPublicUrl(filePath);
  
  return {
    path: data.path,
    url: urlData.publicUrl,
  };
};

/**
 * Delete audio file from Supabase Storage
 */
export const deleteAudioFile = async (filePath: string) => {
  const { error } = await supabase.storage
    .from('audio-recordings')
    .remove([filePath]);
  
  if (error) throw error;
};

/**
 * Get download URL for audio file
 */
export const getAudioDownloadUrl = async (filePath: string) => {
  const { data, error } = await supabase.storage
    .from('audio-recordings')
    .createSignedUrl(filePath, 3600); // 1 hour expiry
  
  if (error) throw error;
  return data.signedUrl;
};

export default supabase;

