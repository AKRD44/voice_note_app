/**
 * AI Enhancement Service
 * Handles transcript enhancement using GPT-4
 */

import {
  enhanceTranscript,
  regenerateWithStyle,
  translateTranscript,
  EnhancementStyle,
  ENHANCEMENT_PROMPTS,
  estimateCost,
} from '../lib/openai';

export type { EnhancementStyle };

export interface EnhancementOptions {
  style: EnhancementStyle;
  customPrompt?: string;
  isPremium?: boolean;
}

export interface EnhancementResult {
  enhanced: string;
  tokensUsed?: number;
  cost?: number;
  style: EnhancementStyle;
  error?: Error;
}

export interface TranslationResult {
  translated: string;
  targetLanguage: string;
  tokensUsed?: number;
  cost?: number;
  error?: Error;
}

/**
 * Enhancement Service Class
 * Manages all AI enhancement operations
 */
export class EnhancementService {
  /**
   * Enhance a transcript with specified style
   */
  static async enhance(
    transcript: string,
    options: EnhancementOptions
  ): Promise<EnhancementResult> {
    try {
      // Validate inputs
      if (!transcript || transcript.trim().length === 0) {
        throw new Error('Transcript is empty');
      }

      // Check if custom prompts are allowed
      if (options.style === 'custom' && !options.isPremium) {
        throw new Error('Custom prompts are only available for premium users');
      }

      // Validate custom prompt if provided
      if (options.style === 'custom' && !options.customPrompt) {
        throw new Error('Custom prompt is required for custom style');
      }

      // Perform enhancement
      const result = await enhanceTranscript(
        transcript,
        options.style,
        options.customPrompt
      );

      if (result.error) {
        throw result.error;
      }

      // Validate output
      if (!result.enhanced || result.enhanced.trim().length === 0) {
        throw new Error('Enhancement produced empty result');
      }

      // Estimate cost
      const cost = result.tokensUsed
        ? estimateCost.gpt4(result.tokensUsed * 0.6, result.tokensUsed * 0.4) // Rough input/output split
        : undefined;

      return {
        enhanced: result.enhanced,
        tokensUsed: result.tokensUsed,
        cost,
        style: options.style,
      };
    } catch (error) {
      console.error('Enhancement error:', error);
      return {
        enhanced: '',
        style: options.style,
        error: error instanceof Error ? error : new Error('Enhancement failed'),
      };
    }
  }

  /**
   * Regenerate enhancement with a different style
   */
  static async regenerate(
    originalTranscript: string,
    newStyle: EnhancementStyle,
    customPrompt?: string,
    isPremium?: boolean
  ): Promise<EnhancementResult> {
    return await this.enhance(originalTranscript, {
      style: newStyle,
      customPrompt,
      isPremium,
    });
  }

  /**
   * Translate enhanced transcript to another language
   */
  static async translate(
    text: string,
    targetLanguage: string
  ): Promise<TranslationResult> {
    try {
      // Validate inputs
      if (!text || text.trim().length === 0) {
        throw new Error('Text is empty');
      }

      if (!targetLanguage) {
        throw new Error('Target language is required');
      }

      // Perform translation
      const result = await translateTranscript(text, targetLanguage);

      if (result.error) {
        throw result.error;
      }

      // Validate output
      if (!result.translated || result.translated.trim().length === 0) {
        throw new Error('Translation produced empty result');
      }

      // Estimate cost
      const cost = result.tokensUsed
        ? estimateCost.gpt4(result.tokensUsed * 0.6, result.tokensUsed * 0.4)
        : undefined;

      return {
        translated: result.translated,
        targetLanguage,
        tokensUsed: result.tokensUsed,
        cost,
      };
    } catch (error) {
      console.error('Translation error:', error);
      return {
        translated: '',
        targetLanguage,
        error: error instanceof Error ? error : new Error('Translation failed'),
      };
    }
  }

  /**
   * Get available styles
   * Free users get 3 basic styles, premium get all 6
   */
  static getAvailableStyles(isPremium: boolean = false): EnhancementStyle[] {
    const basicStyles: EnhancementStyle[] = ['note', 'email', 'summary'];
    const allStyles: EnhancementStyle[] = ['note', 'email', 'blog', 'summary', 'transcript', 'custom'];

    return isPremium ? allStyles : basicStyles;
  }

  /**
   * Get style display information
   */
  static getStyleInfo(style: EnhancementStyle): {
    name: string;
    description: string;
    example: string;
  } {
    const styleInfo = {
      note: {
        name: 'Note',
        description: 'Concise bullet points with headings',
        example: 'Perfect for meeting notes, ideas, and quick thoughts',
      },
      email: {
        name: 'Email',
        description: 'Professional email format',
        example: 'Structured with greeting, body, and closing',
      },
      blog: {
        name: 'Blog Post',
        description: 'Engaging narrative content',
        example: 'Storytelling with personality and flow',
      },
      summary: {
        name: 'Summary',
        description: 'Key points only (3-5 bullets)',
        example: 'Extract main ideas in brief format',
      },
      transcript: {
        name: 'Transcript',
        description: 'Verbatim with cleanup',
        example: 'Preserve all content, fix grammar',
      },
      custom: {
        name: 'Custom',
        description: 'Your own instructions',
        example: 'Premium only: Define your own style',
      },
    };

    return styleInfo[style] || styleInfo.note;
  }

  /**
   * Validate enhancement quality
   * Check if the enhancement is significantly better than original
   */
  static validateEnhancementQuality(
    original: string,
    enhanced: string
  ): {
    isValid: boolean;
    score: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 100;

    // Check if enhanced is too similar to original
    if (original.trim() === enhanced.trim()) {
      issues.push('Enhancement is identical to original');
      score -= 50;
    }

    // Check if enhanced is too short
    if (enhanced.length < original.length * 0.3) {
      issues.push('Enhancement is significantly shorter than original');
      score -= 20;
    }

    // Check if enhanced has basic punctuation
    if (!/[.!?]/.test(enhanced)) {
      issues.push('Enhancement lacks proper punctuation');
      score -= 15;
    }

    // Check for common filler words that should be removed
    const fillerWords = /\b(um|uh|like|you know|basically)\b/gi;
    if (fillerWords.test(enhanced)) {
      issues.push('Enhancement still contains filler words');
      score -= 10;
    }

    return {
      isValid: score >= 70,
      score,
      issues,
    };
  }

  /**
   * Get prompt preview for a style
   */
  static getPromptPreview(style: EnhancementStyle): string {
    return ENHANCEMENT_PROMPTS[style];
  }

  /**
   * Estimate cost for enhancement
   */
  static estimateEnhancementCost(transcriptLength: number): number {
    // Rough estimate: ~1 token per 4 characters
    const estimatedTokens = transcriptLength / 4;
    const inputTokens = estimatedTokens;
    const outputTokens = estimatedTokens * 0.8; // Slightly shorter output

    return estimateCost.gpt4(inputTokens, outputTokens);
  }

  /**
   * Batch enhance multiple transcripts
   * Process multiple recordings in sequence
   */
  static async batchEnhance(
    transcripts: Array<{ id: string; text: string }>,
    style: EnhancementStyle,
    onProgress?: (completed: number, total: number) => void
  ): Promise<Array<{ id: string; result: EnhancementResult }>> {
    const results: Array<{ id: string; result: EnhancementResult }> = [];

    for (let i = 0; i < transcripts.length; i++) {
      const { id, text } = transcripts[i];

      const result = await this.enhance(text, { style });
      results.push({ id, result });

      if (onProgress) {
        onProgress(i + 1, transcripts.length);
      }

      // Add small delay between requests to avoid rate limiting
      if (i < transcripts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

export default EnhancementService;

