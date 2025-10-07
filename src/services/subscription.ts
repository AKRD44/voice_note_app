/**
 * Subscription Service
 * Manages in-app purchases and subscription status
 * Ready for RevenueCat or Stripe integration
 */

import { supabase } from '../lib/supabase';

export type SubscriptionTier = 'free' | 'premium';
export type SubscriptionPeriod = 'monthly' | 'annual';

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  period: SubscriptionPeriod;
  price: number;
  currency: string;
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  premium_monthly: {
    id: 'premium_monthly',
    tier: 'premium',
    period: 'monthly',
    price: 6.00,
    currency: 'USD',
    features: [
      '15-minute recordings',
      'Unlimited storage',
      'All styles + custom',
      'Priority processing',
      'All export formats',
      'Early access features',
    ],
  },
  premium_annual: {
    id: 'premium_annual',
    tier: 'premium',
    period: 'annual',
    price: 60.00, // 17% discount
    currency: 'USD',
    features: [
      '15-minute recordings',
      'Unlimited storage',
      'All styles + custom',
      'Priority processing',
      'All export formats',
      'Early access features',
      'Save 17% vs monthly',
    ],
  },
};

export class SubscriptionService {
  /**
   * Purchase subscription
   * TODO: Integrate with RevenueCat or Stripe
   */
  static async purchase(
    userId: string,
    planId: string
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      // TODO: Implement actual purchase flow
      console.log('Purchase:', userId, planId);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Purchase failed'),
      };
    }
  }

  /**
   * Update subscription status in Supabase
   */
  static async updateSubscriptionStatus(
    userId: string,
    tier: SubscriptionTier,
    expiresAt?: Date
  ): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        subscription_expires_at: expiresAt?.toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Check if subscription is active
   */
  static isSubscriptionActive(tier: SubscriptionTier, expiresAt?: Date | string): boolean {
    if (tier !== 'premium') return false;
    if (!expiresAt) return false;

    const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    return expiry > new Date();
  }

  /**
   * Get subscription features
   */
  static getFeatures(tier: SubscriptionTier): string[] {
    if (tier === 'premium') {
      return SUBSCRIPTION_PLANS.premium_monthly.features;
    }

    return [
      '3-minute recordings',
      '10 stored recordings',
      'Basic styles',
      'TXT export only',
    ];
  }
}

