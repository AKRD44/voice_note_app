-- VoiceFlow Database Schema
-- Migration 001: Initial Schema Setup
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Extends auth.users with additional profile information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Add comment
COMMENT ON TABLE public.profiles IS 'User profile information extending auth.users';

-- ============================================================================
-- RECORDINGS TABLE  
-- ============================================================================
-- Stores voice recordings and their transcripts
CREATE TABLE IF NOT EXISTS public.recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  original_transcript TEXT,
  enhanced_transcript TEXT,
  language TEXT DEFAULT 'en-US' NOT NULL,
  style TEXT DEFAULT 'note' CHECK (style IN ('note', 'email', 'blog', 'summary', 'transcript', 'custom')),
  duration INTEGER NOT NULL, -- in seconds
  word_count INTEGER,
  character_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for recordings
CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON public.recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_recordings_created_at ON public.recordings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recordings_language ON public.recordings(language);
CREATE INDEX IF NOT EXISTS idx_recordings_style ON public.recordings(style);
CREATE INDEX IF NOT EXISTS idx_recordings_user_created ON public.recordings(user_id, created_at DESC);

-- Full-text search index for recordings
CREATE INDEX IF NOT EXISTS idx_recordings_title_search ON public.recordings USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_recordings_transcript_search ON public.recordings USING gin(to_tsvector('english', coalesce(original_transcript, '') || ' ' || coalesce(enhanced_transcript, '')));

-- Add comment
COMMENT ON TABLE public.recordings IS 'Voice recordings with AI-enhanced transcripts';

-- ============================================================================
-- FOLDERS TABLE
-- ============================================================================
-- User-created folders for organizing recordings
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT, -- Hex color code
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, name)
);

-- Add indexes for folders
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_created_at ON public.folders(created_at DESC);

-- Add comment
COMMENT ON TABLE public.folders IS 'User-created folders for organizing recordings';

-- ============================================================================
-- TAGS TABLE
-- ============================================================================
-- User-created tags for flexible organization
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT, -- Hex color code
  UNIQUE(user_id, name)
);

-- Add indexes for tags
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);

-- Add comment
COMMENT ON TABLE public.tags IS 'User-created tags for categorizing recordings';

-- ============================================================================
-- RECORDING_FOLDERS TABLE (Junction)
-- ============================================================================
-- Many-to-many relationship between recordings and folders
CREATE TABLE IF NOT EXISTS public.recording_folders (
  recording_id UUID NOT NULL REFERENCES public.recordings(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  PRIMARY KEY (recording_id, folder_id)
);

-- Add indexes for junction table
CREATE INDEX IF NOT EXISTS idx_recording_folders_recording_id ON public.recording_folders(recording_id);
CREATE INDEX IF NOT EXISTS idx_recording_folders_folder_id ON public.recording_folders(folder_id);

-- Add comment
COMMENT ON TABLE public.recording_folders IS 'Junction table linking recordings to folders';

-- ============================================================================
-- RECORDING_TAGS TABLE (Junction)
-- ============================================================================
-- Many-to-many relationship between recordings and tags
CREATE TABLE IF NOT EXISTS public.recording_tags (
  recording_id UUID NOT NULL REFERENCES public.recordings(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recording_id, tag_id)
);

-- Add indexes for junction table
CREATE INDEX IF NOT EXISTS idx_recording_tags_recording_id ON public.recording_tags(recording_id);
CREATE INDEX IF NOT EXISTS idx_recording_tags_tag_id ON public.recording_tags(tag_id);

-- Add comment
COMMENT ON TABLE public.recording_tags IS 'Junction table linking recordings to tags';

-- ============================================================================
-- SHARED_RECORDINGS TABLE
-- ============================================================================
-- Shareable links for recordings
CREATE TABLE IF NOT EXISTS public.shared_recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recording_id UUID NOT NULL REFERENCES public.recordings(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for shared recordings
CREATE INDEX IF NOT EXISTS idx_shared_recordings_recording_id ON public.shared_recordings(recording_id);
CREATE INDEX IF NOT EXISTS idx_shared_recordings_share_token ON public.shared_recordings(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_recordings_expires_at ON public.shared_recordings(expires_at);

-- Add comment
COMMENT ON TABLE public.shared_recordings IS 'Publicly shareable links for recordings';

-- ============================================================================
-- USAGE_STATS TABLE
-- ============================================================================
-- Track monthly usage for subscription limits
CREATE TABLE IF NOT EXISTS public.usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of the month
  recording_minutes INTEGER DEFAULT 0 NOT NULL,
  api_calls INTEGER DEFAULT 0 NOT NULL,
  storage_bytes BIGINT DEFAULT 0 NOT NULL,
  UNIQUE(user_id, month)
);

-- Add indexes for usage stats
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_id ON public.usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_stats_month ON public.usage_stats(month DESC);
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_month ON public.usage_stats(user_id, month DESC);

-- Add comment
COMMENT ON TABLE public.usage_stats IS 'Monthly usage tracking for subscription enforcement';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at on tables that need it
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recordings_updated_at
  BEFORE UPDATE ON public.recordings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile automatically on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Database schema created successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run migration 002 for RLS policies';
  RAISE NOTICE '2. Set up storage bucket for audio files';
  RAISE NOTICE '3. Configure authentication providers';
END $$;

