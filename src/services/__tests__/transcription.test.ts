import { TranscriptionService } from '../transcription';
import { transcribeAudio, estimateCost } from '../../lib/openai';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

jest.mock('../../lib/openai');
jest.mock('expo-file-system');
jest.mock('expo-av');

describe('TranscriptionService', () => {
  const mockAudioUri = 'file:///test.m4a';

  beforeEach(() => {
    jest.clearAllMocks();
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      size: 1024000, // 1MB
    });
    (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
      sound: {
        getStatusAsync: jest.fn().mockResolvedValue({
          isLoaded: true,
          durationMillis: 60000, // 60 seconds
        }),
        unloadAsync: jest.fn().mockResolvedValue(undefined),
      },
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob()),
    });
  });

  describe('transcribe', () => {
    it('should transcribe audio successfully', async () => {
      (transcribeAudio as jest.Mock).mockResolvedValue({
        text: 'Hello world',
        language: 'en',
        duration: 1000,
      });

      const result = await TranscriptionService.transcribe(mockAudioUri);

      expect(result.text).toBe('Hello world');
      expect(result.language).toBe('en');
      expect(result.error).toBeUndefined();
    });

    it('should return error if file does not exist', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });

      const result = await TranscriptionService.transcribe(mockAudioUri);

      expect(result.error).toBeDefined();
      expect(result.text).toBe('');
    });

    it('should return error if file is too large', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 26214401, // > 25MB
      });

      const result = await TranscriptionService.transcribe(mockAudioUri);

      expect(result.error).toBeDefined();
      expect(result.text).toBe('');
    });

    it('should calculate cost estimate', async () => {
      (transcribeAudio as jest.Mock).mockResolvedValue({
        text: 'Test transcript',
        language: 'en',
        duration: 1000,
      });
      (estimateCost.whisper as jest.Mock).mockReturnValue(0.006);

      const result = await TranscriptionService.transcribe(mockAudioUri);

      expect(result.cost).toBe(0.006);
      expect(estimateCost.whisper).toHaveBeenCalled();
    });

    it('should handle transcription errors', async () => {
      (transcribeAudio as jest.Mock).mockResolvedValue({
        text: '',
        error: new Error('Transcription failed'),
      });

      const result = await TranscriptionService.transcribe(mockAudioUri);

      expect(result.error).toBeDefined();
      expect(result.text).toBe('');
    });
  });

  describe('transcribeAuto', () => {
    it('should transcribe with auto language detection', async () => {
      (transcribeAudio as jest.Mock).mockResolvedValue({
        text: 'Auto detected',
        language: 'en',
      });

      const result = await TranscriptionService.transcribeAuto(mockAudioUri);

      expect(result.text).toBe('Auto detected');
      expect(transcribeAudio).toHaveBeenCalledWith(expect.any(File), undefined);
    });
  });

  describe('transcribeWithLanguage', () => {
    it('should transcribe with specific language', async () => {
      (transcribeAudio as jest.Mock).mockResolvedValue({
        text: 'Spanish text',
        language: 'es',
      });

      const result = await TranscriptionService.transcribeWithLanguage(mockAudioUri, 'es');

      expect(result.text).toBe('Spanish text');
      expect(transcribeAudio).toHaveBeenCalledWith(
        expect.any(File),
        expect.objectContaining({ language: 'es' })
      );
    });
  });

  describe('transcribeLargeFile', () => {
    it('should use regular transcription for files under 25MB', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024000, // 1MB
      });
      (transcribeAudio as jest.Mock).mockResolvedValue({
        text: 'Small file',
      });

      const result = await TranscriptionService.transcribeLargeFile(mockAudioUri);

      expect(result.text).toBe('Small file');
      expect(result.error).toBeUndefined();
    });

    it('should return error for files over 25MB', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 26214401, // > 25MB
      });

      const result = await TranscriptionService.transcribeLargeFile(mockAudioUri);

      expect(result.error).toBeDefined();
      expect(result.text).toBe('');
    });
  });

  describe('isLanguageSupported', () => {
    it('should return true for supported languages', () => {
      expect(TranscriptionService.isLanguageSupported('en')).toBe(true);
      expect(TranscriptionService.isLanguageSupported('es')).toBe(true);
      expect(TranscriptionService.isLanguageSupported('fr')).toBe(true);
    });

    it('should return false for unsupported languages', () => {
      expect(TranscriptionService.isLanguageSupported('xx')).toBe(false);
      expect(TranscriptionService.isLanguageSupported('invalid')).toBe(false);
    });
  });

  describe('getLanguageName', () => {
    it('should return language name for supported languages', () => {
      expect(TranscriptionService.getLanguageName('en')).toBe('English');
      expect(TranscriptionService.getLanguageName('es')).toBe('Spanish');
    });

    it('should return Unknown for unsupported languages', () => {
      expect(TranscriptionService.getLanguageName('xx')).toBe('Unknown');
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return all supported languages', () => {
      const languages = TranscriptionService.getSupportedLanguages();
      expect(languages).toHaveProperty('en');
      expect(languages).toHaveProperty('es');
      expect(languages).toHaveProperty('fr');
    });
  });

  describe('estimateCost', () => {
    it('should estimate transcription cost', () => {
      (estimateCost.whisper as jest.Mock).mockReturnValue(0.012);

      const cost = TranscriptionService.estimateCost(120); // 2 minutes

      expect(cost).toBe(0.012);
      expect(estimateCost.whisper).toHaveBeenCalledWith(120);
    });
  });

  describe('transcribeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      (transcribeAudio as jest.Mock).mockResolvedValue({
        text: 'Success',
      });

      const result = await TranscriptionService.transcribeWithRetry(mockAudioUri);

      expect(result.text).toBe('Success');
      expect(result.error).toBeUndefined();
      expect(transcribeAudio).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      (transcribeAudio as jest.Mock)
        .mockResolvedValueOnce({ text: '', error: new Error('Failed') })
        .mockResolvedValueOnce({ text: 'Success after retry' });

      const result = await TranscriptionService.transcribeWithRetry(mockAudioUri, undefined, 2);

      expect(transcribeAudio).toHaveBeenCalledTimes(2);
      expect(result.text).toBe('Success after retry');
    });

    it('should return error after max retries', async () => {
      (transcribeAudio as jest.Mock).mockResolvedValue({
        text: '',
        error: new Error('Failed'),
      });

      const result = await TranscriptionService.transcribeWithRetry(mockAudioUri, undefined, 2);

      expect(transcribeAudio).toHaveBeenCalledTimes(2);
      expect(result.error).toBeDefined();
    });
  });

  describe('assessTranscriptQuality', () => {
    it('should return high score for good transcript', () => {
      const result = TranscriptionService.assessTranscriptQuality(
        'This is a good transcript with multiple words and proper content.'
      );

      expect(result.score).toBeGreaterThan(80);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect short transcript', () => {
      const result = TranscriptionService.assessTranscriptQuality('Short');

      expect(result.score).toBeLessThan(100);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should detect repeated characters', () => {
      const result = TranscriptionService.assessTranscriptQuality('aaaaaaaaaaaaaaaaaaaaa');

      expect(result.score).toBeLessThan(100);
      expect(result.issues).toContainEqual(
        expect.stringContaining('repeated characters')
      );
    });

    it('should detect numeric-only transcript', () => {
      const result = TranscriptionService.assessTranscriptQuality('123456789');

      expect(result.score).toBeLessThan(100);
      expect(result.issues).toContainEqual(
        expect.stringContaining('only numbers')
      );
    });
  });
});
