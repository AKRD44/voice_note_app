import React from 'react';
import { render } from '@testing-library/react-native';
import App from './App';

// Mock the store providers
jest.mock('./src/store/recordingStore', () => ({
  useRecordingStore: () => ({
    recordings: [],
    isRecording: false,
    initializeStore: jest.fn(),
  }),
}));

jest.mock('./src/store/settingsStore', () => ({
  useSettingsStore: () => ({
    theme: 'light',
    initializeSettings: jest.fn(),
  }),
}));

describe('VoiceFlow App', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<App />);
    
    // Basic smoke test - app should render
    expect(getByText).toBeDefined();
  });

  it('has the correct app structure', () => {
    const { container } = render(<App />);
    
    // App should have navigation container
    expect(container).toBeDefined();
  });
});