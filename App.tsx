import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import TabBar from './src/components/TabBar';
import HomeScreen from './src/screens/HomeScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import RecordingScreen from './src/screens/RecordingScreen';
import LoginScreen from './src/screens/LoginScreen';
import { useRecordingStore } from './src/store/recordingStore';
import { useSettingsStore } from './src/store/settingsStore';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/**
 * Main tab navigator for authenticated users
 */
function MainTabs() {
  const { isRecording } = useRecordingStore();

  return (
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
            <RecordTabButton {...props} isRecording={isRecording} />
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
  );
}

/**
 * App navigation based on auth state
 */
function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { initializeStore } = useRecordingStore();
  const { initializeSettings } = useSettingsStore();

  useEffect(() => {
    // Initialize stores after auth is ready
    if (isAuthenticated) {
      initializeStore();
      initializeSettings();
    }
  }, [isAuthenticated]);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

/**
 * Root App Component
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <StatusBar 
            style="light" 
            backgroundColor="#1e293b" 
            translucent={false}
          />
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
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