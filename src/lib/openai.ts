import OpenAI from 'openai';
import { OPENAI_API_KEY } from '@env';

/**
 * OpenAI API Client Configuration
 * For Whisper transcription and GPT-4 enhancement
 */

// Validate API key
if (!OPENAI_API_KEY) {
  console.warn(
    'Missing OPENAI_API_KEY environment variable.\n' +
    'AI transcription and enhancement features will not work.\n' +
    'Please add OPENAI_API_KEY to your .env file.'
  );
}

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  timeout: 60000, // 60 second timeout
  maxRetries: 3, // Retry failed requests up to 3 times
});

/**
 * Style-specific enhancement prompts for GPT-4
 */
export const ENHANCEMENT_PROMPTS = {
  note: `You are an expert note-taking assistant. Transform this voice transcript into a clean, well-organized note.

Rules:
- Remove filler words (um, uh, like, you know, etc.)
- Fix grammar and punctuation
- Format as concise bullet points with headings where appropriate
- Maintain the original meaning and tone
- Keep it brief and scannable

Output only the enhanced note with no additional commentary.`,

  email: `You are a professional email writer. Transform this voice transcript into a well-structured email.

Rules:
- Remove filler words
- Fix grammar and punctuation
- Structure with: greeting (if mentioned), clear body paragraphs, closing (if appropriate)
- Use professional but friendly tone
- Maintain the original intent

Output only the enhanced email with no additional commentary.`,

  blog: `You are an engaging content writer. Transform this voice transcript into a compelling blog post section.

Rules:
- Remove filler words
- Fix grammar and punctuation
- Add engaging introductory sentence if needed
- Use storytelling techniques where appropriate
- Break into clear paragraphs
- Maintain the speaker's voice and personality

Output only the enhanced blog content with no additional commentary.`,

  summary: `You are a professional summarizer. Extract only the key points from this voice transcript.

Rules:
- Remove all filler words
- Extract only the main ideas
- Format as 3-5 concise bullet points
- Each point should be one clear sentence
- Prioritize the most important information

Output only the summary bullets with no additional commentary.`,

  transcript: `You are a transcription editor. Clean up this voice transcript while preserving all content.

Rules:
- Remove filler words (um, uh, like, you know)
- Fix grammar and punctuation
- Format into clear paragraphs
- Preserve all information and details
- Maintain the speaker's tone and style

Output only the cleaned transcript with no additional commentary.`,

  custom: `You are a helpful AI assistant. Transform this voice transcript according to the user's specific instructions.

Rules:
- Follow the custom instructions provided
- Remove filler words unless requested otherwise
- Fix grammar and punctuation
- Maintain the original meaning
- Apply the requested style or format

Output only the transformed content with no additional commentary.`,
} as const;

export type EnhancementStyle = keyof typeof ENHANCEMENT_PROMPTS;

/**
 * Transcribe audio using OpenAI Whisper API
 */
export const transcribeAudio = async (
  audioFile: File | Blob,
  options?: {
    language?: string;
    prompt?: string;
    temperature?: number;
  }
): Promise<{
  text: string;
  language?: string;
  duration?: number;
  error?: Error;
}> => {
  try {
    const startTime = Date.now();

    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: options?.language,
      prompt: options?.prompt,
      temperature: options?.temperature || 0,
      response_format: 'verbose_json',
    });

    const duration = Date.now() - startTime;

    return {
      text: response.text,
      language: (response as any).language,
      duration,
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return {
      text: '',
      error: error instanceof Error ? error : new Error('Failed to transcribe audio'),
    };
  }
};

/**
 * Enhance transcript using GPT-4
 */
export const enhanceTranscript = async (
  transcript: string,
  style: EnhancementStyle = 'note',
  customPrompt?: string
): Promise<{
  enhanced: string;
  tokensUsed?: number;
  error?: Error;
}> => {
  try {
    // Use custom prompt if provided and style is 'custom'
    const systemPrompt = style === 'custom' && customPrompt
      ? `${ENHANCEMENT_PROMPTS.custom}\n\nCustom Instructions: ${customPrompt}`
      : ENHANCEMENT_PROMPTS[style];

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Transcript:\n${transcript}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const enhanced = response.choices[0]?.message?.content || '';
    const tokensUsed = response.usage?.total_tokens;

    return {
      enhanced,
      tokensUsed,
    };
  } catch (error) {
    console.error('Error enhancing transcript:', error);
    return {
      enhanced: '',
      error: error instanceof Error ? error : new Error('Failed to enhance transcript'),
    };
  }
};

/**
 * Regenerate enhancement with a different style
 */
export const regenerateWithStyle = async (
  originalTranscript: string,
  newStyle: EnhancementStyle,
  customPrompt?: string
): Promise<{
  enhanced: string;
  tokensUsed?: number;
  error?: Error;
}> => {
  return await enhanceTranscript(originalTranscript, newStyle, customPrompt);
};

/**
 * Translate transcript to another language
 */
export const translateTranscript = async (
  text: string,
  targetLanguage: string
): Promise<{
  translated: string;
  tokensUsed?: number;
  error?: Error;
}> => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text to ${targetLanguage}. Maintain the tone and style. Output only the translation with no additional commentary.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const translated = response.choices[0]?.message?.content || '';
    const tokensUsed = response.usage?.total_tokens;

    return {
      translated,
      tokensUsed,
    };
  } catch (error) {
    console.error('Error translating transcript:', error);
    return {
      translated: '',
      error: error instanceof Error ? error : new Error('Failed to translate transcript'),
    };
  }
};

/**
 * Estimate cost for API operations
 * Prices as of 2024 (subject to change)
 */
export const estimateCost = {
  /**
   * Whisper API cost estimation
   * $0.006 per minute of audio
   */
  whisper: (durationInSeconds: number): number => {
    const minutes = durationInSeconds / 60;
    return minutes * 0.006;
  },

  /**
   * GPT-4 Turbo cost estimation
   * Input: $0.01 per 1K tokens
   * Output: $0.03 per 1K tokens
   */
  gpt4: (inputTokens: number, outputTokens: number): number => {
    const inputCost = (inputTokens / 1000) * 0.01;
    const outputCost = (outputTokens / 1000) * 0.03;
    return inputCost + outputCost;
  },

  /**
   * Estimate total cost for a recording
   * Assumes average transcript length and enhancement
   */
  recording: (durationInSeconds: number, enhancementStyle: EnhancementStyle = 'note'): number => {
    // Whisper cost
    const whisperCost = estimateCost.whisper(durationInSeconds);

    // Estimate tokens (rough average)
    const estimatedInputTokens = (durationInSeconds / 60) * 150; // ~150 tokens per minute of speech
    const estimatedOutputTokens = estimatedInputTokens * 0.8; // Roughly 80% of input

    // GPT-4 cost
    const gpt4Cost = estimateCost.gpt4(estimatedInputTokens, estimatedOutputTokens);

    return whisperCost + gpt4Cost;
  },
};

/**
 * Check if OpenAI API key is configured
 */
export const isOpenAIConfigured = (): boolean => {
  return !!OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-');
};

/**
 * Test OpenAI connection
 */
export const testConnection = async (): Promise<{
  success: boolean;
  error?: Error;
}> => {
  try {
    // Simple test to verify API key works
    await openai.models.list();
    return { success: true };
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Connection test failed'),
    };
  }
};

/**
 * Error types for better error handling
 */
export const OpenAIErrors = {
  INVALID_API_KEY: 'Invalid API key. Please check your OPENAI_API_KEY in .env',
  RATE_LIMIT: 'Rate limit exceeded. Please try again later',
  TIMEOUT: 'Request timed out. Please try again',
  NETWORK_ERROR: 'Network error. Please check your connection',
  AUDIO_TOO_LARGE: 'Audio file is too large. Maximum size is 25MB',
  UNKNOWN: 'An unknown error occurred',
} as const;

/**
 * Get user-friendly error message
 */
export const getOpenAIErrorMessage = (error: Error): string => {
  const message = error.message.toLowerCase();

  if (message.includes('api key') || message.includes('unauthorized') || message.includes('401')) {
    return OpenAIErrors.INVALID_API_KEY;
  }
  if (message.includes('rate limit') || message.includes('429')) {
    return OpenAIErrors.RATE_LIMIT;
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return OpenAIErrors.TIMEOUT;
  }
  if (message.includes('network') || message.includes('connection')) {
    return OpenAIErrors.NETWORK_ERROR;
  }
  if (message.includes('too large') || message.includes('file size')) {
    return OpenAIErrors.AUDIO_TOO_LARGE;
  }

  return OpenAIErrors.UNKNOWN;
};

export default {
  openai,
  transcribeAudio,
  enhanceTranscript,
  regenerateWithStyle,
  translateTranscript,
  estimateCost,
  isOpenAIConfigured,
  testConnection,
  getOpenAIErrorMessage,
  ENHANCEMENT_PROMPTS,
};

