// Jest setup file for React Native testing
import '@testing-library/jest-native/extend-expect';

// Mock Expo modules
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(),
    getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
    Sound: {
      createAsync: jest.fn(() =>
        Promise.resolve({
          sound: {
            getStatusAsync: jest.fn(() =>
              Promise.resolve({
                isLoaded: true,
                durationMillis: 60000,
              })
            ),
            unloadAsync: jest.fn(() => Promise.resolve()),
          },
        })
      ),
    },
    RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4: 'mpeg_4',
    RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC: 'aac',
    RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC: 'mpeg4aac',
    RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM: 'medium',
    INTERRUPTION_MODE_IOS_DO_NOT_MIX: 'doNotMix',
    INTERRUPTION_MODE_ANDROID_DO_NOT_MIX: 'doNotMix',
  },
}));

jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn(() =>
    Promise.resolve({
      exists: true,
      size: 1024000,
      modificationTime: Date.now() / 1000,
    })
  ),
  deleteAsync: jest.fn(() => Promise.resolve()),
  copyAsync: jest.fn(() => Promise.resolve()),
  readDirectoryAsync: jest.fn(() => Promise.resolve([])),
  documentDirectory: 'file:///mock/document/',
  cacheDirectory: 'file:///mock/cache/',
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Medium: 'medium',
  },
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: () => null,
  }),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: () => null,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }) => children,
}));

jest.mock('@env', () => ({
  OPENAI_API_KEY: 'test-key',
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON_KEY: 'test-key',
  GOOGLE_CLIENT_ID: 'test-client-id',
}));

// Mock Supabase
jest.mock('./src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        remove: jest.fn(),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://test.url' } })),
      })),
    },
  },
  getUserRecordings: jest.fn(),
  createRecording: jest.fn(),
  updateRecording: jest.fn(),
  deleteRecording: jest.fn(),
  uploadAudioFile: jest.fn(),
  deleteAudioFile: jest.fn(),
}));

// Mock OpenAI
jest.mock('./src/lib/openai', () => ({
  openai: {
    audio: {
      transcriptions: {
        create: jest.fn(),
      },
    },
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
    models: {
      list: jest.fn(),
    },
  },
  transcribeAudio: jest.fn(),
  enhanceTranscript: jest.fn(),
  estimateCost: {
    whisper: jest.fn(),
    gpt4: jest.fn(),
    recording: jest.fn(),
  },
}));

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
