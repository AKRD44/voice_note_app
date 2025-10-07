/**
 * Processing Pipeline Service
 * Orchestrates the complete flow: Upload → Transcribe → Enhance → Save
 */

import { AudioUtils, UploadProgress } from '../utils/audioUtils';
import { TranscriptionService } from './transcription';
import { EnhancementService, EnhancementStyle } from './enhancement';
import { createRecording, updateRecording } from '../lib/supabase';

export interface ProcessingOptions {
  userId: string;
  audioUri: string;
  recordingId: string;
  style?: EnhancementStyle;
  language?: string;
  customPrompt?: string;
  isPremium?: boolean;
  onProgress?: (stage: ProcessingStage, progress: number) => void;
  onStageComplete?: (stage: ProcessingStage) => void;
}

export enum ProcessingStage {
  UPLOADING = 'uploading',
  TRANSCRIBING = 'transcribing',
  ENHANCING = 'enhancing',
  SAVING = 'saving',
  COMPLETE = 'complete',
  ERROR = 'error',
}

export interface ProcessingResult {
  recordingId: string;
  audioUrl: string;
  originalTranscript: string;
  enhancedTranscript: string;
  language: string;
  style: EnhancementStyle;
  duration: number;
  wordCount: number;
  characterCount: number;
  totalCost?: number;
  error?: Error;
}

/**
 * Processing Pipeline
 * Handles the complete workflow from audio file to enhanced transcript
 */
export class ProcessingPipeline {
  /**
   * Process a recording through the complete pipeline
   * 1. Upload audio to Supabase Storage
   * 2. Transcribe using OpenAI Whisper
   * 3. Enhance using GPT-4
   * 4. Save to database
   */
  static async process(options: ProcessingOptions): Promise<ProcessingResult> {
    const {
      userId,
      audioUri,
      recordingId,
      style = 'note',
      language,
      customPrompt,
      isPremium = false,
      onProgress,
      onStageComplete,
    } = options;

    let audioUrl = '';
    let originalTranscript = '';
    let enhancedTranscript = '';
    let detectedLanguage = language || 'en';
    let audioDuration = 0;
    let totalCost = 0;

    try {
      // ====================================================================
      // STAGE 1: Upload Audio to Cloud Storage (0-25%)
      // ====================================================================
      onProgress?.(ProcessingStage.UPLOADING, 0);

      const uploadResult = await AudioUtils.uploadWithRetry(
        audioUri,
        userId,
        recordingId,
        (progress: UploadProgress) => {
          // Map upload progress to 0-25%
          const overallProgress = (progress.percentage / 100) * 25;
          onProgress?.(ProcessingStage.UPLOADING, overallProgress);
        }
      );

      if (uploadResult.error) {
        throw new Error(`Upload failed: ${uploadResult.error.message}`);
      }

      audioUrl = uploadResult.url;
      onProgress?.(ProcessingStage.UPLOADING, 25);
      onStageComplete?.(ProcessingStage.UPLOADING);

      // ====================================================================
      // STAGE 2: Transcribe Audio with Whisper (25-60%)
      // ====================================================================
      onProgress?.(ProcessingStage.TRANSCRIBING, 25);

      const transcriptionResult = await TranscriptionService.transcribeWithRetry(
        audioUri,
        {
          language,
          temperature: 0,
        }
      );

      if (transcriptionResult.error) {
        throw new Error(`Transcription failed: ${transcriptionResult.error.message}`);
      }

      if (!transcriptionResult.text || transcriptionResult.text.trim().length === 0) {
        throw new Error('Transcription produced empty result. Please try speaking louder.');
      }

      originalTranscript = transcriptionResult.text;
      detectedLanguage = transcriptionResult.language || language || 'en';
      audioDuration = transcriptionResult.audioLength || 0;
      totalCost += transcriptionResult.cost || 0;

      onProgress?.(ProcessingStage.TRANSCRIBING, 60);
      onStageComplete?.(ProcessingStage.TRANSCRIBING);

      // ====================================================================
      // STAGE 3: Enhance with GPT-4 (60-90%)
      // ====================================================================
      onProgress?.(ProcessingStage.ENHANCING, 60);

      const enhancementResult = await EnhancementService.enhance(originalTranscript, {
        style,
        customPrompt,
        isPremium,
      });

      if (enhancementResult.error) {
        // If enhancement fails, use original transcript
        console.warn('Enhancement failed, using original transcript:', enhancementResult.error);
        enhancedTranscript = originalTranscript;
      } else {
        enhancedTranscript = enhancementResult.enhanced;
        totalCost += enhancementResult.cost || 0;
      }

      onProgress?.(ProcessingStage.ENHANCING, 90);
      onStageComplete?.(ProcessingStage.ENHANCING);

      // ====================================================================
      // STAGE 4: Save to Database (90-100%)
      // ====================================================================
      onProgress?.(ProcessingStage.SAVING, 90);

      // Calculate word and character counts
      const wordCount = enhancedTranscript.split(/\s+/).filter(w => w.length > 0).length;
      const characterCount = enhancedTranscript.length;

      // Create recording in database
      const recordingData = await createRecording({
        user_id: userId,
        title: `Recording ${new Date().toLocaleString()}`,
        audio_url: audioUrl,
        original_transcript: originalTranscript,
        enhanced_transcript: enhancedTranscript,
        language: detectedLanguage,
        style,
        duration: audioDuration,
        word_count: wordCount,
        character_count: characterCount,
      });

      onProgress?.(ProcessingStage.SAVING, 100);
      onStageComplete?.(ProcessingStage.SAVING);

      // ====================================================================
      // Complete!
      // ====================================================================
      onProgress?.(ProcessingStage.COMPLETE, 100);
      onStageComplete?.(ProcessingStage.COMPLETE);

      return {
        recordingId: recordingData.id,
        audioUrl,
        originalTranscript,
        enhancedTranscript,
        language: detectedLanguage,
        style,
        duration: audioDuration,
        wordCount,
        characterCount,
        totalCost,
      };
    } catch (error) {
      console.error('Processing pipeline error:', error);

      onProgress?.(ProcessingStage.ERROR, 0);
      onStageComplete?.(ProcessingStage.ERROR);

      // Cleanup: Delete uploaded audio if it exists
      if (audioUrl) {
        try {
          const pathParts = audioUrl.split('/');
          const filePath = `${userId}/${pathParts[pathParts.length - 1]}`;
          await AudioUtils.deleteFromSupabase(filePath);
        } catch (cleanupError) {
          console.error('Failed to cleanup after error:', cleanupError);
        }
      }

      return {
        recordingId,
        audioUrl,
        originalTranscript,
        enhancedTranscript,
        language: detectedLanguage,
        style,
        duration: audioDuration,
        wordCount: 0,
        characterCount: 0,
        totalCost,
        error: error instanceof Error ? error : new Error('Processing failed'),
      };
    }
  }

  /**
   * Get user-friendly stage name
   */
  static getStageName(stage: ProcessingStage): string {
    const stageNames = {
      [ProcessingStage.UPLOADING]: 'Uploading audio...',
      [ProcessingStage.TRANSCRIBING]: 'Transcribing your voice...',
      [ProcessingStage.ENHANCING]: 'Enhancing with AI...',
      [ProcessingStage.SAVING]: 'Saving your note...',
      [ProcessingStage.COMPLETE]: 'Complete!',
      [ProcessingStage.ERROR]: 'Processing failed',
    };

    return stageNames[stage] || 'Processing...';
  }

  /**
   * Get stage progress range
   */
  static getStageProgressRange(stage: ProcessingStage): { min: number; max: number } {
    const ranges = {
      [ProcessingStage.UPLOADING]: { min: 0, max: 25 },
      [ProcessingStage.TRANSCRIBING]: { min: 25, max: 60 },
      [ProcessingStage.ENHANCING]: { min: 60, max: 90 },
      [ProcessingStage.SAVING]: { min: 90, max: 100 },
      [ProcessingStage.COMPLETE]: { min: 100, max: 100 },
      [ProcessingStage.ERROR]: { min: 0, max: 0 },
    };

    return ranges[stage] || { min: 0, max: 0 };
  }

  /**
   * Estimate total processing time
   */
  static estimateProcessingTime(audioDurationSeconds: number): number {
    // Upload: ~5 seconds for typical file
    const uploadTime = 5;

    // Transcription: Whisper is fast, ~10-20% of audio length
    const transcriptionTime = audioDurationSeconds * 0.15;

    // Enhancement: GPT-4 varies, estimate 10-15 seconds
    const enhancementTime = 12;

    // Saving: Nearly instant, but add buffer
    const savingTime = 2;

    return Math.ceil(uploadTime + transcriptionTime + enhancementTime + savingTime);
  }
}

export default ProcessingPipeline;

