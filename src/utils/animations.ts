/**
 * Animation Utilities
 * Reusable animation configurations and helpers
 */

import { withTiming, withSpring, withRepeat, Easing } from 'react-native-reanimated';

/**
 * Animation presets matching PRD specifications
 */
export const AnimationPresets = {
  // Button animations
  button: {
    scale: {
      hover: 1.05,
      active: 0.95,
      duration: 200,
    },
    timing: {
      duration: 200,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    },
  },

  // Card hover effects
  card: {
    scale: 1.02,
    translateY: -4,
    duration: 200,
    easing: Easing.out(Easing.ease),
  },

  // Record button
  recordButton: {
    pulse: {
      scale: { from: 1, to: 1.02 },
      duration: 2000,
      loop: true,
    },
    hover: {
      scale: 1.05,
      duration: 200,
    },
    recording: {
      rotate: '360deg',
      duration: 2000,
      loop: true,
    },
  },

  // Waveform
  waveform: {
    barTransition: {
      duration: 50,
      easing: Easing.out(Easing.ease),
    },
  },

  // Page transitions
  page: {
    enter: {
      opacity: { from: 0, to: 1 },
      translateY: { from: 20, to: 0 },
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    },
    exit: {
      opacity: { from: 1, to: 0 },
      translateY: { from: 0, to: -20 },
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    },
  },

  // Modal animations
  modal: {
    enter: {
      scale: { from: 0.9, to: 1 },
      opacity: { from: 0, to: 1 },
      duration: 200,
    },
    exit: {
      scale: { from: 1, to: 0.9 },
      opacity: { from: 1, to: 0 },
      duration: 150,
    },
    backdrop: {
      duration: 200,
    },
    slideUp: {
      translateY: { from: 1000, to: 0 },
      duration: 300,
      easing: Easing.out(Easing.cubic),
    },
  },

  // Toast notifications
  toast: {
    slideIn: {
      translateY: { from: -100, to: 0 },
      opacity: { from: 0, to: 1 },
      duration: 250,
    },
    slideOut: {
      translateY: { from: 0, to: -100 },
      opacity: { from: 1, to: 0 },
      duration: 200,
    },
    duration: 3000,
  },

  // List/Grid stagger
  stagger: {
    childDelay: 100, // ms between each item
    initial: {
      opacity: 0,
      translateY: 20,
    },
    animate: {
      opacity: 1,
      translateY: 0,
      duration: 300,
    },
  },

  // Loading states
  loading: {
    shimmer: {
      duration: 1500,
      loop: true,
    },
    spinner: {
      rotate: '360deg',
      duration: 1000,
      loop: true,
      easing: Easing.linear,
    },
    pulse: {
      opacity: { from: 0.5, to: 1 },
      duration: 1000,
      loop: true,
    },
  },

  // Scroll animations
  scroll: {
    fadeIn: {
      opacity: { from: 0, to: 1 },
      translateY: { from: 50, to: 0 },
      duration: 500,
    },
    parallax: {
      speed: 0.5, // 50% of scroll speed
    },
  },
};

/**
 * Helper functions for animations
 */
export const AnimationHelpers = {
  /**
   * Create a pulse animation
   */
  pulse: (scale: { from: number; to: number }, duration: number = 1000) => {
    return withRepeat(
      withTiming(scale.to, { duration }),
      -1,
      true
    );
  },

  /**
   * Create a spring animation
   */
  spring: (toValue: number, config?: { damping?: number; stiffness?: number }) => {
    return withSpring(toValue, {
      damping: config?.damping || 15,
      stiffness: config?.stiffness || 150,
    });
  },

  /**
   * Create a timing animation
   */
  timing: (toValue: number, duration: number = 300, easing?: any) => {
    return withTiming(toValue, {
      duration,
      easing: easing || Easing.inOut(Easing.ease),
    });
  },

  /**
   * Create a sequence of animations
   */
  sequence: (animations: Array<{ value: number; duration: number }>) => {
    // This would be implemented with worklets in Reanimated
    console.log('Sequence animation:', animations);
  },

  /**
   * Create a stagger effect for lists
   */
  stagger: (index: number, baseDelay: number = 100) => {
    return index * baseDelay;
  },

  /**
   * Interpolate value for scroll animations
   */
  interpolateScroll: (
    scrollY: number,
    inputRange: number[],
    outputRange: number[]
  ): number => {
    // Basic linear interpolation
    if (scrollY <= inputRange[0]) return outputRange[0];
    if (scrollY >= inputRange[inputRange.length - 1]) return outputRange[outputRange.length - 1];

    for (let i = 0; i < inputRange.length - 1; i++) {
      if (scrollY >= inputRange[i] && scrollY <= inputRange[i + 1]) {
        const progress = (scrollY - inputRange[i]) / (inputRange[i + 1] - inputRange[i]);
        return outputRange[i] + (outputRange[i + 1] - outputRange[i]) * progress;
      }
    }

    return outputRange[0];
  },
};

/**
 * Reduced motion check
 * Respect user's accessibility preferences
 */
export const shouldReduceMotion = (): boolean => {
  // In React Native, you'd check AccessibilityInfo
  // For now, return false
  return false;
};

/**
 * Get animation config based on reduced motion preference
 */
export const getAnimationConfig = <T>(
  normalConfig: T,
  reducedConfig: T
): T => {
  return shouldReduceMotion() ? reducedConfig : normalConfig;
};

export default {
  presets: AnimationPresets,
  helpers: AnimationHelpers,
  shouldReduceMotion,
  getAnimationConfig,
};

