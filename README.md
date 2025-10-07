# VoiceFlow - AI-Powered Voice Transcription App

A modern, cross-platform voice transcription application built with React Native and Expo. Transform your voice recordings into clean, organized text using AI-powered processing.

## Features

### 🎤 Voice Recording
- High-quality audio recording with real-time waveform visualization
- Pause/resume functionality during recording
- Configurable recording limits (3 min free, 15 min premium)
- Visual feedback with animated pulse effects

### 🤖 AI Processing
- Automatic transcription using AI services
- Content enhancement with grammar correction
- Filler word removal and sentence structuring
- Multiple output styles (Note, Email, Blog, Summary, Transcript)

### 📚 Library Management
- Organized recording library with search and filtering
- Grid and list view modes
- Detailed recording view with playback controls
- Export and sharing capabilities

### 🎨 Modern Design
- Inspired by 21st.dev aesthetic with glassmorphism effects
- Dark and light mode support
- Smooth animations and micro-interactions
- Responsive design for all screen sizes

### 🔧 Settings & Customization
- Theme preferences (Auto, Light, Dark)
- Recording quality settings
- Notification preferences
- Usage statistics and subscription management

## Tech Stack

- **Framework**: React Native with Expo
- **State Management**: Zustand
- **Navigation**: React Navigation v6
- **Audio**: Expo AV
- **Storage**: Expo SecureStore + MMKV
- **UI Components**: Custom components with glassmorphism
- **Animations**: React Native Reanimated
- **Icons**: Lucide React
- **Styling**: Tailwind CSS principles

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── RecordingCard.tsx
│   ├── WaveformVisualizer.tsx
│   ├── WelcomeModal.tsx
│   ├── ProcessingModal.tsx
│   ├── RecordingDetailModal.tsx
│   └── TabBar.tsx
├── screens/            # App screens
│   ├── HomeScreen.tsx
│   ├── RecordingScreen.tsx
│   ├── LibraryScreen.tsx
│   └── SettingsScreen.tsx
├── store/              # State management
│   ├── recordingStore.ts
│   └── settingsStore.ts
├── utils/              # Utility functions
│   └── audioUtils.ts
└── types/              # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 16+ 
- Expo CLI (`npm install -g expo-cli`)
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd voiceflow-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Development

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run ios` - Run on iOS simulator/device
- `npm run android` - Run on Android emulator/device
- `npm run web` - Run on web browser
- `npm run build` - Build for production using EAS

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with TypeScript support
- **Prettier**: Code formatting

## Deployment

### Expo Go Development

For development and testing:

1. Install Expo Go on your device
2. Scan the QR code from the development server
3. Test all features on device

### Production Build

#### iOS Build

1. Configure app.json with your Apple Developer credentials
2. Run build command:
```bash
eas build -p ios
```

#### Android Build

1. Configure app.json with your Android keystore
2. Run build command:
```bash
eas build -p android
```

#### Web Deployment

1. Build for web:
```bash
expo build:web
```

2. Deploy the web-build folder to your hosting provider

### App Store Submission

1. Configure app metadata in app.json
2. Build production app:
```bash
eas build -p ios --profile production
eas build -p android --profile production
```

3. Submit to stores:
```bash
eas submit -p ios
```

## Configuration

### Environment Variables

Create a `.env` file for sensitive configuration:

```env
EXPO_PUBLIC_API_URL=https://api.voiceflow.com
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### App Configuration

Key settings in `app.json`:

- **Bundle Identifier**: Update for iOS
- **Package Name**: Update for Android
- **Permissions**: Microphone and storage permissions configured
- **Deep Links**: Configure for authentication flow

## Features Implementation Status

### ✅ Completed
- Basic app structure and navigation
- Voice recording with waveform visualization
- Recording library with search/filter
- Settings screen with preferences
- Modern UI with animations
- Dark/light mode support
- Audio playback controls

### 🚧 In Progress
- AI transcription integration
- Cloud sync functionality
- Export features
- Subscription management

### 📋 Planned
- Real-time transcription preview
- Advanced editing features
- Collaboration tools
- Integration with other apps

## Design System

### Colors
- **Primary**: `#3b82f6` (Blue)
- **Secondary**: `#8b5cf6` (Purple)
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Amber)
- **Error**: `#ef4444` (Red)

### Typography
- **Primary**: Inter (sans-serif)
- **Code**: Geist Mono (monospace)

### Components
- Glassmorphism cards with backdrop blur
- Gradient buttons with hover effects
- Animated waveform visualizer
- Smooth modal transitions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

## Acknowledgments

- Design inspiration from 21st.dev
- Audio processing libraries
- React Native community
- Expo team for the amazing framework