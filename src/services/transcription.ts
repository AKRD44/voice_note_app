/**
 * Transcription Service
 * Handles audio transcription using OpenAI Whisper API
 */

import { transcribeAudio, estimateCost } from '../lib/openai';
import * as FileSystem from 'expo-file-system';

export interface TranscriptionOptions {
  language?: string; // ISO 639-1 code (e.g., 'en', 'es', 'fr')
  prompt?: string; // Optional context for better accuracy
  temperature?: number; // 0-1, lower is more conservative
}

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number; // Processing duration in ms
  audioLength?: number; // Audio length in seconds
  cost?: number;
  error?: Error;
}

/**
 * Supported languages for transcription
 */
export const SUPPORTED_LANGUAGES = {
  'en': { name: 'English', code: 'en' },
  'es': { name: 'Spanish', code: 'es' },
  'fr': { name: 'French', code: 'fr' },
  'de': { name: 'German', code: 'de' },
  'pt': { name: 'Portuguese', code: 'pt' },
  'it': { name: 'Italian', code: 'it' },
  'ja': { name: 'Japanese', code: 'ja' },
  'ko': { name: 'Korean', code: 'ko' },
  'zh': { name: 'Chinese', code: 'zh' },
} as const;

export type SupportedLanguageCode = keyof typeof SUPPORTED_LANGUAGES;

/**
 * Transcription Service Class
 */
export class TranscriptionService {
  /**
   * Transcribe audio file using Whisper API
   * @param audioUri - Local audio file URI
   * @param options - Transcription options
   * @returns Transcription result
   */
  static async transcribe(
    audioUri: string,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    try {
      // Validate file exists
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }

      // Validate file size (25MB max for Whisper API)
      const maxSize = 26214400; // 25MB
      if (fileInfo.size && fileInfo.size > maxSize) {
        throw new Error(`Audio file too large: ${(fileInfo.size / 1024 / 1024).toFixed(2)}MB. Maximum is 25MB`);
      }

      // Convert file to Blob
      const blob = await this.fileUriToBlob(audioUri);

      // Create File object from Blob (required by OpenAI SDK)
      const file = new File([blob], 'audio.m4a', { type: 'audio/m4a' });

      // Transcribe audio
      const result = await transcribeAudio(file, options);

      if (result.error) {
        throw result.error;
      }

      // Calculate cost estimate
      const audioLength = await this.getAudioLength(audioUri);
      const cost = estimateCost.whisper(audioLength);

      return {
        text: result.text,
        language: result.language,
        duration: result.duration,
        audioLength,
        cost,
      };
    } catch (error) {
      console.error('Transcription error:', error);
      return {
        text: '',
        error: error instanceof Error ? error : new Error('Transcription failed'),
      };
    }
  }

  /**
   * Transcribe with automatic language detection
   */
  static async transcribeAuto(audioUri: string): Promise<TranscriptionResult> {
    return await this.transcribe(audioUri); // Whisper auto-detects language
  }

  /**
   * Transcribe with specific language
   */
  static async transcribeWithLanguage(
    audioUri: string,
    languageCode: SupportedLanguageCode
  ): Promise<TranscriptionResult> {
    return await this.transcribe(audioUri, { language: languageCode });
  }

  /**
   * Transcribe large audio file by chunking
   * For files over 25MB, split into chunks
   */
  static async transcribeLargeFile(
    audioUri: string,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    try {
      // Check file size
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }

      // If under 25MB, use regular transcription
      const maxSize = 26214400; // 25MB
      if (!fileInfo.size || fileInfo.size <= maxSize) {
        return await this.transcribe(audioUri, options);
      }

      // TODO: Implement chunking for large files
      // For now, return error
      throw new Error(
        'Large file transcription not yet implemented. ' +
        'Please record shorter segments (under 25MB/~15 minutes).'
      );
    } catch (error) {
      console.error('Large file transcription error:', error);
      return {
        text: '',
        error: error instanceof Error ? error : new Error('Transcription failed'),
      };
    }
  }

  /**
   * Convert file URI to Blob
   */
  private static async fileUriToBlob(fileUri: string): Promise<Blob> {
    try {
      const response = await fetch(fileUri);
      if (!response.ok) {
        throw new Error('Failed to read audio file');
      }
      return await response.blob();
    } catch (error) {
      console.error('Error converting file to blob:', error);
      throw new Error('Failed to prepare audio file for transcription');
    }
  }

  /**
   * Get audio file length in seconds
   */
  private static async getAudioLength(audioUri: string): Promise<number> {
    try {
      const { Audio } = await import('expo-av');
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      const status = await sound.getStatusAsync();
      await sound.unloadAsync();

      if (status.isLoaded && status.durationMillis) {
        return Math.round(status.durationMillis / 1000);
      }

      return 0;
    } catch (error) {
      console.error('Error getting audio length:', error);
      return 0;
    }
  }

  /**
   * Validate language code
   */
  static isLanguageSupported(code: string): code is SupportedLanguageCode {
    return code in SUPPORTED_LANGUAGES;
  }

  /**
   * Get language name from code
   */
  static getLanguageName(code: string): string {
    if (this.isLanguageSupported(code)) {
      return SUPPORTED_LANGUAGES[code].name;
    }
    return 'Unknown';
  }

  /**
   * Get all supported languages
   */
  static getSupportedLanguages(): typeof SUPPORTED_LANGUAGES {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * Estimate transcription cost
   */
  static estimateCost(durationInSeconds: number): number {
    return estimateCost.whisper(durationInSeconds);
  }

  /**
   * Retry transcription with exponential backoff
   */
  static async transcribeWithRetry(
    audioUri: string,
    options?: TranscriptionOptions,
    maxRetries: number = 3
  ): Promise<TranscriptionResult> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (attempt > 0) {
        // Exponential backoff
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Retrying transcription in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      const result = await this.transcribe(audioUri, options);

      if (!result.error) {
        return result;
      }

      lastError = result.error;
      console.error(`Transcription attempt ${attempt + 1} failed:`, result.error.message);
    }

    return {
      text: '',
      error: lastError || new Error('Transcription failed after retries'),
    };
  }

  /**
   * Get transcription quality score
   * Heuristic based on transcript characteristics
   */
  static assessTranscriptQuality(transcript: string): {
    score: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 100;

    // Check if transcript is too short
    if (transcript.length < 10) {
      issues.push('Transcript is too short');
      score -= 50;
    }

    // Check for repeated characters (might indicate audio issues)
    if (/(.)\1{10,}/.test(transcript)) {
      issues.push('Contains repeated characters (possible audio issue)');
      score -= 20;
    }

    // Check if transcript is all numbers (might indicate silence)
    if (/^\d+$/.test(transcript.trim())) {
      issues.push('Transcript contains only numbers');
      score -= 30;
    }

    // Check for reasonable word count
    const wordCount = transcript.split(/\s+/).length;
    if (wordCount < 3) {
      issues.push('Very few words detected');
      score -= 25;
    }

    return {
      score: Math.max(0, score),
      issues,
    };
  }
}

export default TranscriptionService;

