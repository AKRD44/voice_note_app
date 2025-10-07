# Google OAuth Setup Guide for VoiceFlow

This guide walks you through setting up Google OAuth for the VoiceFlow mobile app.

## Prerequisites

- Google Cloud Console account
- Your app's bundle identifiers (from `app.json`)
  - iOS: `com.voiceflow.app`
  - Android: `com.voiceflow.app`

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" at the top
3. Click "New Project"
4. Enter project name: "VoiceFlow"
5. Click "Create"
6. Wait for project creation to complete
7. Select your new project from the dropdown

## Step 2: Enable Google+ API

1. Go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on "Google+ API"
4. Click "Enable"
5. Wait for the API to be enabled

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type
3. Click "Create"
4. Fill in the required information:
   - **App name:** VoiceFlow
   - **User support email:** Your email
   - **App logo:** (Optional) Upload your app icon
   - **App domain:** (Leave blank for now)
   - **Authorized domains:** (Add your domain if you have one)
   - **Developer contact:** Your email
5. Click "Save and Continue"
6. **Scopes:** Click "Add or Remove Scopes"
   - Select: `./auth/userinfo.email`
   - Select: `./auth/userinfo.profile`
   - Select: `openid`
7. Click "Update" then "Save and Continue"
8. **Test users:** (Optional for development)
   - Add test user emails
9. Click "Save and Continue"
10. Review and click "Back to Dashboard"

## Step 4: Create OAuth 2.0 Client IDs

You'll need to create THREE separate client IDs:
1. iOS Client ID
2. Android Client ID
3. Web Client ID (for Supabase)

### 4.1 Create iOS Client ID

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "iOS" as Application type
4. Fill in:
   - **Name:** VoiceFlow iOS
   - **Bundle ID:** `com.voiceflow.app` (from app.json)
5. Click "Create"
6. **SAVE THE CLIENT ID** - Copy and save it somewhere safe

### 4.2 Create Android Client ID

First, get your SHA-1 fingerprint:

**For Development (Debug Keystore):**
```bash
# On macOS/Linux:
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# On Windows:
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

**For Production:**
You'll need the SHA-1 from your release keystore.

Then create the client ID:
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Android" as Application type
4. Fill in:
   - **Name:** VoiceFlow Android
   - **Package name:** `com.voiceflow.app` (from app.json)
   - **SHA-1 certificate fingerprint:** Paste the SHA-1 you copied
5. Click "Create"
6. **SAVE THE CLIENT ID** - Copy and save it somewhere safe

**Note:** For production, repeat this step with your release keystore SHA-1.

### 4.3 Create Web Client ID (for Supabase)

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as Application type
4. Fill in:
   - **Name:** VoiceFlow Web (Supabase)
   - **Authorized JavaScript origins:** 
     - Add: `https://[your-project-ref].supabase.co`
   - **Authorized redirect URIs:**
     - Add: `https://[your-project-ref].supabase.co/auth/v1/callback`
     - Add: `voiceflow://auth/callback` (for mobile deep linking)
5. Click "Create"
6. **SAVE BOTH THE CLIENT ID AND CLIENT SECRET**

## Step 5: Update Your `.env` File

Add the client IDs to your `.env` file:

```env
GOOGLE_OAUTH_CLIENT_ID_IOS=your-ios-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_ID_ANDROID=your-android-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

## Step 6: Configure Supabase

1. Go to your Supabase Dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "Google" in the list
4. Enable Google provider
5. Add your credentials:
   - **Client ID:** Use the Web Client ID
   - **Client Secret:** Use the Web Client Secret
6. Add authorized redirect URLs:
   - `voiceflow://auth/callback`
   - Your production URL (when you have one)
7. Click "Save"

## Step 7: Test the OAuth Flow

### Test on iOS Simulator:
```bash
npm run ios
```
1. Click "Sign in with Google"
2. You should see the Google OAuth screen
3. Sign in with your Google account
4. Verify you're redirected back to the app
5. Check that user data appears in Supabase

### Test on Android Emulator:
```bash
npm run android
```
1. Click "Sign in with Google"
2. You should see the Google OAuth screen
3. Sign in with your Google account
4. Verify you're redirected back to the app
5. Check that user data appears in Supabase

## Troubleshooting

### "Error: Invalid client"
- Double-check that your client IDs match the bundle identifiers in `app.json`
- Verify the client IDs in your `.env` file are correct

### "Error: Redirect URI mismatch"
- Ensure `scheme: "voiceflow"` is set in `app.json`
- Check that the redirect URI in Google Cloud Console matches: `voiceflow://auth/callback`
- Verify Supabase redirect URLs are configured correctly

### Android: "Error 10" or "Developer Error"
- Your SHA-1 fingerprint might be wrong
- Make sure you're using the debug keystore SHA-1 for development
- For production, use the release keystore SHA-1

### iOS: OAuth browser doesn't close
- Make sure you've added the URL scheme in `app.json`
- Check that `WebBrowser.maybeCompleteAuthSession()` is called in `googleAuth.ts`

### "Error: Network error"
- Check your internet connection
- Verify Google+ API is enabled in Google Cloud Console
- Try restarting the dev server

### User info not appearing in Supabase
- Check that the Web Client ID and Secret are correctly configured in Supabase
- Verify RLS policies allow profile creation
- Check Supabase logs for errors

## Production Deployment

When deploying to production:

1. **Create production Android client ID:**
   - Use your release keystore SHA-1
   - Add to Google Cloud Console
   - Update `.env.production`

2. **Update Supabase redirect URLs:**
   - Add your production app scheme
   - Add your production website URL (if any)

3. **Publish OAuth consent screen:**
   - Go to "OAuth consent screen" in Google Cloud Console
   - Click "Publish App"
   - Submit for verification (required for >100 users)

4. **Update app.json for production:**
   - Ensure correct bundle identifiers
   - Update version numbers
   - Configure proper app icons

## Security Best Practices

- **Never commit** your `.env` file to git
- **Never expose** client secrets in mobile app code
- **Use separate** client IDs for development and production
- **Rotate credentials** if they are ever exposed
- **Monitor** OAuth usage in Google Cloud Console
- **Review** permissions requested from users

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Expo AuthSession Documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [React Native Google Sign-In Guide](https://docs.expo.dev/guides/authentication/)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase and Expo logs
3. Check Google Cloud Console for API errors
4. Consult the Google OAuth documentation

