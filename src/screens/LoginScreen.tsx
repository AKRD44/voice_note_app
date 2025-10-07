/**
 * Login/Signup Screen
 * Beautiful authentication screen with Google OAuth
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { signInWithGoogle, isLoading, isAuthenticated } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('Home');
    }
  }, [isAuthenticated, navigation]);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await signInWithGoogle();

      // Success handled by auth context
      Toast.show({
        type: 'success',
        text1: 'Welcome to VoiceFlow!',
        text2: 'You're all set to start recording.',
      });
    } catch (error) {
      console.error('Sign-in error:', error);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Toast.show({
        type: 'error',
        text1: 'Sign-in Failed',
        text2: error instanceof Error ? error.message : 'Could not sign in. Please try again.',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://voiceflow.app/privacy');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://voiceflow.app/terms');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#3B82F6']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Animated Background Pattern */}
        <View style={styles.backgroundPattern}>
          {/* You can add animated shapes here */}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Logo/Icon Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>🎤</Text>
            </View>
            <Text style={styles.appName}>VoiceFlow</Text>
            <Text style={styles.tagline}>Transform messy thoughts into polished text</Text>
          </View>

          {/* Auth Card with Glassmorphism */}
          <BlurView intensity={20} tint="light" style={styles.authCard}>
            <View style={styles.cardContent}>
              {/* Welcome Text */}
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.welcomeSubtitle}>
                Sign in to continue your voice notes journey
              </Text>

              {/* Google Sign-In Button */}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
                disabled={isSigningIn || isLoading}
                activeOpacity={0.8}
              >
                <View style={styles.googleButtonContent}>
                  {isSigningIn || isLoading ? (
                    <ActivityIndicator color="#1e293b" size="small" />
                  ) : (
                    <>
                      <View style={styles.googleIconContainer}>
                        <Text style={styles.googleIcon}>G</Text>
                      </View>
                      <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>

              {/* Privacy Notice */}
              <View style={styles.privacyNotice}>
                <Text style={styles.privacyText}>
                  By signing in, you agree to our{' '}
                  <Text style={styles.privacyLink} onPress={openTermsOfService}>
                    Terms of Service
                  </Text>
                  {' '}and{' '}
                  <Text style={styles.privacyLink} onPress={openPrivacyPolicy}>
                    Privacy Policy
                  </Text>
                </Text>
              </View>

              {/* Security Badge */}
              <View style={styles.securityBadge}>
                <Text style={styles.securityIcon}>🔒</Text>
                <Text style={styles.securityText}>
                  Your data is encrypted and secure
                </Text>
              </View>
            </View>
          </BlurView>

          {/* Features Highlight */}
          <View style={styles.featuresSection}>
            {[
              { icon: '✨', text: 'AI-powered enhancement' },
              { icon: '🌍', text: 'Multi-language support' },
              { icon: '☁️', text: 'Cloud sync across devices' },
            ].map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          {/* Social Proof */}
          <View style={styles.socialProof}>
            <Text style={styles.socialProofText}>
              Join 10,000+ users who trust VoiceFlow
            </Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.stars}>★★★★★</Text>
              <Text style={styles.ratingText}>4.9/5.0</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
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
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 48,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    maxWidth: 280,
  },
  authCard: {
    width: width - 48,
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cardContent: {
    padding: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 32,
  },
  googleButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  privacyNotice: {
    marginTop: 12,
    marginBottom: 16,
  },
  privacyText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
  privacyLink: {
    color: 'white',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  securityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  securityText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  featuresSection: {
    marginTop: 48,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  socialProof: {
    marginTop: 40,
    alignItems: 'center',
  },
  socialProofText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stars: {
    fontSize: 16,
    color: '#FCD34D',
  },
  ratingText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
});

