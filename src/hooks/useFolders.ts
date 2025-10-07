/**
 * Folders Hook
 * Manages recording folders for organization
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export const useFolders = () => {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFolders = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const createFolder = useCallback(
    async (name: string, color?: string) => {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('folders')
        .insert({ user_id: user.id, name, color })
        .select()
        .single();

      if (error) throw error;
      setFolders((prev) => [data, ...prev]);
      return data;
    },
    [user]
  );

  const updateFolder = useCallback(async (folderId: string, updates: { name?: string; color?: string }) => {
    const { data, error } = await supabase
      .from('folders')
      .update(updates)
      .eq('id', folderId)
      .select()
      .single();

    if (error) throw error;
    setFolders((prev) => prev.map((f) => (f.id === folderId ? data : f)));
    return data;
  }, []);

  const deleteFolder = useCallback(async (folderId: string) => {
    const { error } = await supabase.from('folders').delete().eq('id', folderId);
    if (error) throw error;
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
  }, []);

  const addRecordingToFolder = useCallback(async (recordingId: string, folderId: string) => {
    const { error } = await supabase
      .from('recording_folders')
      .insert({ recording_id: recordingId, folder_id: folderId });
    if (error) throw error;
  }, []);

  const removeRecordingFromFolder = useCallback(async (recordingId: string, folderId: string) => {
    const { error } = await supabase
      .from('recording_folders')
      .delete()
      .eq('recording_id', recordingId)
      .eq('folder_id', folderId);
    if (error) throw error;
  }, []);

  return {
    folders,
    isLoading,
    loadFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    addRecordingToFolder,
    removeRecordingFromFolder,
  };
};

