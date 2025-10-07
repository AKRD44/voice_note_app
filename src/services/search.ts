/**
 * Advanced Search Service
 * Full-text search across recordings
 */

import { supabase } from '../lib/supabase';
import { CloudRecording } from '../hooks/useRecordings';

export interface SearchFilters {
  dateRange?: { start: Date; end: Date };
  languages?: string[];
  styles?: string[];
  folders?: string[];
  tags?: string[];
  minDuration?: number;
  maxDuration?: number;
}

export class SearchService {
  static async search(
    userId: string,
    query: string,
    filters?: SearchFilters
  ): Promise<CloudRecording[]> {
    let dbQuery = supabase
      .from('recordings')
      .select('*')
      .eq('user_id', userId);

    // Text search
    if (query) {
      dbQuery = dbQuery.or(
        `title.ilike.%${query}%,original_transcript.ilike.%${query}%,enhanced_transcript.ilike.%${query}%`
      );
    }

    // Apply filters
    if (filters?.dateRange) {
      dbQuery = dbQuery
        .gte('created_at', filters.dateRange.start.toISOString())
        .lte('created_at', filters.dateRange.end.toISOString());
    }

    if (filters?.languages && filters.languages.length > 0) {
      dbQuery = dbQuery.in('language', filters.languages);
    }

    if (filters?.styles && filters.styles.length > 0) {
      dbQuery = dbQuery.in('style', filters.styles);
    }

    if (filters?.minDuration) {
      dbQuery = dbQuery.gte('duration', filters.minDuration);
    }

    if (filters?.maxDuration) {
      dbQuery = dbQuery.lte('duration', filters.maxDuration);
    }

    dbQuery = dbQuery.order('created_at', { ascending: false });

    const { data, error } = await dbQuery;
    if (error) throw error;

    return data as CloudRecording[];
  }
}

