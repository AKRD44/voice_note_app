import { renderHook, act } from '@testing-library/react-native';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

jest.mock('../contexts/AuthContext');
jest.mock('../../lib/supabase');
jest.mock('expo-image-picker');

describe('useProfile', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockProfile = {
    id: 'user-123',
    display_name: 'Test User',
    avatar_url: null,
    subscription_tier: 'free' as const,
    subscription_expires_at: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      profile: mockProfile,
      updateProfile: jest.fn().mockResolvedValue({ success: true }),
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob()),
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const { result } = renderHook(() => useProfile());

      let updateResult: any;

      await act(async () => {
        updateResult = await result.current.updateProfile({
          display_name: 'New Name',
        });
      });

      expect(updateResult.success).toBe(true);
    });

    it('should throw error if user not authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        profile: null,
        updateProfile: jest.fn(),
      });

      const { result } = renderHook(() => useProfile());

      await expect(
        result.current.updateProfile({ display_name: 'Test' })
      ).rejects.toThrow();
    });
  });

  describe('updateDisplayName', () => {
    it('should update display name', async () => {
      const { result } = renderHook(() => useProfile());

      await act(async () => {
        await result.current.updateDisplayName('New Display Name');
      });

      expect(result.current.isUpdating).toBe(false);
    });

    it('should reject empty display name', async () => {
      const { result } = renderHook(() => useProfile());

      await expect(
        result.current.updateDisplayName('')
      ).rejects.toThrow();
    });

    it('should reject display name longer than 50 characters', async () => {
      const { result } = renderHook(() => useProfile());

      await expect(
        result.current.updateDisplayName('a'.repeat(51))
      ).rejects.toThrow();
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar successfully', async () => {
      const mockUrl = 'https://test.com/avatar.jpg';
      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: mockUrl },
        }),
      });

      const { result } = renderHook(() => useProfile());

      let uploadResult: any;

      await act(async () => {
        uploadResult = await result.current.uploadAvatar('file:///avatar.jpg');
      });

      expect(uploadResult.success).toBe(true);
      expect(uploadResult.url).toBe(mockUrl);
    });

    it('should handle upload errors', async () => {
      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Upload failed'),
        }),
      });

      const { result } = renderHook(() => useProfile());

      let uploadResult: any;

      await act(async () => {
        uploadResult = await result.current.uploadAvatar('file:///avatar.jpg');
      });

      expect(uploadResult.success).toBe(false);
      expect(uploadResult.error).toBeDefined();
    });
  });

  describe('pickAvatar', () => {
    it('should pick avatar from gallery', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///picked.jpg' }],
      });

      const mockUrl = 'https://test.com/avatar.jpg';
      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: mockUrl },
        }),
      });

      const { result } = renderHook(() => useProfile());

      let pickResult: any;

      await act(async () => {
        pickResult = await result.current.pickAvatar();
      });

      expect(pickResult.success).toBe(true);
    });

    it('should handle permission denial', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const { result } = renderHook(() => useProfile());

      await expect(result.current.pickAvatar()).rejects.toThrow();
    });
  });

  describe('validateProfile', () => {
    it('should validate correct profile data', () => {
      const { result } = renderHook(() => useProfile());

      const validation = result.current.validateProfile({
        display_name: 'Valid Name',
      });

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect empty display name', () => {
      const { result } = renderHook(() => useProfile());

      const validation = result.current.validateProfile({
        display_name: '',
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid characters', () => {
      const { result } = renderHook(() => useProfile());

      const validation = result.current.validateProfile({
        display_name: 'Invalid@Name!',
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.stringContaining('invalid characters')
      );
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return free tier status', () => {
      const { result } = renderHook(() => useProfile());

      const status = result.current.getSubscriptionStatus();

      expect(status.tier).toBe('free');
      expect(status.isActive).toBe(false);
    });

    it('should return premium status with expiration', () => {
      const premiumProfile = {
        ...mockProfile,
        subscription_tier: 'premium' as const,
        subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        profile: premiumProfile,
        updateProfile: jest.fn(),
      });

      const { result } = renderHook(() => useProfile());

      const status = result.current.getSubscriptionStatus();

      expect(status.tier).toBe('premium');
      expect(status.isActive).toBe(true);
      expect(status.daysRemaining).toBeGreaterThan(0);
    });
  });
});
