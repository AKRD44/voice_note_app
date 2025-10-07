import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface AudioProcessingResult {
  duration: number;
  fileSize: number;
  format: string;
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
}