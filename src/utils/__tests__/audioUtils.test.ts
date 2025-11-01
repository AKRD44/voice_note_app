import { AudioUtils } from '../utils/audioUtils';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { uploadAudioFile, deleteAudioFile } from '../../lib/supabase';

jest.mock('expo-av');
jest.mock('expo-file-system');
jest.mock('../../lib/supabase');

describe('AudioUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob()),
    });
  });

  describe('configureAudioSession', () => {
    it('should configure audio session', async () => {
      (Audio.setAudioModeAsync as jest.Mock).mockResolvedValue(undefined);

      await AudioUtils.configureAudioSession();

      expect(Audio.setAudioModeAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        })
      );
    });

    it('should throw error on failure', async () => {
      (Audio.setAudioModeAsync as jest.Mock).mockRejectedValue(
        new Error('Configuration failed')
      );

      await expect(AudioUtils.configureAudioSession()).rejects.toThrow();
    });
  });

  describe('getAudioInfo', () => {
    it('should get audio file information', async () => {
      const mockUri = 'file:///test.m4a';
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024000,
      });
      (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
        sound: {
          getStatusAsync: jest.fn().mockResolvedValue({
            isLoaded: true,
            durationMillis: 60000,
          }),
          unloadAsync: jest.fn().mockResolvedValue(undefined),
        },
      });

      const info = await AudioUtils.getAudioInfo(mockUri);

      expect(info.duration).toBe(60000);
      expect(info.fileSize).toBe(1024000);
      expect(info.format).toBe('M4A');
    });

    it('should throw error if file does not exist', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });

      await expect(AudioUtils.getAudioInfo('file:///nonexistent.m4a')).rejects.toThrow();
    });
  });

  describe('compressAudio', () => {
    it('should compress audio file', async () => {
      const sourceUri = 'file:///source.m4a';
      const targetUri = 'file:///compressed.m4a';
      (FileSystem.copyAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await AudioUtils.compressAudio(sourceUri, targetUri, 'medium');

      expect(result).toBe(targetUri);
      expect(FileSystem.copyAsync).toHaveBeenCalledWith({
        from: sourceUri,
        to: targetUri,
      });
    });
  });

  describe('validateAudioQuality', () => {
    it('should validate high quality audio', () => {
      const result = AudioUtils.validateAudioQuality(5000000, 60000); // 5MB, 60s

      expect(result.quality).toBe('high');
      expect(result.isValid).toBe(true);
    });

    it('should detect low quality audio', () => {
      const result = AudioUtils.validateAudioQuality(50000, 60000); // 50KB, 60s

      expect(result.quality).toBe('low');
      expect(result.isValid).toBe(false);
    });

    it('should detect medium quality audio', () => {
      const result = AudioUtils.validateAudioQuality(500000, 60000); // 500KB, 60s

      expect(result.quality).toBe('medium');
      expect(result.isValid).toBe(true);
    });
  });

  describe('generateWaveformData', () => {
    it('should generate waveform data', () => {
      const waveform = AudioUtils.generateWaveformData(100);

      expect(waveform).toHaveLength(100);
      waveform.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0.2);
        expect(value).toBeLessThanOrEqual(1.0);
      });
    });

    it('should generate default number of samples', () => {
      const waveform = AudioUtils.generateWaveformData();

      expect(waveform.length).toBeGreaterThan(0);
    });
  });

  describe('checkRecordingSupport', () => {
    it('should return true if permissions granted', async () => {
      (Audio.getPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: true,
      });

      const supported = await AudioUtils.checkRecordingSupport();

      expect(supported).toBe(true);
    });

    it('should return false if permissions denied', async () => {
      (Audio.getPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: false,
      });

      const supported = await AudioUtils.checkRecordingSupport();

      expect(supported).toBe(false);
    });
  });

  describe('getOptimalRecordingSettings', () => {
    it('should return optimal recording settings', () => {
      const settings = AudioUtils.getOptimalRecordingSettings();

      expect(settings.android).toBeDefined();
      expect(settings.ios).toBeDefined();
      expect(settings.android.extension).toBe('.m4a');
      expect(settings.ios.extension).toBe('.m4a');
    });
  });

  describe('uploadToSupabase', () => {
    it('should upload audio file successfully', async () => {
      const mockUri = 'file:///test.m4a';
      const userId = 'user-123';
      const recordingId = 'rec-123';

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024000,
      });
      (uploadAudioFile as jest.Mock).mockResolvedValue({
        path: 'audio/test.m4a',
        url: 'https://test.com/audio.m4a',
      });

      const result = await AudioUtils.uploadToSupabase(mockUri, userId, recordingId);

      expect(result.url).toBe('https://test.com/audio.m4a');
      expect(result.error).toBeUndefined();
    });

    it('should call progress callback', async () => {
      const mockUri = 'file:///test.m4a';
      const userId = 'user-123';
      const recordingId = 'rec-123';
      const onProgress = jest.fn();

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024000,
      });
      (uploadAudioFile as jest.Mock).mockImplementation((_, __, ___, progressCallback) => {
        progressCallback(0.5);
        return Promise.resolve({
          path: 'audio/test.m4a',
          url: 'https://test.com/audio.m4a',
        });
      });

      await AudioUtils.uploadToSupabase(mockUri, userId, recordingId, onProgress);

      expect(onProgress).toHaveBeenCalled();
    });

    it('should reject files that are too large', async () => {
      const mockUri = 'file:///large.m4a';
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 52428801, // > 50MB
      });

      const result = await AudioUtils.uploadToSupabase(
        mockUri,
        'user-123',
        'rec-123'
      );

      expect(result.error).toBeDefined();
    });
  });

  describe('uploadWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockUri = 'file:///test.m4a';
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024000,
      });
      (uploadAudioFile as jest.Mock).mockResolvedValue({
        path: 'audio/test.m4a',
        url: 'https://test.com/audio.m4a',
      });

      const result = await AudioUtils.uploadWithRetry(
        mockUri,
        'user-123',
        'rec-123'
      );

      expect(result.error).toBeUndefined();
      expect(uploadAudioFile).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const mockUri = 'file:///test.m4a';
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024000,
      });
      (uploadAudioFile as jest.Mock)
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({
          path: 'audio/test.m4a',
          url: 'https://test.com/audio.m4a',
        });

      const result = await AudioUtils.uploadWithRetry(mockUri, 'user-123', 'rec-123', undefined, 2);

      expect(uploadAudioFile).toHaveBeenCalledTimes(2);
      expect(result.error).toBeUndefined();
    });
  });

  describe('deleteFromSupabase', () => {
    it('should delete audio file successfully', async () => {
      (deleteAudioFile as jest.Mock).mockResolvedValue(undefined);

      const result = await AudioUtils.deleteFromSupabase('audio/test.m4a');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle deletion errors', async () => {
      (deleteAudioFile as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      const result = await AudioUtils.deleteFromSupabase('audio/test.m4a');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateForUpload', () => {
    it('should validate valid file', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024000,
      });

      const result = await AudioUtils.validateForUpload('file:///test.m4a');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-existent file', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });

      const result = await AudioUtils.validateForUpload('file:///nonexistent.m4a');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject files that are too large', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 52428801, // > 50MB
      });

      const result = await AudioUtils.validateForUpload('file:///large.m4a', 50);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject invalid file extensions', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024000,
      });

      const result = await AudioUtils.validateForUpload('file:///test.txt');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('estimateUploadTime', () => {
    it('should estimate upload time', () => {
      const fileSizeBytes = 10 * 1024 * 1024; // 10MB
      const networkSpeedMbps = 5;

      const estimatedTime = AudioUtils.estimateUploadTime(fileSizeBytes, networkSpeedMbps);

      expect(estimatedTime).toBeGreaterThan(0);
      expect(typeof estimatedTime).toBe('number');
    });
  });

  describe('cleanupFailedUpload', () => {
    it('should cleanup local and cloud files', async () => {
      const localUri = 'file:///local.m4a';
      const cloudPath = 'audio/test.m4a';

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });
      (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);
      (deleteAudioFile as jest.Mock).mockResolvedValue(undefined);

      await AudioUtils.cleanupFailedUpload(localUri, cloudPath);

      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(localUri);
      expect(deleteAudioFile).toHaveBeenCalledWith(cloudPath);
    });
  });
});
