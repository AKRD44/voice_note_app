import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { useRecordingStore, Recording } from '../store/recordingStore';
import { useSettingsStore } from '../store/settingsStore';
import RecordingCard from '../components/RecordingCard';
import RecordingDetailModal from '../components/RecordingDetailModal';
import Toast from 'react-native-toast-show';

const { width } = Dimensions.get('window');

export default function LibraryScreen({ navigation }: any) {
  const { recordings, deleteRecording, updateRecording } = useRecordingStore();
  const { theme } = useSettingsStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'recent' | 'favorites'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [filteredRecordings, setFilteredRecordings] = useState<Recording[]>([]);

  useEffect(() => {
    filterRecordings();
  }, [recordings, searchQuery, selectedFilter]);

  const filterRecordings = () => {
    let filtered = [...recordings];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (recording) =>
          recording.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recording.transcript?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recording.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Apply filter
    switch (selectedFilter) {
      case 'recent':
        filtered = filtered
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 20);
        break;
      case 'favorites':
        // This would filter by favorites if we had that feature
        break;
      default:
        filtered = filtered.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    setFilteredRecordings(filtered);
  };

  const handleRecordingPress = (recording: Recording) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRecording(recording);
    setShowDetailModal(true);
  };

  const handleDeleteRecording = (recording: Recording) => {
    Alert.alert(
      'Delete Recording',
      `Are you sure you want to delete "${recording.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecording(recording.id);
              Toast.show({
                type: 'success',
                text1: 'Recording Deleted',
                text2: 'The recording has been permanently deleted.',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Delete Failed',
                text2: 'Could not delete the recording. Please try again.',
              });
            }
          },
        },
      ]
    );
  };

  const handleShareRecording = (recording: Recording) => {
    // Implementation for sharing recording
    Toast.show({
      type: 'info',
      text1: 'Sharing',
      text2: 'Sharing functionality coming soon!',
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh logic would go here
    setTimeout(() => setRefreshing(false), 1000);
  };

  const isDark = theme === 'dark';

  const renderRecordingCard = ({ item }: { item: Recording }) => (
    <RecordingCard
      recording={item}
      onPress={() => handleRecordingPress(item)}
      onLongPress={() => handleDeleteRecording(item)}
      viewMode={viewMode}
      theme={theme}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, isDark && styles.darkEmptyTitle]}>
        No recordings found
      </Text>
      <Text style={[styles.emptySubtitle, isDark && styles.darkEmptySubtitle]}>
        {searchQuery
          ? 'Try adjusting your search or filter'
          : 'Start recording to see your voice notes here'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <LinearGradient
        colors={isDark ? ['#1e293b', '#0f172a'] : ['#f8fafc', '#e2e8f0']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.darkTitle]}>
            Library
          </Text>
          
          {/* View Mode Toggle */}
          <View style={styles.viewModeToggle}>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'grid' && styles.viewModeButtonActive,
              ]}
              onPress={() => setViewMode('grid')}
            >
              <Text style={viewMode === 'grid' && styles.viewModeButtonTextActive}>
                ⊞
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'list' && styles.viewModeButtonActive,
              ]}
              onPress={() => setViewMode('list')}
            >
              <Text style={viewMode === 'list' && styles.viewModeButtonTextActive}>
                ☰
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <BlurView
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          style={styles.searchContainer}
        >
          <TextInput
            style={[styles.searchInput, isDark && styles.darkSearchInput]}
            placeholder="Search recordings..."
            placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </BlurView>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {['all', 'recent', 'favorites'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter && styles.filterButtonTextActive,
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recordings List */}
        <FlatList
          data={filteredRecordings}
          renderItem={renderRecordingCard}
          keyExtractor={(item) => item.id}
          key={viewMode}
          numColumns={viewMode === 'grid' ? 2 : 1}
          contentContainerStyle={[
            styles.listContent,
            viewMode === 'grid' && styles.gridContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? '#fff' : '#000'}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />

        {/* Recording Detail Modal */}
        <RecordingDetailModal
          visible={showDetailModal}
          recording={selectedRecording}
          onClose={() => setShowDetailModal(false)}
          onDelete={handleDeleteRecording}
          onShare={handleShareRecording}
          theme={theme}
        />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 4,
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  viewModeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  viewModeButtonTextActive: {
    color: 'white',
  },
  searchContainer: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  darkSearchInput: {
    color: '#f8fafc',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  gridContent: {
    gap: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  darkEmptyTitle: {
    color: '#f8fafc',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  darkEmptySubtitle: {
    color: '#94a3b8',
  },
});