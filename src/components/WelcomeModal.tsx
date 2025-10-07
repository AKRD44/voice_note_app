import React, { useState } from 'react';
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

interface WelcomeModalProps {
  visible: boolean;
  onClose: () => void;
  theme: 'light' | 'dark' | 'auto';
}

export default function WelcomeModal({ visible, onClose, theme }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const slideAnim = useState(new Animated.Value(0))[0];

  const isDark = theme === 'dark';

  const tutorialSteps = [
    {
      title: 'Welcome to VoiceFlow',
      description: 'Transform your voice into clean, organized text with AI-powered transcription.',
      icon: '🎤',
    },
    {
      title: 'Record Your Voice',
      description: 'Tap the microphone to start recording. Speak naturally - we\'ll handle the rest.',
      icon: '🎙️',
    },
    {
      title: 'AI Magic Happens',
      description: 'Our AI cleans up filler words, improves grammar, and structures your thoughts.',
      icon: '✨',
    },
    {
      title: 'Get Perfect Text',
      description: 'Receive clean, readable text that you can edit, share, or export instantly.',
      icon: '📝',
    },
  ];

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentStep < tutorialSteps.length - 1) {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep + 1);
        slideAnim.setValue(width);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentStep > 0) {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep - 1);
        slideAnim.setValue(-width);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <BlurView
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          style={styles.blurBackground}
        />
        
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContent}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Text style={[styles.closeButtonText, isDark && styles.darkCloseButtonText]}>
                ✕
              </Text>
            </TouchableOpacity>

            {/* Skip Button */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={[styles.skipButtonText, isDark && styles.darkSkipButtonText]}>
                Skip
              </Text>
            </TouchableOpacity>

            {/* Main Content */}
            <Animated.View
              style={[
                styles.contentContainer,
                { transform: [{ translateX: slideAnim }] },
              ]}
            >
              <View style={styles.stepContent}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                  <Text style={styles.stepIcon}>
                    {tutorialSteps[currentStep].icon}
                  </Text>
                </View>

                {/* Title */}
                <Text style={[styles.stepTitle, isDark && styles.darkStepTitle]}>
                  {tutorialSteps[currentStep].title}
                </Text>

                {/* Description */}
                <Text style={[styles.stepDescription, isDark && styles.darkStepDescription]}>
                  {tutorialSteps[currentStep].description}
                </Text>
              </View>
            </Animated.View>

            {/* Progress Dots */}
            <View style={styles.progressContainer}>
              {tutorialSteps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index === currentStep && styles.progressDotActive,
                    isDark && styles.darkProgressDot,
                    index === currentStep && isDark && styles.darkProgressDotActive,
                  ]}
                />
              ))}
            </View>

            {/* Navigation Buttons */}
            <View style={styles.navigationContainer}>
              {currentStep > 0 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonSecondary]}
                  onPress={handlePrevious}
                >
                  <Text style={styles.navButtonTextSecondary}>Previous</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonPrimary]}
                onPress={handleNext}
              >
                <LinearGradient
                  colors={['#3b82f6', '#8b5cf6']}
                  style={styles.navButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.navButtonTextPrimary}>
                    {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748b',
  },
  darkCloseButtonText: {
    color: '#94a3b8',
  },
  skipButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 1,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  darkSkipButtonText: {
    color: '#94a3b8',
  },
  contentContainer: {
    width: '100%',
  },
  stepContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepIcon: {
    fontSize: 40,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  darkStepTitle: {
    color: '#f8fafc',
  },
  stepDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  darkStepDescription: {
    color: '#94a3b8',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
  progressDotActive: {
    backgroundColor: '#3b82f6',
  },
  darkProgressDot: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
  darkProgressDotActive: {
    backgroundColor: '#60a5fa',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 100,
    alignItems: 'center',
  },
  navButtonSecondary: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginRight: 12,
  },
  navButtonPrimary: {
    flex: 1,
  },
  navButtonGradient: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  navButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  navButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});