import { renderHook, act } from '@testing-library/react-native';
import { useRecordingStore, Recording } from '../store/recordingStore';
import * as FileSystem from 'expo-file-system';

jest.mock('expo-file-system');

describe('recordingStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useRecordingStore.getState();
    store.recordings = [];
    store.isRecording = false;
    store.currentRecording = undefined;
  });

  describe('initializeStore', () => {
    it('should initialize store successfully', async () => {
      const { result } = renderHook(() => useRecordingStore());

      await act(async () => {
        await result.current.initializeStore();
      });

      expect(result.current.recordings).toEqual([]);
    });

    it('should remove recordings with missing audio files', async () => {
      const mockRecording: Recording = {
        id: 'rec_1',
        title: 'Test Recording',
        audioUri: 'file:///nonexistent.m4a',
        duration: 60,
        createdAt: new Date(),
        style: 'note',
        language: 'en-US',
        tags: [],
        isProcessing: false,
        processingProgress: 0,
      };

      const { result } = renderHook(() => useRecordingStore());

      act(() => {
        result.current.addRecording(mockRecording);
      });

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
        exists: false,
      });

      await act(async () => {
        await result.current.initializeStore();
      });

      expect(result.current.recordings).toEqual([]);
    });

    it('should keep recordings with valid audio files', async () => {
      const mockRecording: Recording = {
        id: 'rec_1',
        title: 'Test Recording',
        audioUri: 'file:///valid.m4a',
        duration: 60,
        createdAt: new Date(),
        style: 'note',
        language: 'en-US',
        tags: [],
        isProcessing: false,
        processingProgress: 0,
      };

      const { result } = renderHook(() => useRecordingStore());

      act(() => {
        result.current.addRecording(mockRecording);
      });

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
        exists: true,
      });

      await act(async () => {
        await result.current.initializeStore();
      });

      expect(result.current.recordings).toHaveLength(1);
    });
  });

  describe('startRecording', () => {
    it('should start recording', () => {
      const { result } = renderHook(() => useRecordingStore());

      act(() => {
        result.current.startRecording('file:///test.m4a');
      });

      expect(result.current.isRecording).toBe(true);
      expect(result.current.currentRecording).toBeDefined();
      expect(result.current.currentRecording?.uri).toBe('file:///test.m4a');
    });
  });

  describe('pauseRecording', () => {
    it('should pause recording', () => {
      const { result } = renderHook(() => useRecordingStore());

      act(() => {
        result.current.startRecording('file:///test.m4a');
      });

      expect(result.current.isRecording).toBe(true);

      act(() => {
        result.current.pauseRecording();
      });

      expect(result.current.isRecording).toBe(false);
    });
  });

  describe('resumeRecording', () => {
    it('should resume recording', () => {
      const { result } = renderHook(() => useRecordingStore());

      act(() => {
        result.current.startRecording('file:///test.m4a');
        result.current.pauseRecording();
      });

      expect(result.current.isRecording).toBe(false);

      act(() => {
        result.current.resumeRecording();
      });

      expect(result.current.isRecording).toBe(true);
    });
  });

  describe('stopRecording', () => {
    it('should stop recording and return recording object', async () => {
      const { result } = renderHook(() => useRecordingStore());

      act(() => {
        result.current.startRecording('file:///test.m4a');
      });

      let recording: Recording | null = null;

      await act(async () => {
        recording = await result.current.stopRecording();
      });

      expect(recording).not.toBeNull();
      expect(recording?.audioUri).toBe('file:///test.m4a');
      expect(result.current.isRecording).toBe(false);
      expect(result.current.currentRecording).toBeUndefined();
    });

    it('should return null if no recording is active', async () => {
      const { result } = renderHook(() => useRecordingStore());

      let recording: Recording | null = null;

      await act(async () => {
        recording = await result.current.stopRecording();
      });

      expect(recording).toBeNull();
    });
  });

  describe('addRecording', () => {
    it('should add a new recording', () => {
      const { result } = renderHook(() => useRecordingStore());

      const newRecording = {
        title: 'New Recording',
        audioUri: 'file:///new.m4a',
        duration: 120,
        createdAt: new Date(),
        style: 'note' as const,
        language: 'en-US',
        tags: [],
        isProcessing: false,
        processingProgress: 0,
      };

      let recordingId: string;

      act(() => {
        recordingId = result.current.addRecording(newRecording);
      });

      expect(result.current.recordings).toHaveLength(1);
      expect(result.current.recordings[0].title).toBe('New Recording');
      expect(recordingId!).toBeDefined();
    });
  });

  describe('updateRecording', () => {
    it('should update existing recording', () => {
      const { result } = renderHook(() => useRecordingStore());

      const recording = {
        title: 'Original Title',
        audioUri: 'file:///test.m4a',
        duration: 60,
        createdAt: new Date(),
        style: 'note' as const,
        language: 'en-US',
        tags: [],
        isProcessing: false,
        processingProgress: 0,
      };

      let recordingId: string;

      act(() => {
        recordingId = result.current.addRecording(recording);
      });

      act(() => {
        result.current.updateRecording(recordingId!, { title: 'Updated Title' });
      });

      expect(result.current.recordings[0].title).toBe('Updated Title');
    });

    it('should not update non-existent recording', () => {
      const { result } = renderHook(() => useRecordingStore());

      act(() => {
        result.current.updateRecording('nonexistent', { title: 'Updated' });
      });

      expect(result.current.recordings).toHaveLength(0);
    });
  });

  describe('deleteRecording', () => {
    it('should delete recording and audio file', async () => {
      const { result } = renderHook(() => useRecordingStore());

      const recording = {
        title: 'To Delete',
        audioUri: 'file:///delete.m4a',
        duration: 60,
        createdAt: new Date(),
        style: 'note' as const,
        language: 'en-US',
        tags: [],
        isProcessing: false,
        processingProgress: 0,
      };

      let recordingId: string;

      act(() => {
        recordingId = result.current.addRecording(recording);
      });

      await act(async () => {
        await result.current.deleteRecording(recordingId!);
      });

      expect(result.current.recordings).toHaveLength(0);
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file:///delete.m4a');
    });
  });

  describe('setProcessingState', () => {
    it('should update processing state', () => {
      const { result } = renderHook(() => useRecordingStore());

      const recording = {
        title: 'Processing',
        audioUri: 'file:///test.m4a',
        duration: 60,
        createdAt: new Date(),
        style: 'note' as const,
        language: 'en-US',
        tags: [],
        isProcessing: false,
        processingProgress: 0,
      };

      let recordingId: string;

      act(() => {
        recordingId = result.current.addRecording(recording);
      });

      act(() => {
        result.current.setProcessingState(recordingId!, true, 50);
      });

      expect(result.current.recordings[0].isProcessing).toBe(true);
      expect(result.current.recordings[0].processingProgress).toBe(50);
    });
  });

  describe('updateTranscript', () => {
    it('should update transcript and enhanced transcript', () => {
      const { result } = renderHook(() => useRecordingStore());

      const recording = {
        title: 'Transcript Test',
        audioUri: 'file:///test.m4a',
        duration: 60,
        createdAt: new Date(),
        style: 'note' as const,
        language: 'en-US',
        tags: [],
        isProcessing: false,
        processingProgress: 0,
      };

      let recordingId: string;

      act(() => {
        recordingId = result.current.addRecording(recording);
      });

      act(() => {
        result.current.updateTranscript(
          recordingId!,
          'Raw transcript',
          'Enhanced transcript'
        );
      });

      expect(result.current.recordings[0].transcript).toBe('Raw transcript');
      expect(result.current.recordings[0].enhancedTranscript).toBe('Enhanced transcript');
      expect(result.current.recordings[0].isProcessing).toBe(false);
      expect(result.current.recordings[0].processingProgress).toBe(100);
    });
  });

  describe('setRecordingSettings', () => {
    it('should update recording settings', () => {
      const { result } = renderHook(() => useRecordingStore());

      act(() => {
        result.current.setRecordingSettings({
          maxDuration: 300,
          audioQuality: 'high',
        });
      });

      expect(result.current.recordingSettings.maxDuration).toBe(300);
      expect(result.current.recordingSettings.audioQuality).toBe('high');
    });
  });
});
