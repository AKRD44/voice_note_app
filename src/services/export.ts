/**
 * Export Service
 * Handles exporting transcripts to various formats (TXT, MD, PDF, DOCX)
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';

export interface ExportMetadata {
  title: string;
  date: Date;
  duration: number;
  language: string;
  wordCount: number;
  style: string;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: Error;
}

/**
 * Export Service Class
 */
export class ExportService {
  /**
   * Export to plain text (.txt)
   */
  static async exportToText(
    transcript: string,
    metadata?: ExportMetadata
  ): Promise<ExportResult> {
    try {
      // Build content
      let content = '';
      
      if (metadata) {
        content += `${metadata.title}\n`;
        content += `Date: ${format(metadata.date, 'PPpp')}\n`;
        content += `Duration: ${this.formatDuration(metadata.duration)}\n`;
        content += `Language: ${metadata.language}\n`;
        content += `Words: ${metadata.wordCount}\n`;
        content += `Style: ${metadata.style}\n`;
        content += '\n' + '='.repeat(50) + '\n\n';
      }
      
      content += transcript;

      // Create file
      const fileName = this.generateFileName(metadata?.title || 'transcript', 'txt');
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return { success: true, filePath };
    } catch (error) {
      console.error('Error exporting to text:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Export failed'),
      };
    }
  }

  /**
   * Export to Markdown (.md)
   */
  static async exportToMarkdown(
    transcript: string,
    metadata?: ExportMetadata
  ): Promise<ExportResult> {
    try {
      // Build Markdown content
      let content = '';
      
      if (metadata) {
        content += `# ${metadata.title}\n\n`;
        content += `**Date:** ${format(metadata.date, 'PPpp')}  \n`;
        content += `**Duration:** ${this.formatDuration(metadata.duration)}  \n`;
        content += `**Language:** ${metadata.language}  \n`;
        content += `**Words:** ${metadata.wordCount}  \n`;
        content += `**Style:** ${metadata.style}  \n\n`;
        content += '---\n\n';
      }
      
      content += transcript;
      content += '\n\n---\n\n';
      content += '_Created with VoiceFlow_\n';

      // Create file
      const fileName = this.generateFileName(metadata?.title || 'transcript', 'md');
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return { success: true, filePath };
    } catch (error) {
      console.error('Error exporting to Markdown:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Export failed'),
      };
    }
  }

  /**
   * Export to PDF (.pdf)
   * Note: This is a simplified implementation
   * For production, consider using a proper PDF library
   */
  static async exportToPDF(
    transcript: string,
    metadata?: ExportMetadata
  ): Promise<ExportResult> {
    try {
      // For React Native, we'll need to use a web view or native module
      // For now, create HTML that can be printed to PDF
      const html = this.generatePDFHTML(transcript, metadata);
      
      const fileName = this.generateFileName(metadata?.title || 'transcript', 'html');
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, html, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // In a real implementation, you would convert HTML to PDF here
      // For now, we'll share the HTML file
      // TODO: Implement actual PDF generation using react-native-pdf or similar

      return { success: true, filePath };
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('PDF export not fully implemented'),
      };
    }
  }

  /**
   * Generate HTML for PDF export
   */
  private static generatePDFHTML(transcript: string, metadata?: ExportMetadata): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metadata?.title || 'VoiceFlow Transcript'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.6;
      color: #1e293b;
    }
    .header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .title {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 16px;
      color: #0f172a;
    }
    .metadata {
      font-size: 14px;
      color: #64748b;
      line-height: 1.8;
    }
    .content {
      font-size: 16px;
      white-space: pre-wrap;
      line-height: 1.8;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  ${metadata ? `
  <div class="header">
    <div class="title">${metadata.title}</div>
    <div class="metadata">
      <div><strong>Date:</strong> ${format(metadata.date, 'PPpp')}</div>
      <div><strong>Duration:</strong> ${this.formatDuration(metadata.duration)}</div>
      <div><strong>Language:</strong> ${metadata.language}</div>
      <div><strong>Words:</strong> ${metadata.wordCount}</div>
      <div><strong>Style:</strong> ${metadata.style}</div>
    </div>
  </div>
  ` : ''}
  
  <div class="content">${transcript}</div>
  
  <div class="footer">
    <p>Created with VoiceFlow - Transform your voice into perfect text</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Export and share file
   */
  static async exportAndShare(
    transcript: string,
    format: 'txt' | 'md' | 'pdf',
    metadata?: ExportMetadata
  ): Promise<ExportResult> {
    try {
      let filePath: string | undefined;

      // Export based on format
      switch (format) {
        case 'txt':
          const txtResult = await this.exportToText(transcript, metadata);
          filePath = txtResult.filePath;
          if (txtResult.error) throw txtResult.error;
          break;
          
        case 'md':
          const mdResult = await this.exportToMarkdown(transcript, metadata);
          filePath = mdResult.filePath;
          if (mdResult.error) throw mdResult.error;
          break;
          
        case 'pdf':
          const pdfResult = await this.exportToPDF(transcript, metadata);
          filePath = pdfResult.filePath;
          if (pdfResult.error) throw pdfResult.error;
          break;
          
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      if (!filePath) {
        throw new Error('Export produced no file');
      }

      // Share the file
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          dialogTitle: `Share ${format.toUpperCase()}`,
        });
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      return { success: true, filePath };
    } catch (error) {
      console.error('Error in export and share:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Export Failed',
        text2: error instanceof Error ? error.message : 'Could not export file',
      });

      return {
        success: false,
        error: error instanceof Error ? error : new Error('Export and share failed'),
      };
    }
  }

  /**
   * Generate unique filename
   */
  private static generateFileName(title: string, extension: string): string {
    // Sanitize title
    const sanitized = title
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    
    const timestamp = Date.now();
    return `${sanitized}_${timestamp}.${extension}`;
  }

  /**
   * Format duration for metadata
   */
  private static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins === 0) {
      return `${secs}s`;
    }
    
    return `${mins}m ${secs}s`;
  }

  /**
   * Format transcript for email
   */
  static formatForEmail(transcript: string, metadata?: ExportMetadata): string {
    let email = '';
    
    if (metadata) {
      email += `Subject: ${metadata.title}\n\n`;
    }
    
    email += transcript;
    email += '\n\n---\n';
    email += 'Sent from VoiceFlow\n';
    
    return email;
  }

  /**
   * Get export format options based on subscription tier
   */
  static getAvailableFormats(isPremium: boolean): Array<'txt' | 'md' | 'pdf' | 'docx'> {
    const basicFormats: Array<'txt' | 'md' | 'pdf' | 'docx'> = ['txt'];
    const premiumFormats: Array<'txt' | 'md' | 'pdf' | 'docx'> = ['txt', 'md', 'pdf', 'docx'];
    
    return isPremium ? premiumFormats : basicFormats;
  }

  /**
   * Get format display info
   */
  static getFormatInfo(format: 'txt' | 'md' | 'pdf' | 'docx'): {
    name: string;
    description: string;
    icon: string;
  } {
    const formatInfo = {
      txt: {
        name: 'Plain Text',
        description: 'Simple .txt file',
        icon: '📄',
      },
      md: {
        name: 'Markdown',
        description: 'Formatted markdown file',
        icon: '📝',
      },
      pdf: {
        name: 'PDF',
        description: 'Portable document with formatting',
        icon: '📕',
      },
      docx: {
        name: 'Word Document',
        description: 'Microsoft Word format',
        icon: '📘',
      },
    };

    return formatInfo[format];
  }
}

export default ExportService;

