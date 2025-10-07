/**
 * Sharing Service
 * Handles copy to clipboard and native sharing functionality
 */

import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

export interface ShareOptions {
  title?: string;
  message?: string;
  url?: string;
  dialogTitle?: string;
}

export interface ExportFormat {
  format: 'txt' | 'md' | 'pdf' | 'docx';
  includeMetadata?: boolean;
}

/**
 * Sharing Service Class
 */
export class SharingService {
  /**
   * Copy text to clipboard with haptic feedback and toast
   */
  static async copyToClipboard(
    text: string,
    successMessage: string = 'Copied to clipboard!'
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      await Clipboard.setStringAsync(text);
      
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Show success toast
      Toast.show({
        type: 'success',
        text1: successMessage,
        visibilityTime: 2000,
      });

      return { success: true };
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Copy Failed',
        text2: 'Could not copy to clipboard',
      });

      return {
        success: false,
        error: error instanceof Error ? error : new Error('Copy failed'),
      };
    }
  }

  /**
   * Copy transcript to clipboard
   */
  static async copyTranscript(
    transcript: string,
    includeTitle?: string
  ): Promise<{ success: boolean; error?: Error }> {
    const textToCopy = includeTitle
      ? `${includeTitle}\n\n${transcript}`
      : transcript;

    return await this.copyToClipboard(textToCopy, 'Transcript copied!');
  }

  /**
   * Share via native share sheet
   */
  static async share(options: ShareOptions): Promise<{ success: boolean; error?: Error }> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
      }

      // For text sharing, create a temporary file
      if (options.message && !options.url) {
        const fileName = `voiceflow_${Date.now()}.txt`;
        const filePath = `${FileSystem.cacheDirectory}${fileName}`;
        
        await FileSystem.writeAsStringAsync(filePath, options.message, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        await Sharing.shareAsync(filePath, {
          dialogTitle: options.dialogTitle || 'Share Note',
          mimeType: 'text/plain',
          UTI: 'public.plain-text',
        });

        // Clean up temporary file
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      } else if (options.url) {
        await Sharing.shareAsync(options.url, {
          dialogTitle: options.dialogTitle,
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      return { success: true };
    } catch (error) {
      console.error('Error sharing:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Share Failed',
        text2: 'Could not share content',
      });

      return {
        success: false,
        error: error instanceof Error ? error : new Error('Share failed'),
      };
    }
  }

  /**
   * Share transcript text
   */
  static async shareTranscript(
    transcript: string,
    title?: string
  ): Promise<{ success: boolean; error?: Error }> {
    const message = title
      ? `${title}\n\n${transcript}`
      : transcript;

    return await this.share({
      message,
      dialogTitle: 'Share Transcript',
    });
  }

  /**
   * Share audio file
   */
  static async shareAudio(
    audioUrl: string,
    title?: string
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      // Download audio file to local cache first
      const fileName = `recording_${Date.now()}.m4a`;
      const localPath = `${FileSystem.cacheDirectory}${fileName}`;
      
      await FileSystem.downloadAsync(audioUrl, localPath);

      await Sharing.shareAsync(localPath, {
        dialogTitle: title || 'Share Recording',
        mimeType: 'audio/m4a',
      });

      // Clean up after sharing
      setTimeout(async () => {
        try {
          await FileSystem.deleteAsync(localPath, { idempotent: true });
        } catch (error) {
          console.warn('Failed to cleanup shared audio file:', error);
        }
      }, 5000);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      return { success: true };
    } catch (error) {
      console.error('Error sharing audio:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Share Failed',
        text2: 'Could not share audio file',
      });

      return {
        success: false,
        error: error instanceof Error ? error : new Error('Share failed'),
      };
    }
  }

  /**
   * Get clipboard content (for paste functionality)
   */
  static async getClipboardContent(): Promise<{ content: string; error?: Error }> {
    try {
      const content = await Clipboard.getStringAsync();
      return { content };
    } catch (error) {
      console.error('Error getting clipboard content:', error);
      return {
        content: '',
        error: error instanceof Error ? error : new Error('Failed to read clipboard'),
      };
    }
  }

  /**
   * Check if device has clipboard content
   */
  static async hasClipboardContent(): Promise<boolean> {
    try {
      const content = await Clipboard.getStringAsync();
      return content.length > 0;
    } catch (error) {
      return false;
    }
  }
}

export default SharingService;

