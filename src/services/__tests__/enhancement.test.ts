import { EnhancementService } from '../enhancement';
import { enhanceTranscript, translateTranscript, estimateCost } from '../../lib/openai';

jest.mock('../../lib/openai');

describe('EnhancementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('enhance', () => {
    it('should enhance transcript successfully', async () => {
      (enhanceTranscript as jest.Mock).mockResolvedValue({
        enhanced: 'Enhanced text',
        tokensUsed: 100,
      });
      (estimateCost.gpt4 as jest.Mock).mockReturnValue(0.01);

      const result = await EnhancementService.enhance('Raw transcript', {
        style: 'note',
      });

      expect(result.enhanced).toBe('Enhanced text');
      expect(result.style).toBe('note');
      expect(result.error).toBeUndefined();
    });

    it('should reject empty transcript', async () => {
      const result = await EnhancementService.enhance('', {
        style: 'note',
      });

      expect(result.error).toBeDefined();
      expect(result.enhanced).toBe('');
    });

    it('should reject custom style for free users', async () => {
      const result = await EnhancementService.enhance('Test', {
        style: 'custom',
        isPremium: false,
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('premium');
    });

    it('should require custom prompt for custom style', async () => {
      const result = await EnhancementService.enhance('Test', {
        style: 'custom',
        isPremium: true,
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Custom prompt');
    });

    it('should handle enhancement errors', async () => {
      (enhanceTranscript as jest.Mock).mockResolvedValue({
        enhanced: '',
        error: new Error('API error'),
      });

      const result = await EnhancementService.enhance('Test', {
        style: 'note',
      });

      expect(result.error).toBeDefined();
      expect(result.enhanced).toBe('');
    });
  });

  describe('regenerate', () => {
    it('should regenerate with new style', async () => {
      (enhanceTranscript as jest.Mock).mockResolvedValue({
        enhanced: 'Regenerated text',
      });

      const result = await EnhancementService.regenerate('Original', 'email');

      expect(result.enhanced).toBe('Regenerated text');
      expect(result.style).toBe('email');
    });
  });

  describe('translate', () => {
    it('should translate text successfully', async () => {
      (translateTranscript as jest.Mock).mockResolvedValue({
        translated: 'Texto traducido',
        tokensUsed: 50,
      });
      (estimateCost.gpt4 as jest.Mock).mockReturnValue(0.005);

      const result = await EnhancementService.translate('Translated text', 'es');

      expect(result.translated).toBe('Texto traducido');
      expect(result.targetLanguage).toBe('es');
      expect(result.error).toBeUndefined();
    });

    it('should reject empty text', async () => {
      const result = await EnhancementService.translate('', 'es');

      expect(result.error).toBeDefined();
      expect(result.translated).toBe('');
    });

    it('should reject missing target language', async () => {
      const result = await EnhancementService.translate('Test', '');

      expect(result.error).toBeDefined();
    });
  });

  describe('getAvailableStyles', () => {
    it('should return basic styles for free users', () => {
      const styles = EnhancementService.getAvailableStyles(false);

      expect(styles).toEqual(['note', 'email', 'summary']);
      expect(styles).not.toContain('custom');
    });

    it('should return all styles for premium users', () => {
      const styles = EnhancementService.getAvailableStyles(true);

      expect(styles).toContain('note');
      expect(styles).toContain('email');
      expect(styles).toContain('blog');
      expect(styles).toContain('summary');
      expect(styles).toContain('transcript');
      expect(styles).toContain('custom');
    });
  });

  describe('getStyleInfo', () => {
    it('should return style information', () => {
      const info = EnhancementService.getStyleInfo('note');

      expect(info.name).toBe('Note');
      expect(info.description).toBeDefined();
      expect(info.example).toBeDefined();
    });

    it('should return note info for unknown style', () => {
      const info = EnhancementService.getStyleInfo('unknown' as any);

      expect(info.name).toBe('Note');
    });
  });

  describe('validateEnhancementQuality', () => {
    it('should validate good enhancement', () => {
      const result = EnhancementService.validateEnhancementQuality(
        'um hello uh this is a test',
        'Hello, this is a test.'
      );

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(70);
    });

    it('should detect identical enhancement', () => {
      const result = EnhancementService.validateEnhancementQuality(
        'Same text',
        'Same text'
      );

      expect(result.isValid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.stringContaining('identical')
      );
    });

    it('should detect filler words', () => {
      const result = EnhancementService.validateEnhancementQuality(
        'Test',
        'Um, this is a test, you know.'
      );

      expect(result.score).toBeLessThan(100);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('batchEnhance', () => {
    it('should enhance multiple transcripts', async () => {
      (enhanceTranscript as jest.Mock).mockResolvedValue({
        enhanced: 'Enhanced',
      });

      const transcripts = [
        { id: '1', text: 'First' },
        { id: '2', text: 'Second' },
      ];

      const results = await EnhancementService.batchEnhance(transcripts, 'note');

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('1');
      expect(results[1].id).toBe('2');
    });

    it('should call progress callback', async () => {
      (enhanceTranscript as jest.Mock).mockResolvedValue({
        enhanced: 'Enhanced',
      });

      const onProgress = jest.fn();
      const transcripts = [
        { id: '1', text: 'First' },
        { id: '2', text: 'Second' },
      ];

      await EnhancementService.batchEnhance(transcripts, 'note', onProgress);

      expect(onProgress).toHaveBeenCalledWith(1, 2);
      expect(onProgress).toHaveBeenCalledWith(2, 2);
    });
  });

  describe('estimateEnhancementCost', () => {
    it('should estimate cost', () => {
      (estimateCost.gpt4 as jest.Mock).mockReturnValue(0.05);

      const cost = EnhancementService.estimateEnhancementCost(1000);

      expect(cost).toBe(0.05);
      expect(estimateCost.gpt4).toHaveBeenCalled();
    });
  });
});
