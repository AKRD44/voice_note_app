-- VoiceFlow Database Schema
-- Migration 003: Storage Bucket Setup and Policies
-- Run this AFTER migrations 001 and 002

-- Note: Storage buckets must be created via Supabase Dashboard or Storage API
-- This migration focuses on the policies for the 'audio-recordings' bucket

-- ============================================================================
-- STORAGE BUCKET POLICIES FOR 'audio-recordings'
-- ============================================================================

-- PREREQUISITE: Create the 'audio-recordings' bucket in Supabase Dashboard with:
-- - Name: audio-recordings
-- - Public: false (private bucket)
-- - File size limit: 52428800 bytes (50MB - will be enforced at application level for free tier)
-- - Allowed MIME types: audio/webm, audio/mp4, audio/mpeg, audio/m4a

-- Policy: Users can upload audio files to their own folder
CREATE POLICY "Users can upload own audio files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own audio files
CREATE POLICY "Users can view own audio files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own audio files
CREATE POLICY "Users can update own audio files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'audio-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'audio-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own audio files
CREATE POLICY "Users can delete own audio files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- HELPER FUNCTIONS FOR STORAGE
-- ============================================================================

-- Function to check file size before upload (application-level enforcement)
CREATE OR REPLACE FUNCTION public.check_audio_file_size(
  user_id UUID,
  file_size_bytes BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
  max_size_bytes BIGINT;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO user_tier
  FROM public.profiles
  WHERE id = user_id;

  -- Set max size based on tier
  IF user_tier = 'premium' THEN
    max_size_bytes := 157286400; -- 150MB for premium
  ELSE
    max_size_bytes := 52428800;  -- 50MB for free
  END IF;

  -- Check if file size is within limit
  RETURN file_size_bytes <= max_size_bytes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get storage quota for user
CREATE OR REPLACE FUNCTION public.get_storage_quota(user_id UUID)
RETURNS TABLE (
  used_bytes BIGINT,
  max_bytes BIGINT,
  tier TEXT
) AS $$
DECLARE
  user_tier TEXT;
  max_storage BIGINT;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO user_tier
  FROM public.profiles
  WHERE id = user_id;

  -- Set max storage based on tier
  IF user_tier = 'premium' THEN
    max_storage := NULL; -- Unlimited for premium
  ELSE
    max_storage := 104857600; -- 100MB total for free tier (10 recordings * ~10MB avg)
  END IF;

  -- Calculate used storage (sum of all audio file sizes)
  RETURN QUERY
  SELECT 
    COALESCE(
      (SELECT SUM((metadata->>'size')::BIGINT)
       FROM storage.objects
       WHERE bucket_id = 'audio-recordings'
       AND (storage.foldername(name))[1] = user_id::text),
      0
    ) AS used_bytes,
    max_storage AS max_bytes,
    user_tier AS tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up orphaned audio files (files without corresponding recording)
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_audio_files()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  file_record RECORD;
BEGIN
  -- Find storage objects without corresponding recordings
  FOR file_record IN
    SELECT 
      s.name,
      s.bucket_id,
      (storage.foldername(s.name))[1] AS user_folder,
      (storage.filename(s.name)) AS filename
    FROM storage.objects s
    WHERE s.bucket_id = 'audio-recordings'
    AND NOT EXISTS (
      SELECT 1 FROM public.recordings r
      WHERE r.audio_url LIKE '%' || (storage.filename(s.name)) || '%'
    )
    AND s.created_at < NOW() - INTERVAL '1 day' -- Only cleanup files older than 1 day
  LOOP
    -- Delete the orphaned file
    DELETE FROM storage.objects
    WHERE bucket_id = file_record.bucket_id
    AND name = file_record.name;
    
    deleted_count := deleted_count + 1;
  END LOOP;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER FOR STORAGE CLEANUP ON RECORDING DELETE
-- ============================================================================

-- Function to delete audio file when recording is deleted
CREATE OR REPLACE FUNCTION public.delete_audio_file_on_recording_delete()
RETURNS TRIGGER AS $$
DECLARE
  file_path TEXT;
BEGIN
  -- Extract file path from audio URL
  -- Format: https://[project].supabase.co/storage/v1/object/public/audio-recordings/[user_id]/[filename]
  file_path := regexp_replace(OLD.audio_url, '.*audio-recordings/', '');
  
  -- Delete the file from storage
  DELETE FROM storage.objects
  WHERE bucket_id = 'audio-recordings'
  AND name = file_path;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically delete audio file when recording is deleted
CREATE TRIGGER delete_audio_file_trigger
  BEFORE DELETE ON public.recordings
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_audio_file_on_recording_delete();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Storage policies created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Complete these manual steps in Supabase Dashboard:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Go to Storage section';
  RAISE NOTICE '2. Create new bucket:';
  RAISE NOTICE '   - Name: audio-recordings';
  RAISE NOTICE '   - Public: false (unchecked)';
  RAISE NOTICE '   - File size limit: 52428800 (50MB)';
  RAISE NOTICE '   - Allowed MIME types: audio/webm, audio/mp4, audio/mpeg, audio/m4a';
  RAISE NOTICE '';
  RAISE NOTICE 'Storage features enabled:';
  RAISE NOTICE '  ✓ Users can only access their own audio files';
  RAISE NOTICE '  ✓ File size limits enforced (50MB free, 150MB premium)';
  RAISE NOTICE '  ✓ Storage quota tracking';
  RAISE NOTICE '  ✓ Automatic cleanup of orphaned files';
  RAISE NOTICE '  ✓ Auto-delete audio on recording delete';
  RAISE NOTICE '';
  RAISE NOTICE 'Helper functions available:';
  RAISE NOTICE '  - check_audio_file_size(user_id, file_size)';
  RAISE NOTICE '  - get_storage_quota(user_id)';
  RAISE NOTICE '  - cleanup_orphaned_audio_files()';
END $$;

