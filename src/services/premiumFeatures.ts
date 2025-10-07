/**
 * Premium Features Service
 * Feature gating and premium-only functionality
 */

import { SubscriptionTier } from './subscription';

export interface FeatureLimits {
  maxRecordingDuration: number; // seconds
  maxStoredRecordings: number;
  exportFormats: Array<'txt' | 'md' | 'pdf' | 'docx'>;
  availableStyles: Array<'note' | 'email' | 'blog' | 'summary' | 'transcript' | 'custom'>;
  canUseCustomPrompts: boolean;
  hasPriorityProcessing: boolean;
  hasUnlimitedStorage: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, FeatureLimits> = {
  free: {
    maxRecordingDuration: 180, // 3 minutes
    maxStoredRecordings: 10,
    exportFormats: ['txt'],
    availableStyles: ['note', 'email', 'summary'],
    canUseCustomPrompts: false,
    hasPriorityProcessing: false,
    hasUnlimitedStorage: false,
  },
  premium: {
    maxRecordingDuration: 900, // 15 minutes
    maxStoredRecordings: 999999, // Unlimited
    exportFormats: ['txt', 'md', 'pdf', 'docx'],
    availableStyles: ['note', 'email', 'blog', 'summary', 'transcript', 'custom'],
    canUseCustomPrompts: true,
    hasPriorityProcessing: true,
    hasUnlimitedStorage: true,
  },
};

export class PremiumFeatures {
  /**
   * Get limits for tier
   */
  static getLimits(tier: SubscriptionTier): FeatureLimits {
    return TIER_LIMITS[tier];
  }

  /**
   * Check if feature is available
   */
  static isFeatureAvailable(tier: SubscriptionTier, feature: keyof FeatureLimits): boolean {
    if (tier === 'premium') return true;
    
    const limits = TIER_LIMITS[tier];
    const value = limits[feature];
    
    if (typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'number') return value > 0;
    
    return false;
  }

  /**
   * Get upgrade benefits
   */
  static getUpgradeBenefits(): string[] {
    return [
      '5x longer recordings (15 min vs 3 min)',
      'Unlimited storage (vs 10 recordings)',
      'All 6 enhancement styles',
      'Custom AI prompts',
      'Export to all formats (PDF, DOCX, MD)',
      'Priority processing',
      'Early access to new features',
    ];
  }
}

