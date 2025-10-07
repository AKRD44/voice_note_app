/**
 * Translation Service
 * Translate transcripts to different languages using GPT-4
 */

import { EnhancementService } from './enhancement';

export const TranslationService = {
  translate: async (text: string, targetLanguage: string) => {
    return await EnhancementService.translate(text, targetLanguage);
  },
};

