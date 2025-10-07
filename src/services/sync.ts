/**
 * Real-time Sync Service
 * Handles Supabase Realtime subscriptions for live data sync
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type SyncCallback<T> = (payload: T) => void;

export class SyncService {
  private static channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to recordings changes
   */
  static subscribeToRecordings(
    userId: string,
    callbacks: {
      onInsert?: SyncCallback<any>;
      onUpdate?: SyncCallback<any>;
      onDelete?: SyncCallback<any>;
    }
  ): () => void {
    const channelName = `recordings:${userId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'recordings',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => callbacks.onInsert?.(payload.new)
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'recordings',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => callbacks.onUpdate?.(payload.new)
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'recordings',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => callbacks.onDelete?.(payload.old)
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Unsubscribe from all channels
   */
  static unsubscribeAll(): void {
    this.channels.forEach((channel) => channel.unsubscribe());
    this.channels.clear();
  }
}

