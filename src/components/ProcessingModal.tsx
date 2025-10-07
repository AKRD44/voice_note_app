import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface ProcessingModalProps {
  visible: boolean;
  stage: number;
  onCancel: () => void;
}

export default function ProcessingModal({ visible, stage, onCancel }: ProcessingModalProps) {
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('');
  const rotateAnim = useState(new Animated.Value(0))[0];

  const processingStages = [
    { text: 'Preparing audio...', progress: 0 },
    { text: 'Transcribing your audio...', progress: 25 },
    { text: 'Enhancing with AI...', progress: 65 },
    { text: 'Finalizing...', progress: 90 },
    { text: 'Complete!', progress: 100 },
  ];

  useEffect(() => {
    if (visible) {
      startRotation();
      updateStage();
    } else {
      stopRotation();
    }
  }, [visible, stage]);

  const startRotation = () => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopRotation = () => {
    rotateAnim.setValue(0);
  };

  const updateStage = () => {
    const currentStage = processingStages[stage] || processingStages[0];
    setStageText(currentStage.text);
    
    Animated.timing(new Animated.Value(progress), {
      toValue: currentStage.progress,
      duration: 1000,
      useNativeDriver: false,
    }).start((result) => {
      if (result.finished) {
        setProgress(currentStage.progress);
      }
    });
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.modalContainer}>
        <BlurView
          intensity={80}
          tint="dark"
          style={styles.blurBackground}
        />
        
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContent}>
            {/* Processing Animation */}
            <View style={styles.animationContainer}>
              <Animated.View
                style={[
                  styles.spinner,
                  { transform: [{ rotate: spin }] },
                ]}
              >
                <LinearGradient
                  colors={['#3b82f6', '#8b5cf6', '#ec4899']}
                  style={styles.spinnerGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              </Animated.View>
              
              {/* Inner Circle */}
              <View style={styles.innerCircle}>
                <Text style={styles.micIcon}>🎤</Text>
              </View>
            </View>

            {/* Processing Text */}
            <View style={styles.textContainer}>
              <Text style={styles.processingTitle}>
                Processing Your Recording
              </Text>
              <Text style={styles.processingSubtitle}>
                {stageText}
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={['#3b82f6', '#8b5cf6']}
                  style={[styles.progressBarFill, { width: `${progress}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(progress)}% complete
              </Text>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>
                Cancel
              </Text>
            </TouchableOpacity>

            {/* Processing Tips */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>What's happening:</Text>
              <View style={styles.tipsList}>
                {processingStages.slice(0, -1).map((stage, index) => (
                  <View key={index} style={styles.tipItem}>
                    <Text
                      style={[
                        styles.tipIcon,
                        index <= stage ? styles.tipIconActive : null,
                      ]}
                    >
                      {index <= stage ? '✓' : '○'}
                    </Text>
                    <Text
                      style={[
                        styles.tipText,
                        index <= stage ? styles.tipTextActive : null,
                      ]}
                    >
                      {stage.text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: width - 48,
    maxWidth: 400,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  animationContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  spinner: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  spinnerGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'transparent',
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  micIcon: {
    fontSize: 32,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  processingSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
  },
  cancelButtonText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  tipsContainer: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIcon: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginRight: 8,
    width: 16,
  },
  tipIconActive: {
    color: '#10b981',
  },
  tipText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    flex: 1,
  },
  tipTextActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});