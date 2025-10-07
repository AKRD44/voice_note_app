/**
 * Tags Hook
 * Manages recording tags for flexible categorization
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
}

export const useTags = () => {
  const { user } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTags = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const createTag = useCallback(
    async (name: string, color?: string) => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('tags')
        .insert({ user_id: user.id, name, color })
        .select()
        .single();

      if (error) throw error;
      setTags((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return data;
    },
    [user]
  );

  const updateTag = useCallback(async (tagId: string, updates: { name?: string; color?: string }) => {
    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', tagId)
      .select()
      .single();

    if (error) throw error;
    setTags((prev) => prev.map((t) => (t.id === tagId ? data : t)));
    return data;
  }, []);

  const deleteTag = useCallback(async (tagId: string) => {
    const { error } = await supabase.from('tags').delete().eq('id', tagId);
    if (error) throw error;
    setTags((prev) => prev.filter((t) => t.id !== tagId));
  }, []);

  const addTagToRecording = useCallback(async (recordingId: string, tagId: string) => {
    const { error } = await supabase
      .from('recording_tags')
      .insert({ recording_id: recordingId, tag_id: tagId });
    if (error) throw error;
  }, []);

  const removeTagFromRecording = useCallback(async (recordingId: string, tagId: string) => {
    const { error } = await supabase
      .from('recording_tags')
      .delete()
      .eq('recording_id', recordingId)
      .eq('tag_id', tagId);
    if (error) throw error;
  }, []);

  const getRecordingTags = useCallback(async (recordingId: string) => {
    const { data, error } = await supabase
      .from('recording_tags')
      .select('tag_id, tags(*)')
      .eq('recording_id', recordingId);

    if (error) throw error;
    return (data || []).map((item: any) => item.tags);
  }, []);

  return {
    tags,
    isLoading,
    loadTags,
    createTag,
    updateTag,
    deleteTag,
    addTagToRecording,
    removeTagFromRecording,
    getRecordingTags,
  };
};

