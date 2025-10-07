import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { uploadAudioFile, deleteAudioFile } from '../lib/supabase';

export interface AudioProcessingResult {
  duration: number;
  fileSize: number;
  format: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  path: string;
  url: string;
  error?: Error;
}

export class AudioUtils {
  /**
   * Configure audio session for recording
   */
  static async configureAudioSession(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      });
    } catch (error) {
      console.error('Failed to configure audio session:', error);
      throw error;
    }
  }

  /**
   * Get audio file information
   */
  static async getAudioInfo(uri: string): Promise<AudioProcessingResult> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }

      // Create a sound object to get duration
      const { sound } = await Audio.Sound.createAsync({ uri });
      const status = await sound.getStatusAsync();
      
      if (status.isLoaded) {
        await sound.unloadAsync();
        
        return {
          duration: status.durationMillis || 0,
          fileSize: fileInfo.size || 0,
          format: this.getFileFormat(uri),
        };
      } else {
        throw new Error('Could not load audio file');
      }
    } catch (error) {
      console.error('Failed to get audio info:', error);
      throw error;
    }
  }

  /**
   * Get file format from URI
   */
  private static getFileFormat(uri: string): string {
    const extension = uri.split('.').pop()?.toLowerCase();
    const formatMap: { [key: string]: string } = {
      'm4a': 'M4A',
      'mp3': 'MP3',
      'wav': 'WAV',
      'aac': 'AAC',
      'webm': 'WebM',
    };
    return formatMap[extension || ''] || 'Unknown';
  }

  /**
   * Compress audio file if needed
   */
  static async compressAudio(
    sourceUri: string,
    targetUri: string,
    quality: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<string> {
    try {
      // For now, we'll just copy the file
      // In a real implementation, you might use ffmpeg or similar
      await FileSystem.copyAsync({
        from: sourceUri,
        to: targetUri,
      });
      
      return targetUri;
    } catch (error) {
      console.error('Failed to compress audio:', error);
      throw error;
    }
  }

  /**
   * Validate audio quality
   */
  static validateAudioQuality(fileSize: number, duration: number): {
    isValid: boolean;
    quality: 'low' | 'medium' | 'high';
    bitrate: number;
  } {
    const bitrate = (fileSize * 8) / (duration / 1000); // bits per second
    
    let quality: 'low' | 'medium' | 'high';
    let isValid = true;
    
    if (bitrate < 32000) {
      quality = 'low';
      isValid = false;
    } else if (bitrate < 128000) {
      quality = 'medium';
    } else {
      quality = 'high';
    }
    
    return { isValid, quality, bitrate };
  }

  /**
   * Generate waveform data (simplified)
   */
  static generateWaveformData(samples: number = 100): number[] {
    return Array.from({ length: samples }, () => Math.random() * 0.8 + 0.2);
  }

  /**
   * Check if device supports recording
   */
  static async checkRecordingSupport(): Promise<boolean> {
    try {
      const status = await Audio.getPermissionsAsync();
      return status.granted;
    } catch (error) {
      console.error('Failed to check recording support:', error);
      return false;
    }
  }

  /**
   * Clean up audio files older than specified days
   */
  static async cleanupOldAudioFiles(directory: string, daysOld: number = 7): Promise<void> {
    try {
      const files = await FileSystem.readDirectoryAsync(directory);
      const now = Date.now();
      const cutoffTime = now - (daysOld * 24 * 60 * 60 * 1000);
      
      for (const file of files) {
        if (file.endsWith('.m4a') || file.endsWith('.mp3') || file.endsWith('.wav')) {
          const filePath = `${directory}/${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          
          if (fileInfo.exists && fileInfo.modificationTime) {
            const fileTime = fileInfo.modificationTime * 1000; // Convert to milliseconds
            if (fileTime < cutoffTime) {
              await FileSystem.deleteAsync(filePath);
              console.log(`Deleted old audio file: ${file}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old audio files:', error);
    }
  }

  /**
   * Calculate optimal recording settings based on device capabilities
   */
  static getOptimalRecordingSettings(): Audio.RecordingOptions {
    return {
      android: {
        extension: '.m4a',
        outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
        audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
        audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
    };
  }

  /**
   * Upload audio file to Supabase Storage
   * @param audioUri - Local file URI
   * @param userId - User ID for folder organization
   * @param recordingId - Unique recording ID
   * @param onProgress - Progress callback
   * @returns Upload result with cloud URL
   */
  static async uploadToSupabase(
    audioUri: string,
    userId: string,
    recordingId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Validate file exists
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }

      // Validate file size (50MB max for free tier)
      const maxSize = 52428800; // 50MB in bytes
      if (fileInfo.size && fileInfo.size > maxSize) {
        throw new Error(`File size ${(fileInfo.size / 1024 / 1024).toFixed(2)}MB exceeds maximum of 50MB`);
      }

      // Convert file to Blob for upload
      const blob = await this.fileUriToBlob(audioUri);

      // Simulate progress tracking (since we don't have real progress from Supabase)
      if (onProgress) {
        onProgress({ loaded: 0, total: blob.size, percentage: 0 });
      }

      // Upload to Supabase Storage
      const result = await uploadAudioFile(userId, recordingId, blob, (progress) => {
        if (onProgress) {
          onProgress({
            loaded: progress * blob.size,
            total: blob.size,
            percentage: progress * 100,
          });
        }
      });

      // Final progress callback
      if (onProgress) {
        onProgress({ loaded: blob.size, total: blob.size, percentage: 100 });
      }

      return {
        path: result.path,
        url: result.url,
      };
    } catch (error) {
      console.error('Error uploading audio to Supabase:', error);
      return {
        path: '',
        url: '',
        error: error instanceof Error ? error : new Error('Upload failed'),
      };
    }
  }

  /**
   * Convert file URI to Blob for upload
   * @param fileUri - Local file URI
   * @returns Blob object
   */
  private static async fileUriToBlob(fileUri: string): Promise<Blob> {
    try {
      const response = await fetch(fileUri);
      if (!response.ok) {
        throw new Error('Failed to read file');
      }
      return await response.blob();
    } catch (error) {
      console.error('Error converting file to blob:', error);
      throw new Error('Failed to convert file for upload');
    }
  }

  /**
   * Retry upload with exponential backoff
   * @param audioUri - Local file URI
   * @param userId - User ID
   * @param recordingId - Recording ID
   * @param onProgress - Progress callback
   * @param maxRetries - Maximum retry attempts
   * @returns Upload result
   */
  static async uploadWithRetry(
    audioUri: string,
    userId: string,
    recordingId: string,
    onProgress?: (progress: UploadProgress) => void,
    maxRetries: number = 3
  ): Promise<UploadResult> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (attempt > 0) {
        // Exponential backoff: wait 2^attempt seconds
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Retrying upload in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      const result = await this.uploadToSupabase(audioUri, userId, recordingId, onProgress);

      if (!result.error) {
        return result;
      }

      lastError = result.error;
      console.error(`Upload attempt ${attempt + 1} failed:`, result.error.message);
    }

    return {
      path: '',
      url: '',
      error: lastError || new Error('Upload failed after retries'),
    };
  }

  /**
   * Cancel ongoing upload
   * Note: This is a placeholder - actual implementation would need
   * to use AbortController with fetch/XMLHttpRequest
   */
  static cancelUpload(): void {
    console.log('Upload cancellation not yet implemented');
    // In a real implementation, you would:
    // 1. Store the AbortController for the current upload
    // 2. Call abortController.abort() here
    // 3. Clean up any partial uploads
  }

  /**
   * Delete audio file from Supabase Storage
   * @param filePath - Path in storage bucket
   */
  static async deleteFromSupabase(filePath: string): Promise<{ success: boolean; error?: Error }> {
    try {
      await deleteAudioFile(filePath);
      return { success: true };
    } catch (error) {
      console.error('Error deleting audio from Supabase:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Delete failed'),
      };
    }
  }

  /**
   * Cleanup failed upload
   * Deletes both local and cloud files
   * @param localUri - Local file URI
   * @param cloudPath - Cloud storage path (optional)
   */
  static async cleanupFailedUpload(localUri: string, cloudPath?: string): Promise<void> {
    try {
      // Delete local file
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(localUri);
        console.log('Deleted local file after failed upload');
      }

      // Delete cloud file if it was partially uploaded
      if (cloudPath) {
        await this.deleteFromSupabase(cloudPath);
        console.log('Deleted partial cloud upload');
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Validate file before upload
   * @param fileUri - Local file URI
   * @param maxSizeMB - Maximum file size in MB
   * @returns Validation result
   */
  static async validateForUpload(
    fileUri: string,
    maxSizeMB: number = 50
  ): Promise<{ valid: boolean; error?: string; fileInfo?: FileSystem.FileInfo }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (!fileInfo.exists) {
        return { valid: false, error: 'File does not exist' };
      }

      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (fileInfo.size && fileInfo.size > maxSizeBytes) {
        return {
          valid: false,
          error: `File size ${(fileInfo.size / 1024 / 1024).toFixed(2)}MB exceeds maximum of ${maxSizeMB}MB`,
          fileInfo,
        };
      }

      // Check file extension
      const validExtensions = ['.m4a', '.mp3', '.wav', '.webm', '.mp4', '.mpeg'];
      const hasValidExtension = validExtensions.some(ext => fileUri.toLowerCase().endsWith(ext));
      
      if (!hasValidExtension) {
        return {
          valid: false,
          error: 'Invalid file format. Supported formats: M4A, MP3, WAV, WebM, MP4',
          fileInfo,
        };
      }

      return { valid: true, fileInfo };
    } catch (error) {
      console.error('Error validating file:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  /**
   * Get upload progress estimate based on file size and network speed
   * @param fileSizeBytes - File size in bytes
   * @param networkSpeedMbps - Estimated network speed in Mbps
   * @returns Estimated upload time in seconds
   */
  static estimateUploadTime(fileSizeBytes: number, networkSpeedMbps: number = 5): number {
    const fileSizeMb = fileSizeBytes / 1024 / 1024;
    const estimatedSeconds = (fileSizeMb * 8) / networkSpeedMbps; // Convert to bits and divide by speed
    return Math.ceil(estimatedSeconds);
  }
}