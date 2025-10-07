import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';

export interface Recording {
  id: string;
  title: string;
  audioUri: string;
  duration: number;
  createdAt: Date;
  transcript?: string;
  enhancedTranscript?: string;
  style: 'note' | 'email' | 'blog' | 'summary' | 'transcript' | 'custom';
  language: string;
  tags: string[];
  isProcessing: boolean;
  processingProgress: number;
}

interface RecordingState {
  recordings: Recording[];
  isRecording: boolean;
  currentRecording?: {
    uri: string;
    duration: number;
    startTime: Date;
  };
  recordingSettings: {
    maxDuration: number;
    audioQuality: 'low' | 'medium' | 'high';
    autoSave: boolean;
    defaultStyle: Recording['style'];
    defaultLanguage: string;
  };
  
  // Actions
  initializeStore: () => Promise<void>;
  startRecording: (uri: string) => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<Recording | null>;
  addRecording: (recording: Omit<Recording, 'id'>) => string;
  updateRecording: (id: string, updates: Partial<Recording>) => void;
  deleteRecording: (id: string) => Promise<void>;
  setProcessingState: (id: string, isProcessing: boolean, progress: number) => void;
  updateTranscript: (id: string, transcript: string, enhancedTranscript: string) => void;
  setRecordingSettings: (settings: Partial<RecordingState['recordingSettings']>) => void;
}

export const useRecordingStore = create<RecordingState>()(
  persist(
    (set, get) => ({
      recordings: [],
      isRecording: false,
      currentRecording: undefined,
      recordingSettings: {
        maxDuration: 180, // 3 minutes for free tier
        audioQuality: 'medium',
        autoSave: true,
        defaultStyle: 'note',
        defaultLanguage: 'en-US',
      },

      initializeStore: async () => {
        // Clean up old audio files on initialization
        const recordings = get().recordings;
        const validRecordings: Recording[] = [];

        for (const recording of recordings) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(recording.audioUri);
            if (fileInfo.exists) {
              validRecordings.push(recording);
            }
          } catch (error) {
            console.warn('Failed to check audio file:', error);
          }
        }

        set({ recordings: validRecordings });
      },

      startRecording: (uri: string) => {
        set({
          isRecording: true,
          currentRecording: {
            uri,
            duration: 0,
            startTime: new Date(),
          },
        });
      },

      pauseRecording: () => {
        // Implementation would handle actual audio recording pause
        set({ isRecording: false });
      },

      resumeRecording: () => {
        set({ isRecording: true });
      },

      stopRecording: async () => {
        const { currentRecording } = get();
        if (!currentRecording) return null;

        const recording: Recording = {
          id: `rec_${Date.now()}`,
          title: `Recording ${get().recordings.length + 1}`,
          audioUri: currentRecording.uri,
          duration: currentRecording.duration,
          createdAt: new Date(),
          style: get().recordingSettings.defaultStyle,
          language: get().recordingSettings.defaultLanguage,
          tags: [],
          isProcessing: false,
          processingProgress: 0,
        };

        set({
          isRecording: false,
          currentRecording: undefined,
        });

        return recording;
      },

      addRecording: (recordingData) => {
        const id = `rec_${Date.now()}`;
        const recording: Recording = {
          ...recordingData,
          id,
        };

        set((state) => ({
          recordings: [recording, ...state.recordings],
        }));

        return id;
      },

      updateRecording: (id, updates) => {
        set((state) => ({
          recordings: state.recordings.map((recording) =>
            recording.id === id ? { ...recording, ...updates } : recording
          ),
        }));
      },

      deleteRecording: async (id) => {
        const recording = get().recordings.find((r) => r.id === id);
        if (recording) {
          try {
            await FileSystem.deleteAsync(recording.audioUri);
          } catch (error) {
            console.warn('Failed to delete audio file:', error);
          }
        }

        set((state) => ({
          recordings: state.recordings.filter((recording) => recording.id !== id),
        }));
      },

      setProcessingState: (id, isProcessing, progress) => {
        set((state) => ({
          recordings: state.recordings.map((recording) =>
            recording.id === id
              ? { ...recording, isProcessing, processingProgress: progress }
              : recording
          ),
        }));
      },

      updateTranscript: (id, transcript, enhancedTranscript) => {
        set((state) => ({
          recordings: state.recordings.map((recording) =>
            recording.id === id
              ? {
                  ...recording,
                  transcript,
                  enhancedTranscript,
                  isProcessing: false,
                  processingProgress: 100,
                }
              : recording
          ),
        }));
      },

      setRecordingSettings: (settings) => {
        set((state) => ({
          recordingSettings: { ...state.recordingSettings, ...settings },
        }));
      },
    }),
    {
      name: 'recording-store',
      storage: createJSONStorage(() => SecureStore),
      partialize: (state) => ({
        recordings: state.recordings,
        recordingSettings: state.recordingSettings,
      }),
    }
  )
);