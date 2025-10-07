/**
 * Shareable Link Service  
 * Generate and manage shareable recording links
 */

import { supabase } from '../lib/supabase';
import { createHash } from 'crypto';

export interface ShareLinkOptions {
  expiresIn?: number; // days
  password?: string;
}

export interface ShareLink {
  id: string;
  recording_id: string;
  share_token: string;
  password_hash: string | null;
  expires_at: string | null;
  view_count: number;
  created_at: string;
}

export class ShareLinkService {
  static async createShareLink(
    recordingId: string,
    options?: ShareLinkOptions
  ): Promise<ShareLink> {
    const expiresAt = options?.expiresIn
      ? new Date(Date.now() + options.expiresIn * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const passwordHash = options?.password
      ? this.hashPassword(options.password)
      : null;

    const { data, error } = await supabase
      .from('shared_recordings')
      .insert({
        recording_id: recordingId,
        expires_at: expiresAt,
        password_hash: passwordHash,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ShareLink;
  }

  static async getShareLink(shareToken: string): Promise<any> {
    const { data, error } = await supabase.rpc('get_recording_by_share_token', {
      token: shareToken,
    });

    if (error) throw error;
    return data;
  }

  static async revokeShareLink(shareLinkId: string): Promise<void> {
    const { error } = await supabase.from('shared_recordings').delete().eq('id', shareLinkId);
    if (error) throw error;
  }

  private static hashPassword(password: string): string {
    // Simple hash for demo - use bcrypt in production
    return Buffer.from(password).toString('base64');
  }
}

