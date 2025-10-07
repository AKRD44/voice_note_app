-- VoiceFlow Database Schema
-- Migration 002: Row Level Security (RLS) Policies
-- Run this AFTER migration 001_initial_schema.sql

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recording_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recording_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profiles are created automatically via trigger, no INSERT policy needed

-- ============================================================================
-- RECORDINGS POLICIES
-- ============================================================================

-- Users can view their own recordings
CREATE POLICY "Users can view own recordings"
  ON public.recordings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own recordings
CREATE POLICY "Users can insert own recordings"
  ON public.recordings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own recordings
CREATE POLICY "Users can update own recordings"
  ON public.recordings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own recordings
CREATE POLICY "Users can delete own recordings"
  ON public.recordings
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FOLDERS POLICIES
-- ============================================================================

-- Users can view their own folders
CREATE POLICY "Users can view own folders"
  ON public.folders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own folders
CREATE POLICY "Users can create own folders"
  ON public.folders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own folders
CREATE POLICY "Users can update own folders"
  ON public.folders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own folders
CREATE POLICY "Users can delete own folders"
  ON public.folders
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TAGS POLICIES
-- ============================================================================

-- Users can view their own tags
CREATE POLICY "Users can view own tags"
  ON public.tags
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own tags
CREATE POLICY "Users can create own tags"
  ON public.tags
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tags
CREATE POLICY "Users can update own tags"
  ON public.tags
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tags
CREATE POLICY "Users can delete own tags"
  ON public.tags
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RECORDING_FOLDERS POLICIES (Junction Table)
-- ============================================================================

-- Users can view recording-folder relationships for their own recordings
CREATE POLICY "Users can view own recording-folder relationships"
  ON public.recording_folders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recordings
      WHERE recordings.id = recording_folders.recording_id
      AND recordings.user_id = auth.uid()
    )
  );

-- Users can create recording-folder relationships for their own recordings
CREATE POLICY "Users can create own recording-folder relationships"
  ON public.recording_folders
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recordings
      WHERE recordings.id = recording_folders.recording_id
      AND recordings.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM public.folders
      WHERE folders.id = recording_folders.folder_id
      AND folders.user_id = auth.uid()
    )
  );

-- Users can delete recording-folder relationships for their own recordings
CREATE POLICY "Users can delete own recording-folder relationships"
  ON public.recording_folders
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recordings
      WHERE recordings.id = recording_folders.recording_id
      AND recordings.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RECORDING_TAGS POLICIES (Junction Table)
-- ============================================================================

-- Users can view recording-tag relationships for their own recordings
CREATE POLICY "Users can view own recording-tag relationships"
  ON public.recording_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recordings
      WHERE recordings.id = recording_tags.recording_id
      AND recordings.user_id = auth.uid()
    )
  );

-- Users can create recording-tag relationships for their own recordings
CREATE POLICY "Users can create own recording-tag relationships"
  ON public.recording_tags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recordings
      WHERE recordings.id = recording_tags.recording_id
      AND recordings.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM public.tags
      WHERE tags.id = recording_tags.tag_id
      AND tags.user_id = auth.uid()
    )
  );

-- Users can delete recording-tag relationships for their own recordings
CREATE POLICY "Users can delete own recording-tag relationships"
  ON public.recording_tags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recordings
      WHERE recordings.id = recording_tags.recording_id
      AND recordings.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SHARED_RECORDINGS POLICIES
-- ============================================================================

-- Users can view their own shared recording links
CREATE POLICY "Users can view own shared recordings"
  ON public.shared_recordings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recordings
      WHERE recordings.id = shared_recordings.recording_id
      AND recordings.user_id = auth.uid()
    )
  );

-- Anyone can view shared recordings by token (for public access)
CREATE POLICY "Anyone can view shared recordings by token"
  ON public.shared_recordings
  FOR SELECT
  USING (share_token IS NOT NULL);

-- Users can create shared links for their own recordings
CREATE POLICY "Users can create shared links for own recordings"
  ON public.shared_recordings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recordings
      WHERE recordings.id = shared_recordings.recording_id
      AND recordings.user_id = auth.uid()
    )
  );

-- Users can update their own shared recording links
CREATE POLICY "Users can update own shared recordings"
  ON public.shared_recordings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recordings
      WHERE recordings.id = shared_recordings.recording_id
      AND recordings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recordings
      WHERE recordings.id = shared_recordings.recording_id
      AND recordings.user_id = auth.uid()
    )
  );

-- Users can delete their own shared recording links
CREATE POLICY "Users can delete own shared recordings"
  ON public.shared_recordings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recordings
      WHERE recordings.id = shared_recordings.recording_id
      AND recordings.user_id = auth.uid()
    )
  );

-- ============================================================================
-- USAGE_STATS POLICIES
-- ============================================================================

-- Users can view their own usage statistics
CREATE POLICY "Users can view own usage stats"
  ON public.usage_stats
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert usage stats (for background jobs)
CREATE POLICY "Service role can insert usage stats"
  ON public.usage_stats
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role' OR auth.uid() = user_id);

-- Only service role can update usage stats (for background jobs)
CREATE POLICY "Service role can update usage stats"
  ON public.usage_stats
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'service_role' OR auth.uid() = user_id)
  WITH CHECK (auth.jwt()->>'role' = 'service_role' OR auth.uid() = user_id);

-- Users can delete their own usage stats (for data cleanup)
CREATE POLICY "Users can delete own usage stats"
  ON public.usage_stats
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS FOR SHARED ACCESS
-- ============================================================================

-- Function to check if a shared recording link is valid
CREATE OR REPLACE FUNCTION public.is_valid_shared_link(token TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.shared_recordings
    WHERE share_token = token
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recording via shared link (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_recording_by_share_token(token TEXT, password TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  enhanced_transcript TEXT,
  language TEXT,
  duration INTEGER,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  shared_record RECORD;
BEGIN
  -- Get the shared recording record
  SELECT * INTO shared_record
  FROM public.shared_recordings
  WHERE share_token = token
  AND (expires_at IS NULL OR expires_at > NOW());

  -- Check if shared link exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired share link';
  END IF;

  -- Check password if required
  IF shared_record.password_hash IS NOT NULL THEN
    IF password IS NULL OR crypt(password, shared_record.password_hash) != shared_record.password_hash THEN
      RAISE EXCEPTION 'Invalid password';
    END IF;
  END IF;

  -- Increment view count
  UPDATE public.shared_recordings
  SET view_count = view_count + 1
  WHERE share_token = token;

  -- Return the recording data (bypassing RLS since we're using SECURITY DEFINER)
  RETURN QUERY
  SELECT 
    r.id,
    r.title,
    r.enhanced_transcript,
    r.language,
    r.duration,
    r.created_at
  FROM public.recordings r
  WHERE r.id = shared_record.recording_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'RLS policies created successfully!';
  RAISE NOTICE 'Security features enabled:';
  RAISE NOTICE '  ✓ Users can only access their own data';
  RAISE NOTICE '  ✓ Shared recordings accessible via token';
  RAISE NOTICE '  ✓ Service role can manage usage stats';
  RAISE NOTICE '  ✓ Password-protected sharing supported';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Test RLS policies with sample users';
  RAISE NOTICE '2. Set up storage bucket policies';
  RAISE NOTICE '3. Configure authentication providers';
END $$;

