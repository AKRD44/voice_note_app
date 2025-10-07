import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,\n} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface WaveformVisualizerProps {
  isActive: boolean;
  theme?: 'light' | 'dark';
  numberOfBars?: number;
  height?: number;
}

export default function WaveformVisualizer({
  isActive,
  theme = 'dark',
  numberOfBars = 40,
  height = 100,
}: WaveformVisualizerProps) {
  const [barHeights, setBarHeights] = useState<number[]>([]);
  const animations = useRef<Animated.Value[]>([]);

  useEffect(() => {
    // Initialize bar heights and animations
    const initialHeights = Array(numberOfBars).fill(0).map(() => Math.random() * 0.3 + 0.1);
    setBarHeights(initialHeights);
    
    animations.current = initialHeights.map((_, index) => {
      return new Animated.Value(initialHeights[index]);
    });
  }, [numberOfBars]);

  useEffect(() => {
    if (isActive) {
      startAnimation();
    } else {
      stopAnimation();
    }
  }, [isActive]);

  const startAnimation = () => {
    animations.current.forEach((anim, index) => {
      // Create random animation pattern
      const randomDelay = Math.random() * 200;
      const randomDuration = 300 + Math.random() * 400;
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: Math.random() * 0.8 + 0.2,
            duration: randomDuration,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: Math.random() * 0.3 + 0.1,
            duration: randomDuration,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      ).start();
    });
  };

  const stopAnimation = () => {
    animations.current.forEach((anim) => {
      anim.stopAnimation();
      Animated.timing(anim, {
        toValue: 0.1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    });
  };

  const getBarColor = (index: number) => {
    const colors = theme === 'dark' 
      ? ['rgba(59, 130, 246, 0.8)', 'rgba(139, 92, 246, 0.8)']
      : ['rgba(59, 130, 246, 0.6)', 'rgba(139, 92, 246, 0.6)'];
    
    return index % 2 === 0 ? colors[0] : colors[1];
  };

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.waveformContainer}>
        {barHeights.map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                height: animations.current[index]?.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, height * 0.8],
                }) || 0,
                backgroundColor: getBarColor(index),
              },
            ]}
          />
        ))}
      </View>
      
      {/* Optional gradient overlay for depth */}
      <LinearGradient
        colors={[
          'transparent',
          theme === 'dark' ? 'rgba(15, 23, 42, 0.3)' : 'rgba(248, 250, 252, 0.3)',
        ]}
        style={styles.gradientOverlay}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    gap: 2,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});