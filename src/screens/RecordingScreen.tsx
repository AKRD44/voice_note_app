import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import * as Permissions from 'expo-permissions';

import { useRecordingStore } from '../store/recordingStore';
import { useSettingsStore } from '../store/settingsStore';
import WaveformVisualizer from '../components/WaveformVisualizer';
import ProcessingModal from '../components/ProcessingModal';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

export default function RecordingScreen({ navigation }: any) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [showProcessing, setShowProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(0);
  
  const { recordingSettings } = useSettingsStore();
  const { 
    startRecording: startRecordingStore, 
    stopRecording: stopRecordingStore,
    addRecording,
    setProcessingState,
    updateTranscript
  } = useRecordingStore();

  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Request permissions on component mount
    requestPermissions();
    
    return () => {
      // Cleanup on unmount
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'VoiceFlow needs microphone access to record audio. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {} }
          ]
        );
        navigation.goBack();
      }
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  const startRecording = async () => {
    try {
      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: true,
      });

      // Prepare recording
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );

      // Start recording
      await newRecording.startAsync();
      
      setRecording(newRecording);
      setIsRecording(true);
      setIsPaused(false);
      
      // Start duration timer
      durationInterval.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          
          // Check recording limit
          if (newDuration >= recordingSettings.maxDuration) {
            stopRecording();
            return prev;
          }
          
          return newDuration;
        });
      }, 1000);

      // Store recording info
      const recordingUri = `${FileSystem.cacheDirectory}recording_${Date.now()}.m4a`;
      startRecordingStore(recordingUri);

      // Start pulse animation
      startPulseAnimation();
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      Toast.show({
        type: 'error',
        text1: 'Recording Failed',
        text2: 'Could not start recording. Please try again.',
      });
    }
  };

  const pauseRecording = async () => {
    if (!recording) return;
    
    try {
      await recording.pauseAsync();
      setIsPaused(true);
      
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
      
      stopPulseAnimation();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Failed to pause recording:', error);
    }
  };

  const resumeRecording = async () => {
    if (!recording) return;
    
    try {
      await recording.startAsync();
      setIsPaused(false);
      
      // Resume duration timer
      durationInterval.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      
      startPulseAnimation();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Failed to resume recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      // Stop recording
      await recording.stopAndUnloadAsync();
      
      // Clear timers
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
      
      // Get recording URI and info
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      
      setRecording(null);
      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);
      
      stopPulseAnimation();
      
      if (uri) {
        // Save recording to store
        const recordingData = await stopRecordingStore();
        if (recordingData) {
          const recordingId = addRecording({
            ...recordingData,
            duration: duration,
            isProcessing: true,
            processingProgress: 0,
          });
          
          // Start processing
          processRecording(recordingId, uri);
        }
      }
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Toast.show({
        type: 'error',
        text1: 'Recording Error',
        text2: 'Could not save recording. Please try again.',
      });
    }
  };

  const processRecording = async (recordingId: string, audioUri: string) => {
    setShowProcessing(true);
    setProcessingStage(0);
    
    try {
      // Stage 1: Upload audio (simulated)
      setProcessingStage(1);
      setProcessingState(recordingId, true, 20);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Stage 2: Transcription (simulated)
      setProcessingStage(2);
      setProcessingState(recordingId, true, 50);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Stage 3: AI Enhancement (simulated)
      setProcessingStage(3);
      setProcessingState(recordingId, true, 80);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Stage 4: Finalizing
      setProcessingStage(4);
      setProcessingState(recordingId, true, 100);
      
      // Simulate transcript generation
      const mockTranscript = "This is a sample transcript of your voice recording. The AI would process your actual audio and create a clean, well-structured text output here.";
      const mockEnhancedTranscript = "This is a sample transcript of your voice recording. The AI has processed your audio and created this clean, well-structured text output with improved grammar and organization.";
      
      updateTranscript(recordingId, mockTranscript, mockEnhancedTranscript);
      
      // Hide processing modal
      setShowProcessing(false);
      
      // Show success message
      Toast.show({
        type: 'success',
        text1: 'Recording Complete',
        text2: 'Your voice note has been transcribed successfully!',
      });
      
      // Navigate to library
      setTimeout(() => {
        navigation.replace('Library', { 
          screen: 'RecordingDetail', 
          params: { recordingId } 
        });
      }, 1000);
      
    } catch (error) {
      console.error('Processing error:', error);
      setShowProcessing(false);
      setProcessingState(recordingId, false, 0);
      
      Toast.show({
        type: 'error',
        text1: 'Processing Failed',
        text2: 'Could not process your recording. Please try again.',
      });
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.setValue(1);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    return (duration / recordingSettings.maxDuration) * 100;
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {isRecording ? 'Recording...' : 'New Recording'}
          </Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Waveform Visualizer */}
          <View style={styles.waveformContainer}>
            <WaveformVisualizer
              isActive={isRecording && !isPaused}
              theme="dark"
            />
          </View>

          {/* Duration Display */}
          <View style={styles.durationContainer}>
            <Text style={styles.durationText}>
              {formatDuration(duration)}
            </Text>
            <Text style={styles.durationLimit}>
              / {Math.floor(recordingSettings.maxDuration / 60)}:00
            </Text>
          </View>

          {/* Progress Ring */}
          <View style={styles.progressContainer}>
            <Animated.View
              style={[
                styles.progressRing,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  { width: `${getProgress()}%` },
                ]}
              />
            </Animated.View>
          </View>

          {/* Control Buttons */}
          <View style={styles.controlsContainer}>
            {!isRecording ? (
              <TouchableOpacity
                style={styles.recordButton}
                onPress={startRecording}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#3b82f6', '#8b5cf6']}
                  style={styles.recordButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.recordButtonIcon}>🎤</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.recordingControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={isPaused ? resumeRecording : pauseRecording}
                >
                  <Text style={styles.controlButtonIcon}>
                    {isPaused ? '▶️' : '⏸️'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.controlButton, styles.stopButton]}
                  onPress={stopRecording}
                >
                  <Text style={styles.controlButtonIcon}>⏹️</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Status Text */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {!isRecording
                ? 'Tap the microphone to start recording'
                : isPaused
                ? 'Recording paused'
                : 'Recording in progress...'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Processing Modal */}
      <ProcessingModal
        visible={showProcessing}
        stage={processingStage}
        onCancel={() => {
          setShowProcessing(false);
          // Handle cancel logic
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  closeButton: {
    position: 'absolute',
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  waveformContainer: {
    height: 120,
    width: '100%',
    marginBottom: 32,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  durationText: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'GeistMono',
  },
  durationLimit: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 24,
    fontWeight: '500',
    marginLeft: 8,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 48,
  },
  progressRing: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  controlsContainer: {
    marginBottom: 32,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recordButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonIcon: {
    fontSize: 48,
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(20px)',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  controlButtonIcon: {
    fontSize: 32,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    textAlign: 'center',
  },
});