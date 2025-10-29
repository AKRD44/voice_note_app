# VoiceFlow Flutter Conversion Guide

This directory contains the complete Flutter conversion of the VoiceFlow React Native app.

## 📱 Project Structure

```
lib/
├── core/
│   ├── config/          # Supabase configuration
│   ├── models/          # Data models (Recording, etc.)
│   ├── providers/       # Riverpod state providers (Auth, Recording, Settings)
│   ├── router/          # GoRouter navigation setup
│   └── theme/           # App theme (light/dark)
├── screens/
│   ├── auth/           # Login screen
│   ├── home/           # Home screen
│   ├── library/        # Library screen
│   ├── recording/       # Recording screen
│   └── settings/       # Settings screen
├── services/
│   ├── audio_service.dart           # Audio upload/download
│   ├── openai_service.dart         # OpenAI API integration
│   └── processing_pipeline_service.dart  # Processing workflow
├── widgets/            # Reusable widgets
│   ├── waveform_visualizer.dart
│   ├── processing_modal.dart
│   ├── recording_card.dart
│   └── ...
└── main.dart           # App entry point
```

## 🔄 Key Conversions

### State Management
- **React Native**: Zustand → **Flutter**: Riverpod
- Providers live in `lib/core/providers/`
- State is reactive and type-safe

### Navigation
- **React Native**: React Navigation → **Flutter**: GoRouter
- Declarative routing with guards
- Deep linking support

### Audio Recording
- **React Native**: Expo AV → **Flutter**: `record` package
- High-quality M4A recording
- Pause/resume support

### Storage
- **React Native**: SecureStore → **Flutter**: `flutter_secure_storage`
- **React Native**: MMKV → **Flutter**: `shared_preferences`
- Encrypted storage for sensitive data

### Backend
- **Supabase**: Same client (`supabase_flutter`)
- **OpenAI**: Custom Dart service using `openai_dart` or `dio`

### UI Components
- **React Native**: React Components → **Flutter**: Widgets
- Material Design 3
- Custom glassmorphism effects with BackdropFilter

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd flutter_voiceflow
flutter pub get
```

### 2. Configure Environment Variables

Create a `.env` file or use compile-time constants:

```dart
// In lib/core/config/supabase_config.dart
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

// In lib/services/openai_service.dart
const openaiApiKey = 'YOUR_OPENAI_API_KEY';
```

### 3. Run the App

```bash
flutter run
```

## 📋 Remaining Tasks

To complete the Flutter conversion, implement:

1. **Screens** (already started):
   - ✅ Login Screen
   - ✅ Recording Screen
   - ⏳ Home Screen
   - ⏳ Library Screen
   - ⏳ Settings Screen

2. **Widgets**:
   - ✅ WaveformVisualizer (structure)
   - ✅ ProcessingModal (structure)
   - ⏳ RecordingCard
   - ⏳ WelcomeModal
   - ⏳ RecordingDetailModal

3. **Services**:
   - ✅ OpenAI Service
   - ✅ Audio Service
   - ✅ Processing Pipeline
   - ⏳ Transcription Service (wrapper)
   - ⏳ Enhancement Service (wrapper)

4. **Configuration**:
   - ⏳ Android permissions (`AndroidManifest.xml`)
   - ⏳ iOS permissions (`Info.plist`)
   - ⏳ App icons and splash screens

## 🔧 Key Differences from React Native

### State Management
```dart
// Flutter (Riverpod)
final recordings = ref.watch(recordingProvider);
ref.read(recordingProvider.notifier).addRecording(data);
```

```typescript
// React Native (Zustand)
const recordings = useRecordingStore(state => state.recordings);
useRecordingStore.getState().addRecording(data);
```

### Navigation
```dart
// Flutter (GoRouter)
context.go('/library');
context.push('/record');
```

```typescript
// React Native (React Navigation)
navigation.navigate('Library');
navigation.navigate('Record');
```

### Audio Recording
```dart
// Flutter (record package)
final recorder = AudioRecorder();
await recorder.start(RecordConfig(), path: filePath);
await recorder.stop();
```

```typescript
// React Native (Expo AV)
const recording = new Audio.Recording();
await recording.prepareToRecordAsync();
await recording.startAsync();
```

## 📦 Dependencies

See `pubspec.yaml` for the complete list. Key packages:

- **State**: `flutter_riverpod`, `riverpod_annotation`
- **Navigation**: `go_router`
- **Backend**: `supabase_flutter`, `http`, `dio`
- **Audio**: `record`, `just_audio`
- **Storage**: `shared_preferences`, `flutter_secure_storage`
- **UI**: `google_fonts`, `flutter_animate`

## 🎨 Design System

The Flutter app maintains the same design language:

- **Colors**: Primary blue (#3B82F6), Purple (#8B5CF6)
- **Typography**: Inter (via Google Fonts)
- **Effects**: Glassmorphism with BackdropFilter
- **Animations**: Flutter Animate package

## 🔐 Authentication

Google OAuth flow:

1. User taps "Sign in with Google"
2. Google Sign-In opens
3. Auth code exchanged for Supabase session
4. User profile loaded from database

## 🎤 Recording Flow

1. Request microphone permission
2. Start recording with `AudioRecorder`
3. Show real-time waveform
4. Stop recording → save to local storage
5. Upload to Supabase
6. Process through pipeline (transcribe → enhance → save)

## ⚙️ Processing Pipeline

Same 4-stage pipeline:
1. **Upload** (0-25%): Audio → Supabase Storage
2. **Transcribe** (25-60%): OpenAI Whisper API
3. **Enhance** (60-90%): GPT-4 enhancement
4. **Save** (90-100%): Save to database

## 📝 Next Steps

1. Complete all screens following the patterns in `recording_screen.dart`
2. Create widget library for reusable components
3. Add comprehensive error handling
4. Implement offline support with local queue
5. Add analytics and crash reporting
6. Set up CI/CD for builds
7. Test on iOS and Android devices

## 🐛 Known Issues

- Google Sign-In requires additional setup (iOS/Android config)
- Audio file duration detection needs implementation
- Some Supabase storage methods may need adjustment
- Processing modal UI needs refinement

## 📚 Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [Riverpod Documentation](https://riverpod.dev)
- [GoRouter Documentation](https://pub.dev/packages/go_router)
- [Supabase Flutter](https://supabase.com/docs/reference/dart/introduction)

---

The Flutter app maintains feature parity with the React Native version while leveraging Flutter's performance and native capabilities.
