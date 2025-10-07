import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export default function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const isDark = false; // This would come from theme context

  const getIcon = (routeName: string, focused: boolean) => {
    const icons: { [key: string]: string } = {
      Home: '🏠',
      Library: '📚',
      Record: '🎤',
      Settings: '⚙️',
    };
    
    return icons[routeName] || '❓';
  };

  const handleTabPress = (route: any, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (route.name === 'Record') {
      // Special handling for record button
      navigation.navigate('Record');
    } else {
      navigation.navigate(route.name);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <BlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        style={styles.blurView}
      >
        <LinearGradient
          colors={isDark ? ['rgba(30, 41, 59, 0.9)', 'rgba(15, 23, 42, 0.9)'] : ['rgba(248, 250, 252, 0.9)', 'rgba(226, 232, 240, 0.9)']}
          style={styles.gradient}
        >
          <View style={styles.tabContainer}>
            {state.routes.map((route: any, index: number) => {
              const { options } = descriptors[route.key];
              const label = options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

              const isFocused = state.index === index;
              const isRecordButton = route.name === 'Record';

              if (isRecordButton) {
                return (
                  <View key={route.key} style={styles.recordButtonContainer}>
                    <TouchableOpacity
                      style={[styles.recordButton, isFocused && styles.recordButtonActive]}
                      onPress={() => handleTabPress(route, index)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={isFocused ? ['#ef4444', '#dc2626'] : ['#3b82f6', '#8b5cf6']}
                        style={styles.recordButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.recordButtonIcon}>
                          {getIcon(route.name, isFocused)}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                );
              }

              return (
                <TouchableOpacity
                  key={route.key}
                  style={[styles.tab, isFocused && styles.tabActive]}
                  onPress={() => handleTabPress(route, index)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabIcon,
                      isFocused && styles.tabIconActive,
                    ]}
                  >
                    {getIcon(route.name, isFocused)}
                  </Text>
                  <Text
                    style={[
                      styles.tabLabel,
                      isFocused && styles.tabLabelActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </LinearGradient>
      </BlurView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  blurView: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  gradient: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    opacity: 0.6,
  },
  tabLabelActive: {
    color: '#3b82f6',
    opacity: 1,
  },
  recordButtonContainer: {
    position: 'absolute',
    top: -20,
    left: width / 2 - 30,
    width: 60,
    height: 60,
  },
  recordButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recordButtonActive: {
    shadowColor: '#ef4444',
  },
  recordButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonIcon: {
    fontSize: 24,
  },
});