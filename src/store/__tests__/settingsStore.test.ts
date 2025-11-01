import { renderHook, act } from '@testing-library/react-native';
import { useSettingsStore } from '../settingsStore';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store');

describe('settingsStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useSettingsStore.getState();
    store.theme = 'auto';
    store.language = 'en-US';
    store.subscription.tier = 'free';
  });

  describe('initializeSettings', () => {
    it('should initialize with default settings', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

      const { result } = renderHook(() => useSettingsStore());

      await act(async () => {
        await result.current.initializeSettings();
      });

      expect(result.current.theme).toBe('auto');
      expect(result.current.subscription.tier).toBe('free');
    });

    it('should upgrade to premium if hasPremium is true', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('true');

      const { result } = renderHook(() => useSettingsStore());

      await act(async () => {
        await result.current.initializeSettings();
      });

      expect(result.current.subscription.tier).toBe('premium');
      expect(result.current.maxRecordingDuration).toBe(900);
    });

    it('should keep free tier if hasPremium is false', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('false');

      const { result } = renderHook(() => useSettingsStore());

      await act(async () => {
        await result.current.initializeSettings();
      });

      expect(result.current.subscription.tier).toBe('free');
      expect(result.current.maxRecordingDuration).toBe(180);
    });
  });

  describe('setTheme', () => {
    it('should update theme', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
    });

    it('should accept all theme values', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setTheme('light');
      });
      expect(result.current.theme).toBe('light');

      act(() => {
        result.current.setTheme('dark');
      });
      expect(result.current.theme).toBe('dark');

      act(() => {
        result.current.setTheme('auto');
      });
      expect(result.current.theme).toBe('auto');
    });
  });

  describe('setLanguage', () => {
    it('should update language and default language', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setLanguage('es-ES');
      });

      expect(result.current.language).toBe('es-ES');
      expect(result.current.defaultLanguage).toBe('es-ES');
    });
  });

  describe('setNotificationSettings', () => {
    it('should update notification settings', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setNotificationSettings({
          processingComplete: false,
        });
      });

      expect(result.current.notifications.processingComplete).toBe(false);
      expect(result.current.notifications.dailyReminder).toBe(false); // Default value
    });

    it('should merge notification settings', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setNotificationSettings({
          dailyReminder: true,
        });
      });

      expect(result.current.notifications.dailyReminder).toBe(true);
      expect(result.current.notifications.processingComplete).toBe(true); // Should remain unchanged
    });
  });

  describe('setDefaultStyle', () => {
    it('should update default style', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setDefaultStyle('email');
      });

      expect(result.current.defaultStyle).toBe('email');
    });

    it('should accept all style values', () => {
      const { result } = renderHook(() => useSettingsStore());
      const styles = ['note', 'email', 'blog', 'summary', 'transcript', 'custom'] as const;

      styles.forEach((style) => {
        act(() => {
          result.current.setDefaultStyle(style);
        });
        expect(result.current.defaultStyle).toBe(style);
      });
    });
  });

  describe('setAudioQuality', () => {
    it('should update audio quality', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setAudioQuality('high');
      });

      expect(result.current.audioQuality).toBe('high');
    });

    it('should accept all quality values', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setAudioQuality('low');
      });
      expect(result.current.audioQuality).toBe('low');

      act(() => {
        result.current.setAudioQuality('medium');
      });
      expect(result.current.audioQuality).toBe('medium');

      act(() => {
        result.current.setAudioQuality('high');
      });
      expect(result.current.audioQuality).toBe('high');
    });
  });

  describe('updateUsage', () => {
    it('should update usage statistics', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.updateUsage({
          recordingsThisMonth: 5,
          minutesThisMonth: 30,
        });
      });

      expect(result.current.subscription.usage.recordingsThisMonth).toBe(5);
      expect(result.current.subscription.usage.minutesThisMonth).toBe(30);
    });

    it('should merge usage updates', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.updateUsage({
          recordingsThisMonth: 5,
        });
      });

      expect(result.current.subscription.usage.recordingsThisMonth).toBe(5);
      expect(result.current.subscription.usage.minutesThisMonth).toBe(0); // Should remain default

      act(() => {
        result.current.updateUsage({
          storageUsed: 100,
        });
      });

      expect(result.current.subscription.usage.recordingsThisMonth).toBe(5); // Should remain unchanged
      expect(result.current.subscription.usage.storageUsed).toBe(100);
    });
  });

  describe('resetUsage', () => {
    it('should reset all usage statistics', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.updateUsage({
          recordingsThisMonth: 10,
          minutesThisMonth: 60,
          storageUsed: 500,
        });
      });

      act(() => {
        result.current.resetUsage();
      });

      expect(result.current.subscription.usage.recordingsThisMonth).toBe(0);
      expect(result.current.subscription.usage.minutesThisMonth).toBe(0);
      expect(result.current.subscription.usage.storageUsed).toBe(0);
    });
  });
});
