# Supabase Setup Guide for VoiceFlow

This guide walks you through setting up your Supabase backend for VoiceFlow.

## Prerequisites

- Supabase account (sign up at https://supabase.com)
- Project created in Supabase
- Environment variables configured in your `.env` file

## Step 1: Run Database Migrations

Run these SQL migrations in order in your Supabase SQL Editor:

### 1.1 Initial Schema
```bash
File: supabase/migrations/001_initial_schema.sql
```
1. Go to SQL Editor in Supabase Dashboard
2. Click "New Query"
3. Copy and paste the contents of `001_initial_schema.sql`
4. Click "Run"
5. Verify success message appears

This creates all database tables, indexes, and triggers.

### 1.2 RLS Policies
```bash
File: supabase/migrations/002_rls_policies.sql
```
1. Create a new query in SQL Editor
2. Copy and paste the contents of `002_rls_policies.sql`
3. Click "Run"
4. Verify success message appears

This enables Row Level Security and creates all access policies.

### 1.3 Storage Policies
```bash
File: supabase/migrations/003_storage_setup.sql
```
1. Create a new query in SQL Editor
2. Copy and paste the contents of `003_storage_setup.sql`
3. Click "Run"
4. Verify success message appears

This creates storage policies and helper functions.

## Step 2: Create Storage Bucket

### Via Supabase Dashboard:

1. Go to **Storage** section in left sidebar
2. Click **"New Bucket"**
3. Configure the bucket:
   - **Bucket name:** `audio-recordings`
   - **Public bucket:** **Uncheck** (keep private)
   - **File size limit:** `52428800` (50MB)
   - **Allowed MIME types:** 
     ```
     audio/webm
     audio/mp4
     audio/mpeg
     audio/m4a
     ```
4. Click **"Create Bucket"**

### Via Supabase CLI (Alternative):
```bash
# In your Supabase project directory
supabase storage create audio-recordings --public false --file-size-limit 52428800
```

## Step 3: Configure Authentication

### Enable Google OAuth:

1. Go to **Authentication** > **Providers** in Supabase Dashboard
2. Find **Google** provider
3. Click to configure
4. Enable the provider
5. Add your Google OAuth credentials:
   - **Client ID:** (from Google Cloud Console)
   - **Client Secret:** (from Google Cloud Console)
6. Add authorized redirect URLs:
   ```
   https://[your-project-ref].supabase.co/auth/v1/callback
   ```
7. Click **"Save"**

### Configure Redirect URLs:

1. Go to **Authentication** > **URL Configuration**
2. Add your app URLs:
   - **Site URL:** Your production app URL
   - **Redirect URLs:** 
     - `exp://localhost:19000` (for Expo development)
     - `yourapp://` (your custom scheme)
     - Your production URLs

## Step 4: Verify Setup

### Check Database:
```sql
-- Run this in SQL Editor to verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should show: profiles, recordings, folders, tags, 
-- recording_folders, recording_tags, shared_recordings, usage_stats
```

### Check RLS:
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- All tables should show: rowsecurity = true
```

### Check Storage:
1. Go to **Storage** section
2. Verify `audio-recordings` bucket exists
3. Click on bucket to see it's configured correctly

## Step 5: Get Your Credentials

You'll need these for your `.env` file:

### From Project Settings > API:
1. **Project URL:** `https://[your-project-ref].supabase.co`
2. **anon/public key:** (shown in API section)
3. **service_role key:** (shown in API section - keep secret!)

### Update your `.env` file:
```env
SUPABASE_URL=https://[your-project-ref].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_KEY=[your-service-key]
```

## Step 6: Test the Setup

### Test Database Connection:
```typescript
import { supabase } from './src/lib/supabase';

// Test connection
const { data, error } = await supabase.auth.getSession();
console.log('Supabase connected:', !error);
```

### Test Authentication:
Try signing in via Google OAuth from your app.

### Test Storage:
Try uploading a test audio file from your app.

## Troubleshooting

### Migration Errors:
- **"relation already exists":** Some tables may already exist. Drop them or skip those CREATE statements.
- **"permission denied":** Make sure you're running migrations as a superuser in SQL Editor.

### RLS Issues:
- **"new row violates row-level security policy":** Check that your RLS policies match the user's auth.uid().
- **Can't access data:** Verify you're authenticated and the policy allows your operation.

### Storage Issues:
- **"Bucket not found":** Create the bucket in Storage section.
- **"Storage object not found":** Check file path format: `user_id/recording_id.m4a`
- **Upload fails:** Verify MIME type is allowed and file size is within limit.

### Authentication Issues:
- **OAuth redirect fails:** Check redirect URLs in both Google Console and Supabase.
- **"Invalid credentials":** Verify Google OAuth client ID and secret are correct.

## Optional: Set Up Realtime (For Live Sync)

1. Go to **Database** > **Replication**
2. Enable replication for these tables:
   - `recordings`
   - `folders`
   - `tags`
3. This enables real-time updates across devices

## Optional: Set Up Edge Functions (For Background Jobs)

If you need background processing:

1. Install Supabase CLI: `npm install -g supabase`
2. Create edge functions for:
   - Periodic cleanup of orphaned files
   - Monthly usage stats reset
   - Expired share link cleanup

## Next Steps

Once setup is complete:

1. ✅ All migrations run successfully
2. ✅ Storage bucket created
3. ✅ Google OAuth configured
4. ✅ Environment variables set
5. ✅ Connection tested

You're ready to start using VoiceFlow with a fully configured backend!

## Maintenance

### Regular Tasks:
- **Monthly:** Run `cleanup_orphaned_audio_files()` to remove unused files
- **Weekly:** Check storage usage via `get_storage_quota(user_id)`
- **As needed:** Review RLS policies if adding new features

### Backup:
- Supabase automatically backs up your database
- Consider enabling Point-in-Time Recovery for production

## Support

- Supabase Docs: https://supabase.com/docs
- VoiceFlow Issues: [Your GitHub repo]/issues
- Supabase Discord: https://discord.supabase.com

