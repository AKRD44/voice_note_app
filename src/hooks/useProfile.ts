/**
 * Profile Management Hook
 * Handles user profile operations
 */

import { useState, useCallback } from 'react';
import { useAuth, UserProfile } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export interface ProfileUpdateData {
  display_name?: string;
  avatar_url?: string;
}

export const useProfile = () => {
  const { user, profile, updateProfile: updateAuthProfile } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  /**
   * Update profile data
   */
  const updateProfile = useCallback(
    async (updates: ProfileUpdateData) => {
      if (!user) {
        throw new Error('No user logged in');
      }

      setIsUpdating(true);
      try {
        await updateAuthProfile(updates);
        return { success: true };
      } catch (error) {
        console.error('Error updating profile:', error);
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Update failed'),
        };
      } finally {
        setIsUpdating(false);
      }
    },
    [user, updateAuthProfile]
  );

  /**
   * Update display name
   */
  const updateDisplayName = useCallback(
    async (newName: string) => {
      if (!newName || newName.trim().length === 0) {
        throw new Error('Display name cannot be empty');
      }

      if (newName.length > 50) {
        throw new Error('Display name must be less than 50 characters');
      }

      return await updateProfile({ display_name: newName.trim() });
    },
    [updateProfile]
  );

  /**
   * Upload avatar image
   */
  const uploadAvatar = useCallback(
    async (imageUri: string) => {
      if (!user) {
        throw new Error('No user logged in');
      }

      setUploadingAvatar(true);
      try {
        // Convert image to blob
        const response = await fetch(imageUri);
        const blob = await response.blob();

        // Create filename
        const fileExt = imageUri.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, blob, {
            contentType: `image/${fileExt}`,
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // Update profile with new avatar URL
        await updateProfile({ avatar_url: urlData.publicUrl });

        return { success: true, url: urlData.publicUrl };
      } catch (error) {
        console.error('Error uploading avatar:', error);
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Upload failed'),
        };
      } finally {
        setUploadingAvatar(false);
      }
    },
    [user, updateProfile]
  );

  /**
   * Pick image from gallery
   */
  const pickAvatar = useCallback(async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access gallery was denied');
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return await uploadAvatar(result.assets[0].uri);
      }

      return { success: false };
    } catch (error) {
      console.error('Error picking avatar:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to pick image'),
      };
    }
  }, [uploadAvatar]);

  /**
   * Take photo for avatar
   */
  const takeAvatarPhoto = useCallback(async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access camera was denied');
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return await uploadAvatar(result.assets[0].uri);
      }

      return { success: false };
    } catch (error) {
      console.error('Error taking photo:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to take photo'),
      };
    }
  }, [uploadAvatar]);

  /**
   * Delete avatar
   */
  const deleteAvatar = useCallback(async () => {
    if (!user || !profile?.avatar_url) {
      return { success: true };
    }

    try {
      // Extract file path from URL
      const urlParts = profile.avatar_url.split('/');
      const filePath = `avatars/${urlParts[urlParts.length - 1]}`;

      // Delete from storage
      const { error } = await supabase.storage.from('avatars').remove([filePath]);
      if (error) throw error;

      // Update profile
      await updateProfile({ avatar_url: null });

      return { success: true };
    } catch (error) {
      console.error('Error deleting avatar:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to delete avatar'),
      };
    }
  }, [user, profile, updateProfile]);

  /**
   * Validate profile data
   */
  const validateProfile = useCallback((data: ProfileUpdateData): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (data.display_name !== undefined) {
      if (!data.display_name || data.display_name.trim().length === 0) {
        errors.push('Display name cannot be empty');
      }
      if (data.display_name.length > 50) {
        errors.push('Display name must be less than 50 characters');
      }
      if (!/^[a-zA-Z0-9\s._-]+$/.test(data.display_name)) {
        errors.push('Display name contains invalid characters');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }, []);

  /**
   * Get subscription status
   */
  const getSubscriptionStatus = useCallback((): {
    tier: 'free' | 'premium';
    isActive: boolean;
    daysRemaining?: number;
  } => {
    if (!profile) {
      return { tier: 'free', isActive: false };
    }

    const tier = profile.subscription_tier;
    const expiresAt = profile.subscription_expires_at
      ? new Date(profile.subscription_expires_at)
      : null;

    if (tier === 'premium' && expiresAt) {
      const now = new Date();
      const isActive = expiresAt > now;
      const daysRemaining = isActive
        ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        tier,
        isActive,
        daysRemaining,
      };
    }

    return {
      tier,
      isActive: tier === 'premium',
    };
  }, [profile]);

  return {
    profile,
    isUpdating,
    uploadingAvatar,
    updateProfile,
    updateDisplayName,
    pickAvatar,
    takeAvatarPhoto,
    uploadAvatar,
    deleteAvatar,
    validateProfile,
    getSubscriptionStatus,
  };
};

export default useProfile;

