# 🧪 VoiceFlow Local Testing Guide

## Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Run in Mock Mode (No Setup Required)
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

**Mock mode works right away** with simulated processing. Perfect for testing UI!

---

## Full Testing (With Real AI)

To test with actual AI transcription and cloud features, complete the setup:

### Step 1: Create Supabase Project (3 minutes)

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in:
   - **Name:** voiceflow-dev
   - **Database Password:** (create strong password)
   - **Region:** Choose closest to you
4. Wait for project to provision (~2 minutes)
5. Go to **Settings** > **API**
6. Copy these values:
   - **Project URL**
   - **anon public key**
   - **service_role key** (keep secret!)

### Step 2: Run Database Migrations

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run"
5. Repeat for `002_rls_policies.sql`
6. Repeat for `003_storage_setup.sql`

### Step 3: Create Storage Bucket

1. Go to **Storage** in Supabase
2. Click "New Bucket"
3. Configure:
   - **Name:** `audio-recordings`
   - **Public:** Unchecked (private)
   - **File size limit:** `52428800` (50MB)
   - **Allowed MIME types:** `audio/webm, audio/mp4, audio/mpeg, audio/m4a`
4. Click "Create Bucket"

### Step 4: Set Up Google OAuth

**Quick Setup (Development):**

1. Go to https://console.cloud.google.com
2. Create new project: "VoiceFlow Dev"
3. Enable Google+ API
4. Create OAuth consent screen:
   - User type: External
   - App name: VoiceFlow
   - Add your email
   - Scopes: email, profile, openid
5. Create credentials:
   - **Web Client ID** (for Supabase)
   - **iOS Client ID** (bundle: com.voiceflow.app)
   - **Android Client ID** (package: com.voiceflow.app)

**See `docs/GOOGLE_OAUTH_SETUP.md` for detailed instructions**

### Step 5: Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name it "VoiceFlow Dev"
4. **Copy the key immediately** (you won't see it again)
5. Add billing info (required for API use)
6. Set usage limit (e.g., $10/month)

### Step 6: Create .env File

Create a file named `.env` in your project root:

```env
# Supabase (from Step 1)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here

# OpenAI (from Step 5)
OPENAI_API_KEY=sk-your-key-here

# Google OAuth (from Step 4)
GOOGLE_OAUTH_CLIENT_ID_IOS=your-ios-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_ID_ANDROID=your-android-id.apps.googleusercontent.com
GOOGLE_OAUTH_WEB_CLIENT_ID=your-web-id.apps.googleusercontent.com
```

**⚠️ IMPORTANT:** Never commit your `.env` file to git!

### Step 7: Configure Supabase Auth

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Enable **Google** provider
3. Add your Web Client ID and Secret (from Google Console)
4. Add redirect URL: `voiceflow://auth/callback`
5. Click "Save"

### Step 8: Run the App!

```bash
# Clear cache first (important!)
npm start -- --clear

# Then choose platform:
# Press 'i' for iOS
# Press 'a' for Android
# Press 'w' for web
```

---

## 🧪 Testing Checklist

### Authentication Flow
- [ ] Open app, should see login screen
- [ ] Click "Continue with Google"
- [ ] Complete Google sign-in
- [ ] Redirected back to app
- [ ] See home screen with your profile

### Recording Flow
- [ ] Click record button
- [ ] Grant microphone permission
- [ ] Speak for 10-20 seconds
- [ ] Click stop
- [ ] See processing modal (4 stages):
  - Uploading audio... (0-25%)
  - Transcribing your voice... (25-60%)
  - Enhancing with AI... (60-90%)
  - Saving your note... (90-100%)
- [ ] See success toast
- [ ] View enhanced transcript

### Features to Test
- [ ] Copy transcript to clipboard
- [ ] Share transcript via native sheet
- [ ] Export to TXT/Markdown
- [ ] Try different enhancement styles
- [ ] Change language for transcription
- [ ] Create folders
- [ ] Add tags
- [ ] Search recordings
- [ ] Edit profile name
- [ ] Upload avatar
- [ ] Sign out

---

## 🐛 Troubleshooting

### "Missing environment variables"
**Solution:** Check your `.env` file exists and has all required variables

### "Failed to transcribe audio"
**Possible causes:**
- OpenAI API key is invalid
- No billing set up on OpenAI account
- Audio file too large (>25MB)
**Solution:** Check OpenAI Dashboard > Billing

### "Google sign-in failed"
**Possible causes:**
- OAuth client IDs incorrect
- Redirect URI not configured
- App bundle ID mismatch
**Solution:** Review `docs/GOOGLE_OAUTH_SETUP.md`

### "Database error" or "RLS policy violation"
**Possible causes:**
- Migrations not run
- RLS policies blocking access
**Solution:** Run all 3 migration files in order

### App crashes on startup
**Solution:**
```bash
# Clear all caches
npm start -- --clear

# Reset bundler
rm -rf .expo
rm -rf node_modules/.cache

# Restart
npm start
```

### "Storage bucket not found"
**Solution:** Create the `audio-recordings` bucket in Supabase Storage

---

## 🧑‍💻 Development Workflow

### Making Changes

```bash
# 1. Make your code changes

# 2. Test immediately
npm run ios  # or android/web

# 3. Commit changes
git add .
git commit -m "feat: your change description"
git push origin main
```

### Testing AI Features

**Whisper Transcription:**
- Speak clearly for 10-20 seconds
- Check console for API responses
- Verify transcript accuracy

**GPT-4 Enhancement:**
- Try different styles (note, email, blog, etc.)
- Compare original vs enhanced
- Check for filler word removal

### Testing Premium Features

**Temporarily enable premium** (for testing):

In `src/lib/supabase.ts`, modify `getUserProfile` to return:
```typescript
{ ...data, subscription_tier: 'premium' }
```

Now you can test:
- 15-minute recordings
- Custom AI prompts
- All export formats
- All enhancement styles

**Remember to revert before production!**

---

## 📱 Platform-Specific Testing

### iOS Simulator
```bash
npm run ios
```
- Uses Mac only
- Microphone works in simulator
- Test iPhone and iPad sizes
- Test dark mode

### Android Emulator
```bash
npm run android
```
- Create AVD in Android Studio
- Enable microphone in AVD settings
- Test different Android versions
- Test Google Play services

### Web Browser
```bash
npm run web
```
- Open http://localhost:19006
- Test in Chrome, Safari, Firefox
- Responsive design testing
- PWA capabilities

---

## 🔍 Debugging Tips

### Enable Debug Mode

Add to your `.env`:
```env
DEBUG=true
```

### View Logs

**Metro Bundler:**
```bash
npm start
# Logs appear in terminal
```

**iOS:**
```bash
# View device logs
xcrun simctl spawn booted log stream --predicate 'process == "Expo"'
```

**Android:**
```bash
# View device logs
adb logcat | grep ReactNative
```

### Supabase Logs

1. Go to Supabase Dashboard
2. Click **Logs** in sidebar
3. View:
   - Database queries
   - Auth events
   - Storage operations
   - API errors

### OpenAI Usage

1. Go to https://platform.openai.com/usage
2. View API calls and costs
3. Monitor rate limits

---

## 💰 Costs for Testing

**Free Tier Limits:**

**Supabase:**
- 500MB database (plenty for testing)
- 1GB storage (plenty for testing)
- 50,000 monthly active users (more than enough!)
- **Cost:** $0 (Free tier)

**OpenAI:**
- Whisper: $0.006 per minute of audio
- GPT-4 Turbo: ~$0.01-0.03 per transcript
- **Example:** 100 tests ≈ $3-5
- Set a usage limit in OpenAI Dashboard!

**Google OAuth:**
- Completely free
- Unlimited users

**Total testing cost:** ~$5-10 for extensive testing

---

## 🎬 Quick Demo Flow

**5-Minute Demo:**

1. **Start App**
   ```bash
   npm run ios
   ```

2. **Sign In**
   - Click "Continue with Google"
   - Use your Google account
   - See home screen

3. **Make a Recording**
   - Click big record button
   - Say: "This is a test of VoiceFlow. Um, I think this is pretty cool, you know? It should remove filler words and, like, make this sound better."
   - Click stop

4. **Watch AI Process**
   - See 4-stage processing
   - Wait 20-30 seconds
   - See enhanced output

5. **Compare Results**
   - Original: "Um, I think this is pretty cool, you know..."
   - Enhanced: "This is a test of VoiceFlow. I think this is pretty cool. It should remove filler words and make this sound better."

6. **Test Features**
   - Copy to clipboard
   - Try different styles
   - Export to Markdown
   - Share via messages

**You'll see the AI magic happen in real-time!** ✨

---

## 📚 Additional Resources

- **Expo Docs:** https://docs.expo.dev
- **Supabase Docs:** https://supabase.com/docs
- **OpenAI Docs:** https://platform.openai.com/docs
- **React Navigation:** https://reactnavigation.org/docs

---

## ❓ FAQ

**Q: Do I need a Mac for iOS testing?**
A: For simulator, yes. For real device, you can use Expo Go app.

**Q: How much does testing cost?**
A: ~$5-10 for OpenAI calls. Supabase and Google are free.

**Q: Can I test without setting up Supabase?**
A: Yes! The app runs in mock mode without backend setup.

**Q: How do I reset everything?**
A: Delete the app, clear storage, run `npm start -- --clear`

**Q: Where are recordings stored?**
A: Supabase Storage (cloud) or local device (mock mode)

**Q: Can I test offline?**
A: Yes, app has offline queue that syncs when online.

---

## 🚀 Ready to Test?

**Fastest way to see it work:**

```bash
# 1. Install
npm install

# 2. Run
npm run ios  # or android

# 3. Test in mock mode (no setup needed)
```

**To test real AI:**
- Complete setup from `FOR YOU TO DO`
- Follow this guide
- Start recording!

---

**Need help? Check the detailed guides:**
- `FOR YOU TO DO` - Required setup steps
- `supabase/SETUP_GUIDE.md` - Backend setup
- `docs/GOOGLE_OAUTH_SETUP.md` - OAuth configuration

**Happy testing! 🎉**

