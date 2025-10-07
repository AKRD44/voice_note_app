/**
 * Usage Tracking Service
 * Tracks usage for subscription limits
 */

import { supabase } from '../lib/supabase';

export interface UsageStats {
  recording_minutes: number;
  api_calls: number;
  storage_bytes: number;
}

export class UsageService {
  /**
   * Get current month's usage
   */
  static async getCurrentUsage(userId: string): Promise<UsageStats> {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('usage_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('month', currentMonth.toISOString().split('T')[0])
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data || { recording_minutes: 0, api_calls: 0, storage_bytes: 0 };
  }

  /**
   * Track recording usage
   */
  static async trackRecording(userId: string, durationSeconds: number): Promise<void> {
    const month = new Date();
    month.setDate(1);

    await supabase.rpc('increment_usage', {
      p_user_id: userId,
      p_month: month.toISOString().split('T')[0],
      p_minutes: Math.ceil(durationSeconds / 60),
    });
  }

  /**
   * Check if user has hit limits
   */
  static async checkLimits(
    userId: string,
    tier: 'free' | 'premium'
  ): Promise<{ canRecord: boolean; minutesRemaining: number }> {
    const usage = await this.getCurrentUsage(userId);
    const maxMinutes = tier === 'premium' ? 999999 : 60; // 60 min/month for free

    return {
      canRecord: usage.recording_minutes < maxMinutes,
      minutesRemaining: Math.max(0, maxMinutes - usage.recording_minutes),
    };
  }
}

