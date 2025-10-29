# How VoiceFlow Works

This document explains the architecture, data flow, and key components of the VoiceFlow voice transcription application.

## 🎯 Overview

VoiceFlow is a React Native/Expo app that records voice, transcribes it using AI (OpenAI Whisper), enhances the text with GPT-4, and stores everything in Supabase. The app has a freemium model with subscription tiers.

---

## 📱 Application Architecture

### Tech Stack
- **Frontend**: React Native + Expo (iOS, Android, Web)
- **State Management**: Zustand with secure storage persistence
- **Navigation**: React Navigation v6 (Stack + Bottom Tabs)
- **Backend**: Supabase (PostgreSQL + Storage + Auth)
- **AI Services**: OpenAI (Whisper API + GPT-4)
- **Audio**: Expo AV for recording/playback

### Core Structure

```
App.tsx (Root)
├── AuthProvider (Context)
│   ├── Checks authentication state
│   ├── Manages Google OAuth flow
│   └── Provides user session/profile
│
└── AppNavigator
    ├── LoginScreen (if not authenticated)
    └── MainTabs (if authenticated)
        ├── HomeScreen
        ├── LibraryScreen
        ├── RecordingScreen (floating button)
        └── SettingsScreen
```

---

## 🔐 Authentication Flow

### How Authentication Works

1. **App Startup** (`AuthContext.tsx`):
   - App checks for existing session in `SecureStore`
   - Calls `supabase.auth.getSession()` to validate
   - If valid session exists, loads user profile from database
   - If no session, shows `LoginScreen`

2. **Google OAuth Sign-In**:
   - User taps "Sign in with Google"
   - `expo-auth-session` opens Google OAuth flow
   - After user authorizes, Google redirects back with auth code
   - App exchanges code for tokens via Supabase
   - Supabase creates `auth.users` record
   - Database trigger automatically creates `profiles` record
   - Session stored securely in `SecureStore`

3. **Session Management**:
   - Session tokens auto-refresh before expiry
   - Secure storage adapter ensures tokens are encrypted
   - On sign-out, all local data is cleared

### Authentication State
```typescript
interface AuthContextState {
  user: User | null;
  profile: UserProfile | null;  // Extended user info
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

---

## 🎤 Recording Flow

### Step-by-Step Process

#### 1. **Starting a Recording** (`RecordingScreen.tsx`)
```typescript
startRecording() {
  1. Request microphone permissions
  2. Configure Audio mode (allowsRecordingIOS: true)
  3. Create new Audio.Recording instance
  4. Start recording with high-quality preset
  5. Begin duration timer (checks max duration limit)
  6. Start pulse animation for visual feedback
  7. Update Zustand store: isRecording = true
}
```

**Recording Settings**:
- **Free users**: 3 minutes max duration
- **Premium users**: 15 minutes max duration
- Audio quality: High (m4a format)
- Real-time waveform visualization

#### 2. **During Recording**
- Timer counts up every second
- Progress bar shows time remaining
- Waveform animates based on audio levels (via `WaveformVisualizer`)
- User can pause/resume
- If max duration reached, auto-stops

#### 3. **Stopping a Recording**
```typescript
stopRecording() {
  1. Stop audio recording
  2. Get file URI from recording object
  3. Stop timers and animations
  4. Create Recording object in Zustand store:
     - Generate unique ID (rec_${timestamp})
     - Save audio URI
     - Set processing state: isProcessing = true
  5. Call processRecording() pipeline
}
```

---

## ⚙️ Processing Pipeline

The **ProcessingPipeline** service orchestrates the entire workflow from audio file to enhanced transcript.

### Pipeline Stages

```
1. Uploading (0-25%)
   └─ Upload audio to Supabase Storage bucket
   └─ Get public URL for audio file

2. Transcribing (25-60%)
   └─ Send audio to OpenAI Whisper API
   └─ Get original transcript text
   └─ Auto-detect language

3. Enhancing (60-90%)
   └─ Send transcript to GPT-4
   └─ Apply style transformation (note/email/blog/etc.)
   └─ Fix grammar, remove fillers, restructure

4. Saving (90-100%)
   └─ Save to Supabase recordings table
   └─ Store both original and enhanced transcripts
   └─ Calculate word/character counts
   └─ Link to user and audio file

5. Complete!
```

### Detailed Stage Breakdown

#### Stage 1: Upload (`audioUtils.ts`)
```typescript
AudioUtils.uploadWithRetry(audioUri, userId, recordingId) {
  1. Read local audio file
  2. Convert to Blob
  3. Upload to Supabase Storage: "audio-recordings" bucket
  4. Path format: {userId}/{recordingId}.m4a
  5. Get public URL for later access
  6. Retry logic on failure (3 attempts)
}
```

#### Stage 2: Transcription (`transcription.ts`)
```typescript
TranscriptionService.transcribeWithRetry(audioUri) {
  1. Validate file exists and size < 25MB
  2. Convert file URI to Blob
  3. Create File object for OpenAI SDK
  4. Call OpenAI Whisper API:
     - File: audio.m4a
     - Language: auto-detect (or specified)
     - Temperature: 0 (more accurate)
  5. Get transcript text + detected language
  6. Estimate cost ($0.006 per minute)
  7. Retry with exponential backoff if fails
}
```

**Whisper API Details**:
- Maximum file size: 25MB
- Supports 100+ languages
- Automatically detects language if not specified
- Very accurate, but processing time ~15% of audio length

#### Stage 3: Enhancement (`enhancement.ts`)
```typescript
EnhancementService.enhance(transcript, { style, isPremium }) {
  1. Validate transcript is not empty
  2. Check if user has access to style (custom = premium only)
  3. Call OpenAI GPT-4:
     - Input: transcript + style-specific prompt
     - Example prompts:
       * Note: "Convert to concise bullet points..."
       * Email: "Format as professional email..."
       * Blog: "Transform into engaging narrative..."
       * Summary: "Extract 3-5 key points..."
  4. Get enhanced text
  5. Validate quality (check for improvements)
  6. Estimate cost (~$0.03 per 1K tokens)
}
```

**Enhancement Styles**:
- **Note**: Bullet points with headings
- **Email**: Professional email format
- **Blog**: Narrative with personality
- **Summary**: 3-5 key bullets only
- **Transcript**: Verbatim with grammar fixes
- **Custom**: User-defined prompt (premium)

#### Stage 4: Save to Database (`supabase.ts`)
```typescript
createRecording({
  user_id, title, audio_url,
  original_transcript, enhanced_transcript,
  language, style, duration,
  word_count, character_count
}) {
  1. Insert into 'recordings' table
  2. Generate UUID for recording ID
  3. Set timestamps (created_at, updated_at)
  4. Return full recording object
}
```

### Progress Updates

The pipeline uses callbacks to update UI:
```typescript
onProgress(stage, percentage) {
  // Updates ProcessingModal visual progress
  // Updates recordingStore processingProgress
  // Shows stage name: "Transcribing your voice..."
}
```

---

## 💾 Data Storage

### Local Storage (Zustand + SecureStore)

**Recording Store** (`recordingStore.ts`):
- Stores recordings array with metadata
- Persists to SecureStore (encrypted)
- Manages recording state (isRecording, currentRecording)
- Recording settings (max duration, quality, default style)

**Settings Store** (`settingsStore.ts`):
- Theme preferences (light/dark/auto)
- Recording quality settings
- Notification preferences
- User preferences

### Cloud Storage (Supabase)

#### Database Tables

**1. `profiles`** (extends `auth.users`):
```sql
- id (FK to auth.users)
- display_name
- avatar_url
- subscription_tier ('free' | 'premium')
- subscription_expires_at
```

**2. `recordings`**:
```sql
- id (UUID, primary key)
- user_id (FK to profiles)
- title
- audio_url (Supabase Storage URL)
- original_transcript
- enhanced_transcript
- language
- style (note/email/blog/summary/transcript/custom)
- duration (seconds)
- word_count
- character_count
- created_at, updated_at
```

**3. `folders`**:
```sql
- User-created folders for organizing recordings
- Has color coding
```

**4. `tags`**:
```sql
- User-created tags for flexible categorization
```

**5. `shared_recordings`**:
```sql
- Share tokens for public access
- Password protection
- Expiry dates
```

**6. `usage_stats`**:
```sql
- Monthly usage tracking
- Recording minutes
- API calls
- Storage bytes
```

#### Storage Bucket

**`audio-recordings`** bucket:
- Stores all uploaded audio files
- Path structure: `{userId}/{recordingId}.m4a`
- Public read access for URLs
- Private upload (only authenticated users)

---

## 🎨 User Interface Flow

### Screen Navigation

```
MainTabs Navigation
├── Home Screen
│   ├── Quick stats (total recordings, minutes)
│   ├── Recent recordings list
│   └── Quick record button
│
├── Library Screen
│   ├── Search/filter bar
│   ├── View toggle (grid/list)
│   ├── Recording cards
│   └── Tap card → RecordingDetailModal
│       ├── Play audio
│       ├── View both transcripts
│       ├── Export/share options
│       └── Edit metadata
│
├── Record Screen (Floating Button)
│   ├── Large waveform visualizer
│   ├── Duration display
│   ├── Progress ring
│   ├── Record/Pause/Stop controls
│   └── Processing modal (during processing)
│
└── Settings Screen
    ├── Profile management
    ├── Theme selection
    ├── Recording preferences
    ├── Subscription management
    └── Usage statistics
```

### UI Components

**WaveformVisualizer**:
- Real-time animated bars during recording
- React Native Reanimated for smooth animations
- Audio levels determine bar heights

**ProcessingModal**:
- Shows processing stage (1-4)
- Progress bar animation
- Stage names: "Uploading...", "Transcribing...", etc.

**RecordingCard**:
- Displays title, date, duration
- Preview of transcript
- Style badge (Note/Email/etc.)
- Tags display

---

## 🔄 State Management

### Zustand Stores

**Recording Store**:
```typescript
{
  recordings: Recording[],
  isRecording: boolean,
  currentRecording?: { uri, duration, startTime },
  recordingSettings: { maxDuration, audioQuality, ... },
  
  // Actions
  startRecording(uri),
  stopRecording() → Recording,
  addRecording(data) → id,
  updateTranscript(id, original, enhanced),
  setProcessingState(id, isProcessing, progress),
}
```

**Settings Store**:
```typescript
{
  theme: 'auto' | 'light' | 'dark',
  recordingQuality: 'low' | 'medium' | 'high',
  notificationsEnabled: boolean,
  ...
}
```

### Persistence

- Zustand persistence uses `SecureStore` (encrypted)
- Only persisted data:
  - Recordings array (metadata, not audio files)
  - Recording settings
  - Settings preferences

---

## 🔐 Security & Permissions

### Row Level Security (RLS)

Supabase RLS policies ensure:
- Users can only read their own recordings
- Users can only update/delete their own recordings
- Profiles are user-scoped
- Storage files are user-scoped

### Permissions Required

**iOS**:
- `NSMicrophoneUsageDescription`: For recording
- `NSSpeechRecognitionUsageDescription`: For transcription UI

**Android**:
- `RECORD_AUDIO`: For microphone access
- `READ/WRITE_EXTERNAL_STORAGE`: For file management

### Secure Storage

- Authentication tokens in `SecureStore` (encrypted)
- Session data encrypted at rest
- No API keys stored in app (environment variables)

---

## 💰 Subscription Model

### Free Tier
- 3 minutes max recording
- 3 basic enhancement styles (Note, Email, Summary)
- Limited monthly recordings
- Basic features

### Premium Tier
- 15 minutes max recording
- All 6 enhancement styles (including Custom)
- Unlimited recordings
- Priority processing
- Advanced export options

### Usage Tracking

`usage_stats` table tracks monthly:
- Recording minutes
- API calls (Whisper + GPT-4)
- Storage bytes

Limits enforced before allowing actions.

---

## 🌐 API Integration

### OpenAI Integration (`lib/openai.ts`)

**Whisper API**:
- Transcribes audio → text
- Endpoint: `/v1/audio/transcriptions`
- Returns: `{ text, language }`

**GPT-4 API**:
- Enhances transcript text
- Endpoint: `/v1/chat/completions`
- Returns: `{ enhanced_text, tokens_used }`

### Supabase Integration (`lib/supabase.ts`)

**Authentication**:
- `supabase.auth.signInWithOAuth()` for Google
- `supabase.auth.getSession()` for validation
- Auto token refresh

**Database**:
- REST API via Supabase client
- Real-time subscriptions (future)
- Full-text search on transcripts

**Storage**:
- Upload audio files
- Get public URLs
- Delete old files

---

## 📊 Cost Estimation

### Per Recording (approximate)

**3-minute recording**:
- Whisper transcription: ~$0.018 (3 min × $0.006/min)
- GPT-4 enhancement: ~$0.02-0.05 (varies by transcript length)
- **Total**: ~$0.04-0.07 per recording

**15-minute recording (premium)**:
- Whisper: ~$0.09
- GPT-4: ~$0.10-0.25
- **Total**: ~$0.20-0.35 per recording

These costs determine subscription pricing strategy.

---

## 🔄 Offline Support

**Current Limitations**:
- Requires internet for:
  - Authentication
  - Audio upload
  - Transcription
  - Enhancement

**Future Offline Features** (planned):
- Record audio offline
- Queue recordings for processing
- Sync when online
- Local transcript caching

---

## 🚀 Deployment Flow

### Development
1. Run `expo start`
2. Use Expo Go app to test
3. Hot reload enabled

### Production Build
1. Configure `app.json` with app identifiers
2. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_OPENAI_API_KEY`
3. Run `eas build -p ios` or `-p android`
4. Submit to App Store/Play Store

### Supabase Setup
1. Run migrations in SQL Editor:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_storage_setup.sql`
2. Configure Google OAuth provider
3. Create storage bucket: `audio-recordings`
4. Set bucket policies

---

## 🐛 Error Handling

### Recording Errors
- Permission denied → Alert + redirect to settings
- Recording failed → Toast notification + retry option
- File system error → Log + graceful degradation

### Processing Errors
- Upload failure → Retry with exponential backoff
- Transcription error → Show error, keep original audio
- Enhancement failure → Use original transcript
- Network error → Queue for retry

### All errors logged to console + user-friendly messages

---

## 📈 Performance Optimizations

1. **Audio Files**:
   - Stored in cache directory (temporary)
   - Uploaded immediately after recording
   - Local cache cleaned up after upload

2. **State Management**:
   - Zustand for lightweight state
   - Selective persistence (not everything saved)
   - SecureStore for sensitive data

3. **UI**:
   - Native animations (Reanimated)
   - Lazy loading for large lists
   - Image optimization

4. **Network**:
   - Retry logic with backoff
   - Request batching where possible
   - Optimistic UI updates

---

## 🔮 Future Enhancements

1. **Real-time transcription**: Preview while recording
2. **Collaboration**: Share recordings with team
3. **Integrations**: Export to Notion, Google Docs, etc.
4. **Custom voices**: Voice cloning for playback
5. **Multi-language**: Auto-translation after enhancement
6. **Analytics**: Usage insights and patterns

---

## 📚 Key Files Reference

- **App Entry**: `App.tsx`
- **Auth**: `src/contexts/AuthContext.tsx`
- **Recording**: `src/screens/RecordingScreen.tsx`
- **Processing**: `src/services/processingPipeline.ts`
- **Transcription**: `src/services/transcription.ts`
- **Enhancement**: `src/services/enhancement.ts`
- **Database**: `src/lib/supabase.ts`
- **State**: `src/store/recordingStore.ts`
- **Schema**: `supabase/migrations/001_initial_schema.sql`

---

This system provides a complete, production-ready voice transcription application with AI enhancement, cloud sync, and a modern user experience.
