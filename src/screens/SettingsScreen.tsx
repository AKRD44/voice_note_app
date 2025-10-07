import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '../store/settingsStore';
import { useRecordingStore } from '../store/recordingStore';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function SettingsScreen({ navigation }: any) {
  const {
    theme,
    language,
    notifications,
    autoSave,
    defaultStyle,
    audioQuality,
    subscription,
    setTheme,
    setLanguage,
    setNotificationSettings,
    setDefaultStyle,
    setAudioQuality,
  } = useSettingsStore();

  const { recordings } = useRecordingStore();
  const [activeTab, setActiveTab] = useState<'account' | 'preferences' | 'subscription'>('account');

  const totalMinutes = Math.round(recordings.reduce((sum, r) => sum + r.duration, 0) / 60);
  const totalStorage = Math.round(recordings.length * 2.5); // Rough estimate in MB

  const isDark = theme === 'dark';

  const SettingItem = ({ 
    title, 
    description, 
    action,
    value,
    onValueChange,
    onPress 
  }: any) => (
    <TouchableOpacity
      style={[styles.settingItem, onPress && styles.settingItemClickable]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, isDark && styles.darkSettingTitle]}>
          {title}
        </Text>
        {description && (
          <Text style={[styles.settingDescription, isDark && styles.darkSettingDescription]}>
            {description}
          </Text>
        )}
      </View>
      {action === 'toggle' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#64748b', true: '#3b82f6' }}
          thumbColor={value ? '#fff' : '#f1f5f9'}
        />
      )}
      {action === 'chevron' && (
        <Text style={[styles.chevron, isDark && styles.darkChevron]}>›</Text>
      )}
      {action === 'value' && (
        <Text style={[styles.settingValue, isDark && styles.darkSettingValue]}>
          {value}
        </Text>
      )}
    </TouchableOpacity>
  );

  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your recordings and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            // This would implement the actual data deletion
            Toast.show({
              type: 'info',
              text1: 'Feature Coming Soon',
              text2: 'Complete data deletion will be available in a future update.',
            });
          },
        },
      ]
    );
  };

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // This would open the subscription flow
    Toast.show({
      type: 'info',
      text1: 'Upgrade Coming Soon',
      text2: 'Premium subscription will be available soon!',
    });
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <LinearGradient
        colors={isDark ? ['#1e293b', '#0f172a'] : ['#f8fafc', '#e2e8f0']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, isDark && styles.darkTitle]}>
              Settings
            </Text>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            {['account', 'preferences', 'subscription'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabButton,
                  activeTab === tab && styles.tabButtonActive,
                ]}
                onPress={() => setActiveTab(tab as any)}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === tab && styles.tabButtonTextActive,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content based on active tab */}
          {activeTab === 'account' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.darkSectionTitle]}>
                Account Information
              </Text>
              
              <BlurView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                style={styles.infoCard}
              >
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDark && styles.darkInfoLabel]}>
                    Email
                  </Text>
                  <Text style={[styles.infoValue, isDark && styles.darkInfoValue]}>
                    user@example.com
                  </Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDark && styles.darkInfoLabel]}>
                    Plan
                  </Text>
                  <Text style={[styles.infoValue, isDark && styles.darkInfoValue]}>
                    {subscription.tier === 'premium' ? 'Premium' : 'Free'}
                  </Text>
                </View>
              </BlurView>

              <Text style={[styles.sectionTitle, isDark && styles.darkSectionTitle]}>
                Usage Statistics
              </Text>
              
              <BlurView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                style={styles.statsCard}
              >
                <View style={styles.statGrid}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, isDark && styles.darkStatNumber]}>
                      {recordings.length}
                    </Text>
                    <Text style={[styles.statLabel, isDark && styles.darkStatLabel]}>
                      Total Recordings
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, isDark && styles.darkStatNumber]}>
                      {totalMinutes}
                    </Text>
                    <Text style={[styles.statLabel, isDark && styles.darkStatLabel]}>
                      Minutes Recorded
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, isDark && styles.darkStatNumber]}>
                      {totalStorage}
                    </Text>
                    <Text style={[styles.statLabel, isDark && styles.darkStatLabel]}>
                      Storage Used (MB)
                    </Text>
                  </View>
                </View>
              </BlurView>

              <SettingItem
                title="Delete All Data"
                description="Permanently delete all recordings and settings"
                action="chevron"
                onPress={handleDeleteAllData}
              />
            </View>
          )}

          {activeTab === 'preferences' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.darkSectionTitle]}>
                Appearance
              </Text>
              
              <SettingItem
                title="Theme"
                description="Choose your preferred theme"
                action="value"
                value={theme === 'auto' ? 'Auto' : theme === 'dark' ? 'Dark' : 'Light'}
                onPress={() => {
                  // This would show a theme selection modal
                  const themes = ['light', 'dark', 'auto'];
                  const currentIndex = themes.indexOf(theme);
                  const nextTheme = themes[(currentIndex + 1) % themes.length];
                  setTheme(nextTheme as any);
                }}
              />

              <Text style={[styles.sectionTitle, isDark && styles.darkSectionTitle]}>
                Recording Settings
              </Text>
              
              <SettingItem
                title="Auto-Save"
                description="Automatically save recordings after processing"
                action="toggle"
                value={autoSave}
                onValueChange={(value: boolean) => {
                  // This would update auto-save setting
                }}
              />
              
              <SettingItem
                title="Default Style"
                description="Default transcription style for new recordings"
                action="value"
                value={defaultStyle.charAt(0).toUpperCase() + defaultStyle.slice(1)}
                onPress={() => {
                  // This would show a style selection modal
                  const styles = ['note', 'email', 'blog', 'summary', 'transcript'];
                  const currentIndex = styles.indexOf(defaultStyle);
                  const nextStyle = styles[(currentIndex + 1) % styles.length];
                  setDefaultStyle(nextStyle as any);
                }}
              />
              
              <SettingItem
                title="Audio Quality"
                description="Quality of audio recordings"
                action="value"
                value={audioQuality.charAt(0).toUpperCase() + audioQuality.slice(1)}
                onPress={() => {
                  // This would show a quality selection modal
                  const qualities = ['low', 'medium', 'high'];
                  const currentIndex = qualities.indexOf(audioQuality);
                  const nextQuality = qualities[(currentIndex + 1) % qualities.length];
                  setAudioQuality(nextQuality as any);
                }}
              />

              <Text style={[styles.sectionTitle, isDark && styles.darkSectionTitle]}>
                Notifications
              </Text>
              
              <SettingItem
                title="Processing Complete"
                description="Notify when transcription is ready"
                action="toggle"
                value={notifications.processingComplete}
                onValueChange={(value: boolean) =>
                  setNotificationSettings({ processingComplete: value })
                }
              />
              
              <SettingItem
                title="Daily Reminder"
                description="Remind to record daily notes"
                action="toggle"
                value={notifications.dailyReminder}
                onValueChange={(value: boolean) =>
                  setNotificationSettings({ dailyReminder: value })
                }
              />
            </View>
          )}

          {activeTab === 'subscription' && (
            <View style={styles.section}>
              {subscription.tier === 'free' ? (
                <>
                  <Text style={[styles.sectionTitle, isDark && styles.darkSectionTitle]}>
                    Upgrade to Premium
                  </Text>
                  
                  <BlurView
                    intensity={80}
                    tint={isDark ? 'dark' : 'light'}
                    style={styles.premiumCard}
                  >
                    <Text style={[styles.premiumTitle, isDark && styles.darkPremiumTitle]}>
                      VoiceFlow Premium
                    </Text>
                    <Text style={[styles.premiumSubtitle, isDark && styles.darkPremiumSubtitle]}>
                      Unlock the full power of VoiceFlow
                    </Text>
                    
                    <View style={styles.featureList}>
                      {[
                        '15-minute recordings (vs 3 min free)',
                        'Unlimited transcriptions per month',
                        'Priority processing',
                        'Advanced AI enhancement',
                        'Export to multiple formats',
                        'Cloud sync across devices',
                      ].map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                          <Text style={styles.featureIcon}>✓</Text>
                          <Text style={[styles.featureText, isDark && styles.darkFeatureText]}>
                            {feature}
                          </Text>
                        </View>
                      ))}
                    </View>
                    
                    <TouchableOpacity
                      style={styles.upgradeButton}
                      onPress={handleUpgrade}
                    >
                      <LinearGradient
                        colors={['#3b82f6', '#8b5cf6']}
                        style={styles.upgradeButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.upgradeButtonText}>
                          Upgrade Now - $9.99/month
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </BlurView>
                </>
              ) : (
                <>
                  <Text style={[styles.sectionTitle, isDark && styles.darkSectionTitle]}>
                    Premium Subscription
                  </Text>
                  
                  <BlurView
                    intensity={80}
                    tint={isDark ? 'dark' : 'light'}
                    style={styles.premiumCard}
                  >
                    <Text style={[styles.premiumTitle, isDark && styles.darkPremiumTitle]}>
                      You're Premium! 🎉
                    </Text>
                    <Text style={[styles.premiumSubtitle, isDark && styles.darkPremiumSubtitle]}>
                      Enjoy unlimited VoiceFlow features
                    </Text>
                    
                    <View style={styles.usageInfo}>
                      <Text style={[styles.usageText, isDark && styles.darkUsageText]}>
                        Recordings this month: {subscription.usage.recordingsThisMonth}
                      </Text>
                      <Text style={[styles.usageText, isDark && styles.darkUsageText]}>
                        Minutes this month: {subscription.usage.minutesThisMonth}
                      </Text>
                    </View>
                  </BlurView>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
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
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  darkTitle: {
    color: '#f8fafc',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#3b82f6',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: 'white',
  },
  section: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 24,
    marginBottom: 16,
  },
  darkSectionTitle: {
    color: '#f8fafc',
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  darkInfoLabel: {
    color: '#94a3b8',
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  darkInfoValue: {
    color: '#f8fafc',
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 12,
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
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
    textAlign: 'center',
  },
  darkStatLabel: {
    color: '#94a3b8',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  settingItemClickable: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  darkSettingTitle: {
    color: '#f8fafc',
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  darkSettingDescription: {
    color: '#94a3b8',
  },
  settingValue: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  darkSettingValue: {
    color: '#60a5fa',
  },
  chevron: {
    fontSize: 20,
    color: '#64748b',
  },
  darkChevron: {
    color: '#94a3b8',
  },
  premiumCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  darkPremiumTitle: {
    color: '#f8fafc',
  },
  premiumSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  darkPremiumSubtitle: {
    color: '#94a3b8',
  },
  featureList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    color: '#10b981',
    marginRight: 8,
    fontSize: 16,
  },
  featureText: {
    fontSize: 14,
    color: '#1e293b',
    flex: 1,
  },
  darkFeatureText: {
    color: '#f8fafc',
  },
  upgradeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  usageInfo: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  usageText: {
    fontSize: 14,
    color: '#065f46',
    marginBottom: 4,
  },
  darkUsageText: {
    color: '#6ee7b7',
  },
});