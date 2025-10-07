import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { useRecordingStore, Recording } from '../store/recordingStore';
import { useSettingsStore } from '../store/settingsStore';
import RecordingCard from '../components/RecordingCard';
import WelcomeModal from '../components/WelcomeModal';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const { recordings, isRecording, initializeStore } = useRecordingStore();
  const { theme } = useSettingsStore();
  const [showWelcome, setShowWelcome] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recentRecordings, setRecentRecordings] = useState<Recording[]>([]);

  useEffect(() => {
    // Check if user is new (first time app launch)
    const checkFirstLaunch = async () => {
      // This would typically check AsyncStorage or similar
      // For now, we'll show the welcome modal
      setTimeout(() => setShowWelcome(true), 1000);
    };
    
    checkFirstLaunch();
    initializeStore();
  }, []);

  useEffect(() => {
    // Get recent recordings (last 10)
    const sorted = recordings
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
    setRecentRecordings(sorted);
  }, [recordings]);

  const handleRecordPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Record');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeStore();
    setRefreshing(false);
  };

  const isDark = theme === 'dark';

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <LinearGradient
        colors={isDark ? ['#1e293b', '#0f172a'] : ['#f8fafc', '#e2e8f0']}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? '#fff' : '#000'}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={[styles.title, isDark && styles.darkTitle]}>
                VoiceFlow
              </Text>
              <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
                Transform your voice into perfect text
              </Text>
            </View>
            
            {/* Quick Stats */}
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              style={styles.statsCard}
            >
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, isDark && styles.darkStatNumber]}>
                  {recordings.length}
                </Text>
                <Text style={[styles.statLabel, isDark && styles.darkStatLabel]}>
                  Recordings
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, isDark && styles.darkStatNumber]}>
                  {Math.round(recordings.reduce((sum, r) => sum + r.duration, 0) / 60)}
                </Text>
                <Text style={[styles.statLabel, isDark && styles.darkStatLabel]}>
                  Minutes
                </Text>
              </View>
            </BlurView>
          </View>

          {/* Main Action Button */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordingButton]}
              onPress={handleRecordPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isRecording ? ['#ef4444', '#dc2626'] : ['#3b82f6', '#8b5cf6']}
                style={styles.recordButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.recordButtonContent}>
                  <Text style={styles.recordButtonIcon}>🎤</Text>
                  <Text style={styles.recordButtonText}>
                    {isRecording ? 'Recording...' : 'Start Recording'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={[styles.recordHint, isDark && styles.darkRecordHint]}>
              Tap to record up to 3 minutes of audio
            </Text>
          </View>

          {/* Recent Recordings */}
          <View style={styles.recentSection}>
            <Text style={[styles.sectionTitle, isDark && styles.darkSectionTitle]}>
              Recent Recordings
            </Text>
            
            {recentRecordings.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, isDark && styles.darkEmptyText]}>
                  No recordings yet
                </Text>
                <Text style={[styles.emptySubtext, isDark && styles.darkEmptySubtext]}>
                  Your recent recordings will appear here
                </Text>
              </View>
            ) : (
              <View style={styles.recordingsGrid}>
                {recentRecordings.map((recording) => (
                  <RecordingCard
                    key={recording.id}
                    recording={recording}
                    onPress={() => navigation.navigate('Library', { 
                      screen: 'RecordingDetail', 
                      params: { recordingId: recording.id } 
                    })}
                    theme={theme}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>

      <WelcomeModal
        visible={showWelcome}
        onClose={() => setShowWelcome(false)}
        theme={theme}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  darkContainer: {
    backgroundColor: '#1e293b',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  headerContent: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  darkTitle: {
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  darkSubtitle: {
    color: '#94a3b8',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 32,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  darkStatNumber: {
    color: '#f8fafc',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 4,
  },
  darkStatLabel: {
    color: '#94a3b8',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 16,
  },
  actionSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 48,
  },
  recordButton: {
    width: width * 0.7,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recordingButton: {
    shadowColor: '#ef4444',
  },
  recordButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonContent: {
    alignItems: 'center',
  },
  recordButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  recordButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  recordHint: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  darkRecordHint: {
    color: '#94a3b8',
  },
  recentSection: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  darkSectionTitle: {
    color: '#f8fafc',
  },
  recordingsGrid: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 8,
  },
  darkEmptyText: {
    color: '#94a3b8',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  darkEmptySubtext: {
    color: '#64748b',
  },
});