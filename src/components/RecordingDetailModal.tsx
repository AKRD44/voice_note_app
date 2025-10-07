import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  ScrollView,
  Share,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

import { Recording } from '../store/recordingStore';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

interface RecordingDetailModalProps {
  visible: boolean;
  recording: Recording | null;
  onClose: () => void;
  onDelete: (recording: Recording) => void;
  onShare: (recording: Recording) => void;
  theme: 'light' | 'dark' | 'auto';
}

export default function RecordingDetailModal({
  visible,
  recording,
  onClose,
  onDelete,
  onShare,
  theme,
}: RecordingDetailModalProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const isDark = theme === 'dark';

  if (!recording) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playAudio = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recording.audioUri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      // Get duration
      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis || 0);
      }

      // Update playback position
      const updateInterval = setInterval(async () => {
        const status = await newSound.getStatusAsync();
        if (status.isLoaded) {
          setPlaybackPosition(status.positionMillis || 0);
          
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPlaybackPosition(0);
            clearInterval(updateInterval);
          }
        }
      }, 100);

    } catch (error) {
      console.error('Error playing audio:', error);
      Toast.show({
        type: 'error',
        text1: 'Playback Error',
        text2: 'Could not play the audio file.',
      });
    }
  };

  const pauseAudio = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Toast.show({
        type: 'success',
        text1: 'Copied!',
        text2: 'Text copied to clipboard',
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Copy Failed',
        text2: 'Could not copy text to clipboard',
      });
    }
  };

  const handleShare = async () => {
    try {
      const shareText = `${recording.title}\n\n${recording.enhancedTranscript || recording.transcript || 'No transcript available'}`;
      
      await Share.share({
        message: shareText,
        title: recording.title,
      });
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Share Failed',
        text2: 'Could not share the recording',
      });
    }
  };

  const handleExport = (format: 'txt' | 'md' | 'pdf') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Toast.show({
      type: 'info',
      text1: 'Export Feature',
      text2: `${format.toUpperCase()} export coming soon!`,
    });
  };

  const getPlaybackProgress = () => {
    if (duration === 0) return 0;
    return (playbackPosition / duration) * 100;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <BlurView
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          style={styles.blurBackground}
        />
        
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.modalContent, isDark && styles.darkModalContent]}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <Text style={[styles.closeButtonText, isDark && styles.darkCloseButtonText]}>
                  ✕
                </Text>
              </TouchableOpacity>
              
              <Text style={[styles.title, isDark && styles.darkTitle]} numberOfLines={1}>
                {recording.title}
              </Text>
              
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => onDelete(recording)}
                >
                  <Text style={[styles.headerButtonText, isDark && styles.darkHeaderButtonText]}>
                    🗑️
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
              {/* Audio Player */}
              <View style={[styles.audioPlayer, isDark && styles.darkAudioPlayer]}>
                <View style={styles.playerHeader}>
                  <Text style={[styles.playerTitle, isDark && styles.darkPlayerTitle]}>
                    Original Audio
                  </Text>
                  <Text style={[styles.durationText, isDark && styles.darkDurationText]}>
                    {formatDuration(recording.duration)}
                  </Text>
                </View>
                
                <View style={styles.playerControls}>
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={isPlaying ? pauseAudio : playAudio}
                  >
                    <LinearGradient
                      colors={['#3b82f6', '#8b5cf6']}
                      style={styles.playButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.playButtonIcon}>
                        {isPlaying ? '⏸️' : '▶️'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBarBackground}>
                      <LinearGradient
                        colors={['#3b82f6', '#8b5cf6']}
                        style={[styles.progressBarFill, { width: `${getPlaybackProgress()}%` }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                    </View>
                    <View style={styles.progressTime}>
                      <Text style={[styles.timeText, isDark && styles.darkTimeText]}>
                        {formatDuration(Math.floor(playbackPosition / 1000))}
                      </Text>
                      <Text style={[styles.timeText, isDark && styles.darkTimeText]}>
                        {formatDuration(recording.duration)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Metadata */}
              <View style={[styles.metadata, isDark && styles.darkMetadata]}>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, isDark && styles.darkMetaLabel]}>
                    Date
                  </Text>
                  <Text style={[styles.metaValue, isDark && styles.darkMetaValue]}>
                    {format(new Date(recording.createdAt), 'MMM d, yyyy • h:mm a')}
                  </Text>
                </View>
                
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, isDark && styles.darkMetaLabel]}>
                    Style
                  </Text>
                  <View style={[styles.styleBadge, { backgroundColor: getStyleColor(recording.style) }]}>
                    <Text style={styles.styleBadgeText}>{recording.style}</Text>
                  </View>
                </View>
                
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, isDark && styles.darkMetaLabel]}>
                    Language
                  </Text>
                  <Text style={[styles.metaValue, isDark && styles.darkMetaValue]}>
                    {recording.language || 'Auto-detected'}
                  </Text>
                </View>
              </View>

              {/* Transcript */}
              {(recording.enhancedTranscript || recording.transcript) && (
                <View style={[styles.transcriptSection, isDark && styles.darkTranscriptSection]}>
                  <View style={styles.transcriptHeader}>
                    <Text style={[styles.transcriptTitle, isDark && styles.darkTranscriptTitle]}>
                      Transcript
                    </Text>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => copyToClipboard(recording.enhancedTranscript || recording.transcript || '')}
                    >
                      <Text style={[styles.copyButtonText, isDark && styles.darkCopyButtonText]}>
                        📋 Copy
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={[styles.transcriptText, isDark && styles.darkTranscriptText]}>
                    {recording.enhancedTranscript || recording.transcript}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.shareButton]}
                  onPress={handleShare}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.actionButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.actionButtonText}>📤 Share</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.exportButton]}
                  onPress={() => handleExport('txt')}
                >
                  <Text style={[styles.exportButtonText, isDark && styles.darkExportButtonText]}>
                    💾 Export
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#f8fafc',
    marginTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  darkModalContent: {
    backgroundColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748b',
  },
  darkCloseButtonText: {
    color: '#94a3b8',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  darkTitle: {
    color: '#f8fafc',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerButtonText: {
    fontSize: 14,
  },
  darkHeaderButtonText: {
    color: '#94a3b8',
  },
  scrollContent: {
    padding: 20,
  },
  audioPlayer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  darkAudioPlayer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  darkPlayerTitle: {
    color: '#f8fafc',
  },
  durationText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  darkDurationText: {
    color: '#94a3b8',
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  playButtonGradient: {
    flex: 1,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonIcon: {
    fontSize: 20,
  },
  progressContainer: {
    flex: 1,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: '#64748b',
  },
  darkTimeText: {
    color: '#94a3b8',
  },
  metadata: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  darkMetadata: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  darkMetaLabel: {
    color: '#94a3b8',
  },
  metaValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  darkMetaValue: {
    color: '#f8fafc',
  },
  styleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  styleBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
  },
  transcriptSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  darkTranscriptSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  darkTranscriptTitle: {
    color: '#f8fafc',
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  copyButtonText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  darkCopyButtonText: {
    color: '#60a5fa',
  },
  transcriptText: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
  },
  darkTranscriptText: {
    color: '#f8fafc',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  shareButton: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  exportButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  actionButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    textAlign: 'center',
    lineHeight: 48,
  },
  darkExportButtonText: {
    color: '#60a5fa',
  },
});