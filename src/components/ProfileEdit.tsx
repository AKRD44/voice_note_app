/**
 * Profile Edit Component
 * Allows users to edit their profile information
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../contexts/AuthContext';

interface ProfileEditProps {
  theme?: 'light' | 'dark';
}

export default function ProfileEdit({ theme = 'light' }: ProfileEditProps) {
  const { user } = useAuth();
  const {
    profile,
    isUpdating,
    uploadingAvatar,
    updateDisplayName,
    pickAvatar,
    takeAvatarPhoto,
    deleteAvatar,
  } = useProfile();

  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(profile?.display_name || '');

  const isDark = theme === 'dark';

  const handleSaveDisplayName = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await updateDisplayName(newDisplayName);

      if (result.success) {
        setIsEditingName(false);
        Toast.show({
          type: 'success',
          text1: 'Profile Updated',
          text2: 'Your display name has been updated.',
        });
      } else if (result.error) {
        throw result.error;
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error instanceof Error ? error.message : 'Could not update display name.',
      });
    }
  };

  const handleAvatarPress = () => {
    Alert.alert('Change Avatar', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const result = await takeAvatarPhoto();
          if (result.success) {
            Toast.show({
              type: 'success',
              text1: 'Avatar Updated',
              text2: 'Your profile picture has been updated.',
            });
          } else if (result.error) {
            Toast.show({
              type: 'error',
              text1: 'Upload Failed',
              text2: result.error.message,
            });
          }
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const result = await pickAvatar();
          if (result.success) {
            Toast.show({
              type: 'success',
              text1: 'Avatar Updated',
              text2: 'Your profile picture has been updated.',
            });
          } else if (result.error) {
            Toast.show({
              type: 'error',
              text1: 'Upload Failed',
              text2: result.error.message,
            });
          }
        },
      },
      ...(profile?.avatar_url
        ? [
            {
              text: 'Remove Avatar',
              style: 'destructive' as const,
              onPress: async () => {
                const result = await deleteAvatar();
                if (result.success) {
                  Toast.show({
                    type: 'success',
                    text1: 'Avatar Removed',
                    text2: 'Your profile picture has been removed.',
                  });
                }
              },
            },
          ]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handleAvatarPress}
          disabled={uploadingAvatar}
        >
          {uploadingAvatar ? (
            <View style={styles.avatarPlaceholder}>
              <ActivityIndicator color={isDark ? '#fff' : '#1e293b'} />
            </View>
          ) : profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, isDark && styles.darkAvatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>
                {profile?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}

          {/* Edit Badge */}
          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>✎</Text>
          </View>
        </TouchableOpacity>

        <Text style={[styles.avatarHint, isDark && styles.darkAvatarHint]}>
          Tap to change photo
        </Text>
      </View>

      {/* Profile Info */}
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
        {/* Display Name */}
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, isDark && styles.darkInfoLabel]}>Display Name</Text>
          
          {isEditingName ? (
            <View style={styles.editContainer}>
              <TextInput
                style={[styles.input, isDark && styles.darkInput]}
                value={newDisplayName}
                onChangeText={setNewDisplayName}
                placeholder="Enter your name"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                autoFocus
                maxLength={50}
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.editButton, styles.cancelButton]}
                  onPress={() => {
                    setIsEditingName(false);
                    setNewDisplayName(profile?.display_name || '');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, styles.saveButton]}
                  onPress={handleSaveDisplayName}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.valueContainer}>
              <Text style={[styles.infoValue, isDark && styles.darkInfoValue]}>
                {profile?.display_name || 'Not set'}
              </Text>
              <TouchableOpacity
                style={styles.editIcon}
                onPress={() => {
                  setIsEditingName(true);
                  setNewDisplayName(profile?.display_name || '');
                }}
              >
                <Text style={styles.editIconText}>✎</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Email (non-editable) */}
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, isDark && styles.darkInfoLabel]}>Email</Text>
          <Text style={[styles.infoValue, styles.infoValueReadonly, isDark && styles.darkInfoValue]}>
            {user?.email || 'Not available'}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Account Type */}
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, isDark && styles.darkInfoLabel]}>Account Type</Text>
          <View style={styles.badgeContainer}>
            <View
              style={[
                styles.badge,
                profile?.subscription_tier === 'premium' && styles.premiumBadge,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  profile?.subscription_tier === 'premium' && styles.premiumBadgeText,
                ]}
              >
                {profile?.subscription_tier === 'premium' ? '⭐ Premium' : 'Free'}
              </Text>
            </View>
          </View>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  darkAvatarPlaceholder: {
    backgroundColor: '#334155',
  },
  avatarPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#64748b',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  editBadgeText: {
    fontSize: 16,
    color: 'white',
  },
  avatarHint: {
    fontSize: 14,
    color: '#64748b',
  },
  darkAvatarHint: {
    color: '#94a3b8',
  },
  infoCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoRow: {
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  darkInfoLabel: {
    color: '#94a3b8',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  darkInfoValue: {
    color: '#f8fafc',
  },
  infoValueReadonly: {
    opacity: 0.6,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editIcon: {
    padding: 8,
  },
  editIconText: {
    fontSize: 18,
    color: '#3b82f6',
  },
  editContainer: {
    gap: 12,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  darkInput: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    color: '#f8fafc',
    borderColor: '#334155',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#e2e8f0',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 8,
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  premiumBadge: {
    backgroundColor: '#fbbf24',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  premiumBadgeText: {
    color: '#78350f',
  },
});

