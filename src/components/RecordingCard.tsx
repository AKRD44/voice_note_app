import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { format } from 'date-fns';

import { Recording } from '../store/recordingStore';

const { width } = Dimensions.get('window');

interface RecordingCardProps {
  recording: Recording;
  onPress: () => void;
  onLongPress?: () => void;
  viewMode?: 'grid' | 'list';
  theme: 'light' | 'dark' | 'auto';
}

export default function RecordingCard({
  recording,
  onPress,
  onLongPress,
  viewMode = 'grid',
  theme,
}: RecordingCardProps) {
  const isDark = theme === 'dark';
  const isGrid = viewMode === 'grid';

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPreviewText = () => {
    if (recording.enhancedTranscript) {
      return recording.enhancedTranscript.substring(0, 100) + '...';
    }
    if (recording.transcript) {
      return recording.transcript.substring(0, 100) + '...';
    }
    return 'Processing...';
  };

  const getStyleColor = (style: string) => {
    const colors: { [key: string]: string } = {
      note: '#3b82f6',
      email: '#10b981',
      blog: '#f59e0b',
      summary: '#8b5cf6',
      transcript: '#ef4444',
      custom: '#6b7280',
    };
    return colors[style] || colors.note;
  };

  const renderGridCard = () => (
    <TouchableOpacity
      style={[styles.gridCard, isDark && styles.darkGridCard]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <BlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        style={styles.cardBlur}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, isDark && styles.darkCardTitle]} numberOfLines={1}>
            {recording.title}
          </Text>
          <View style={[styles.styleBadge, { backgroundColor: getStyleColor(recording.style) }]}>
            <Text style={styles.styleBadgeText}>{recording.style}</Text>
          </View>
        </View>

        {/* Preview Text */}
        <Text style={[styles.previewText, isDark && styles.darkPreviewText]} numberOfLines={3}>
          {getPreviewText()}
        </Text>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <Text style={[styles.durationText, isDark && styles.darkDurationText]}>
              {formatDuration(recording.duration)}
            </Text>
            <Text style={[styles.dateText, isDark && styles.darkDateText]}>
              {format(new Date(recording.createdAt), 'MMM d')}
            </Text>
          </View>
          
          {recording.isProcessing && (
            <View style={styles.processingIndicator}>
              <LinearGradient
                colors={['#3b82f6', '#8b5cf6']}
                style={[styles.progressBar, { width: `${recording.processingProgress}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          )}
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  const renderListCard = () => (
    <TouchableOpacity
      style={[styles.listCard, isDark && styles.darkListCard]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <BlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        style={styles.cardBlur}
      >
        <View style={styles.listContent}>
          {/* Left Content */}
          <View style={styles.listLeft}>
            <Text style={[styles.listTitle, isDark && styles.darkListTitle]} numberOfLines={1}>
              {recording.title}
            </Text>
            <Text style={[styles.listPreview, isDark && styles.darkListPreview]} numberOfLines={2}>
              {getPreviewText()}
            </Text>
            <View style={styles.listMeta}>
              <Text style={[styles.listDuration, isDark && styles.darkListDuration]}>
                {formatDuration(recording.duration)}
              </Text>
              <Text style={[styles.listDate, isDark && styles.darkListDate]}>
                {format(new Date(recording.createdAt), 'MMM d, yyyy')}
              </Text>
            </View>
          </View>

          {/* Right Content */}
          <View style={styles.listRight}>
            <View style={[styles.listStyleBadge, { backgroundColor: getStyleColor(recording.style) }]}>
              <Text style={styles.listStyleBadgeText}>{recording.style}</Text>
            </View>
            {recording.isProcessing && (
              <View style={styles.listProcessingIndicator}>
                <LinearGradient
                  colors={['#3b82f6', '#8b5cf6']}
                  style={[styles.listProgressBar, { width: `${recording.processingProgress}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            )}
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  return isGrid ? renderGridCard() : renderListCard();
}

const styles = StyleSheet.create({
  gridCard: {
    flex: 1,
    margin: 6,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  darkGridCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  listCard: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  darkListCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  cardBlur: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  darkCardTitle: {
    color: '#f8fafc',
  },
  styleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  styleBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
  },
  previewText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 18,
    flex: 1,
  },
  darkPreviewText: {
    color: '#94a3b8',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    marginRight: 8,
  },
  darkDurationText: {
    color: '#60a5fa',
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
  },
  darkDateText: {
    color: '#94a3b8',
  },
  processingIndicator: {
    height: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 2,
    width: 60,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  listContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  listLeft: {
    flex: 1,
    marginRight: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  darkListTitle: {
    color: '#f8fafc',
  },
  listPreview: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 8,
  },
  darkListPreview: {
    color: '#94a3b8',
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listDuration: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    marginRight: 12,
  },
  darkListDuration: {
    color: '#60a5fa',
  },
  listDate: {
    fontSize: 12,
    color: '#64748b',
  },
  darkListDate: {
    color: '#94a3b8',
  },
  listRight: {
    alignItems: 'flex-end',
  },
  listStyleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  listStyleBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
  },
  listProcessingIndicator: {
    height: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 2,
    width: 40,
    overflow: 'hidden',
  },
  listProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
});