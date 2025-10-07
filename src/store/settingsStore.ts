import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

interface SettingsState {
  // User preferences
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    processingComplete: boolean;
    dailyReminder: boolean;
    storageWarning: boolean;
  };
  
  // App settings
  autoSave: boolean;
  defaultStyle: 'note' | 'email' | 'blog' | 'summary' | 'transcript' | 'custom';
  defaultLanguage: string;
  maxRecordingDuration: number;
  audioQuality: 'low' | 'medium' | 'high';
  
  // Subscription and usage
  subscription: {
    tier: 'free' | 'premium';
    expiresAt?: Date;
    usage: {
      recordingsThisMonth: number;
      minutesThisMonth: number;
      storageUsed: number; // in MB
    };
  };
  
  // Actions
  initializeSettings: () => Promise<void>;
  setTheme: (theme: SettingsState['theme']) => void;
  setLanguage: (language: string) => void;
  setNotificationSettings: (settings: Partial<SettingsState['notifications']>) => void;
  setDefaultStyle: (style: SettingsState['defaultStyle']) => void;
  setAudioQuality: (quality: SettingsState['audioQuality']) => void;
  updateUsage: (usage: Partial<SettingsState['subscription']['usage']>) => void;
  resetUsage: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'auto',
      language: 'en-US',
      notifications: {
        processingComplete: true,
        dailyReminder: false,
        storageWarning: true,
      },
      autoSave: true,
      defaultStyle: 'note',
      defaultLanguage: 'en-US',
      maxRecordingDuration: 180, // 3 minutes for free tier
      audioQuality: 'medium',
      subscription: {
        tier: 'free',
        usage: {
          recordingsThisMonth: 0,
          minutesThisMonth: 0,
          storageUsed: 0,
        },
      },

      initializeSettings: async () => {
        // Check if user has premium subscription
        // This would typically involve an API call to your backend
        const hasPremium = await SecureStore.getItemAsync('hasPremium');
        
        if (hasPremium === 'true') {
          set((state) => ({
            subscription: {
              ...state.subscription,
              tier: 'premium',
              usage: {
                ...state.subscription.usage,
                // Reset limits for premium users
              },
            },
            maxRecordingDuration: 900, // 15 minutes for premium
          }));
        }
      },

      setTheme: (theme) => {
        set({ theme });
      },

      setLanguage: (language) => {
        set({ language, defaultLanguage: language });
      },

      setNotificationSettings: (settings) => {
        set((state) => ({
          notifications: { ...state.notifications, ...settings },
        }));
      },

      setDefaultStyle: (style) => {
        set({ defaultStyle: style });
      },

      setAudioQuality: (quality) => {
        set({ audioQuality: quality });
      },

      updateUsage: (usage) => {
        set((state) => ({
          subscription: {
            ...state.subscription,
            usage: { ...state.subscription.usage, ...usage },
          },
        }));
      },

      resetUsage: () => {
        set((state) => ({
          subscription: {
            ...state.subscription,
            usage: {
              recordingsThisMonth: 0,
              minutesThisMonth: 0,
              storageUsed: 0,
            },
          },
        }));
      },
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => SecureStore),
    }
  )
);