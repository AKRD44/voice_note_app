import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';

import TabBar from './src/components/TabBar';
import HomeScreen from './src/screens/HomeScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import RecordingScreen from './src/screens/RecordingScreen';
import { useRecordingStore } from './src/store/recordingStore';
import { useSettingsStore } from './src/store/settingsStore';

const Tab = createBottomTabNavigator();

export default function App() {
  const { initializeStore } = useRecordingStore();
  const { initializeSettings } = useSettingsStore();

  useEffect(() => {
    // Initialize stores
    initializeStore();
    initializeSettings();
    
    // Request permissions
    // Permissions will be handled in individual components
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar 
          style="light" 
          backgroundColor="#1e293b" 
          translucent={false}
        />
        <NavigationContainer>
          <Tab.Navigator
            tabBar={(props) => <TabBar {...props} />}
            screenOptions={{
              headerShown: false,
              tabBarHideOnKeyboard: true,
            }}
          >
            <Tab.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ 
                tabBarLabel: 'Home',
                tabBarIcon: 'home'
              }}
            />
            <Tab.Screen 
              name="Library" 
              component={LibraryScreen}
              options={{ 
                tabBarLabel: 'Library',
                tabBarIcon: 'library'
              }}
            />
            <Tab.Screen 
              name="Record" 
              component={RecordingScreen}
              options={{ 
                tabBarLabel: 'Record',
                tabBarIcon: 'microphone',
                tabBarButton: (props) => (
                  <RecordTabButton {...props} />
                )
              }}
            />
            <Tab.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ 
                tabBarLabel: 'Settings',
                tabBarIcon: 'settings'
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

function RecordTabButton(props: any) {
  const { onPress } = props;
  const { isRecording } = useRecordingStore();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <View
      style={{
        position: 'absolute',
        top: -20,
        left: '50%',
        transform: [{ translateX: -30 }],
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: isRecording ? '#ef4444' : '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <Text style={{ fontSize: 24, color: 'white' }}>
        🎤
      </Text>
    </View>
  );
}