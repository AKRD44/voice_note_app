/**
 * Recordings Hook
 * Cloud-synced recording management replacing local-only storage
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserRecordings,
  createRecording as createRecordingDB,
  updateRecording as updateRecordingDB,
  deleteRecording as deleteRecordingDB,
} from '../lib/supabase';
import { AudioUtils } from '../utils/audioUtils';

export interface CloudRecording {
  id: string;
  user_id: string;
  title: string;
  audio_url: string;
  original_transcript: string | null;
  enhanced_transcript: string | null;
  language: string;
  style: 'note' | 'email' | 'blog' | 'summary' | 'transcript' | 'custom';
  duration: number;
  word_count: number | null;
  character_count: number | null;
  created_at: string;
  updated_at: string;
}

export const useRecordings = () => {
  const { user } = useAuth();
  const [recordings, setRecordings] = useState<CloudRecording[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load recordings from Supabase
   */
  const loadRecordings = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getUserRecordings(user.id);
      setRecordings(data as CloudRecording[]);
    } catch (err) {
      console.error('Error loading recordings:', err);
      setError(err instanceof Error ? err : new Error('Failed to load recordings'));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Load recordings on mount and when user changes
   */
  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  /**
   * Create a new recording
   */
  const createRecording = useCallback(
    async (recordingData: Omit<CloudRecording, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('No user logged in');

      try {
        const newRecording = await createRecordingDB({
          ...recordingData,
          user_id: user.id,
        });

        // Optimistic update
        setRecordings((prev) => [newRecording as CloudRecording, ...prev]);

        return newRecording;
      } catch (error) {
        console.error('Error creating recording:', error);
        throw error;
      }
    },
    [user]
  );

  /**
   * Update a recording
   */
  const updateRecording = useCallback(
    async (recordingId: string, updates: Partial<CloudRecording>) => {
      try {
        const updated = await updateRecordingDB(recordingId, updates);

        // Optimistic update
        setRecordings((prev) =>
          prev.map((rec) => (rec.id === recordingId ? { ...rec, ...updates } : rec))
        );

        return updated;
      } catch (error) {
        console.error('Error updating recording:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Delete a recording
   */
  const deleteRecording = useCallback(
    async (recordingId: string) => {
      try {
        const recording = recordings.find((r) => r.id === recordingId);

        if (recording) {
          // Delete audio file from storage
          const pathParts = recording.audio_url.split('/');
          const filePath = `${user?.id}/${pathParts[pathParts.length - 1]}`;
          await AudioUtils.deleteFromSupabase(filePath);
        }

        // Delete from database
        await deleteRecordingDB(recordingId);

        // Optimistic update
        setRecordings((prev) => prev.filter((rec) => rec.id !== recordingId));
      } catch (error) {
        console.error('Error deleting recording:', error);
        throw error;
      }
    },
    [recordings, user]
  );

  /**
   * Search recordings
   */
  const searchRecordings = useCallback(
    async (query: string) => {
      if (!user) return [];

      try {
        const results = await getUserRecordings(user.id, { searchQuery: query });
        return results as CloudRecording[];
      } catch (error) {
        console.error('Error searching recordings:', error);
        return [];
      }
    },
    [user]
  );

  /**
   * Get recordings with pagination
   */
  const getRecordingsPaginated = useCallback(
    async (page: number = 0, limit: number = 20) => {
      if (!user) return [];

      try {
        const offset = page * limit;
        const results = await getUserRecordings(user.id, { limit, offset });
        return results as CloudRecording[];
      } catch (error) {
        console.error('Error getting paginated recordings:', error);
        return [];
      }
    },
    [user]
  );

  return {
    recordings,
    isLoading,
    error,
    loadRecordings,
    createRecording,
    updateRecording,
    deleteRecording,
    searchRecordings,
    getRecordingsPaginated,
  };
};

export default useRecordings;

