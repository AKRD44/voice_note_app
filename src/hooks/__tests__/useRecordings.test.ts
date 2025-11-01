import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useRecordings } from '../hooks/useRecordings';
import { useAuth } from '../contexts/AuthContext';
import { getUserRecordings, createRecording, updateRecording, deleteRecording } from '../../lib/supabase';
import { AudioUtils } from '../../utils/audioUtils';

jest.mock('../contexts/AuthContext');
jest.mock('../../lib/supabase');
jest.mock('../../utils/audioUtils');

describe('useRecordings', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
    });
  });

  describe('loadRecordings', () => {
    it('should load recordings on mount', async () => {
      const mockRecordings = [
        {
          id: 'rec-1',
          title: 'Test Recording',
          user_id: 'user-123',
          audio_url: 'https://test.com/audio.m4a',
          original_transcript: 'Original',
          enhanced_transcript: 'Enhanced',
          language: 'en-US',
          style: 'note',
          duration: 60,
          word_count: 10,
          character_count: 50,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      (getUserRecordings as jest.Mock).mockResolvedValue(mockRecordings);

      const { result } = renderHook(() => useRecordings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.recordings).toHaveLength(1);
      expect(result.current.recordings[0].title).toBe('Test Recording');
    });

    it('should handle loading errors', async () => {
      (getUserRecordings as jest.Mock).mockRejectedValue(new Error('Load failed'));

      const { result } = renderHook(() => useRecordings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.recordings).toHaveLength(0);
    });

    it('should not load if user is not authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
      });

      const { result } = renderHook(() => useRecordings());

      expect(getUserRecordings).not.toHaveBeenCalled();
      expect(result.current.recordings).toHaveLength(0);
    });
  });

  describe('createRecording', () => {
    it('should create a new recording', async () => {
      const mockRecording = {
        id: 'rec-new',
        title: 'New Recording',
        user_id: 'user-123',
        audio_url: 'https://test.com/new.m4a',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      (createRecording as jest.Mock).mockResolvedValue(mockRecording);

      const { result } = renderHook(() => useRecordings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createRecording({
          title: 'New Recording',
          audio_url: 'https://test.com/new.m4a',
          language: 'en-US',
          style: 'note',
          duration: 60,
          word_count: null,
          character_count: null,
          original_transcript: null,
          enhanced_transcript: null,
        });
      });

      expect(createRecording).toHaveBeenCalled();
      expect(result.current.recordings.length).toBeGreaterThan(0);
    });

    it('should throw error if user not authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
      });

      const { result } = renderHook(() => useRecordings());

      await expect(
        result.current.createRecording({
          title: 'Test',
          audio_url: 'test.m4a',
          language: 'en-US',
          style: 'note',
          duration: 60,
          word_count: null,
          character_count: null,
          original_transcript: null,
          enhanced_transcript: null,
        })
      ).rejects.toThrow();
    });
  });

  describe('updateRecording', () => {
    it('should update existing recording', async () => {
      const mockRecordings = [
        {
          id: 'rec-1',
          title: 'Original',
          user_id: 'user-123',
        },
      ];

      (getUserRecordings as jest.Mock).mockResolvedValue(mockRecordings);
      (updateRecording as jest.Mock).mockResolvedValue({
        ...mockRecordings[0],
        title: 'Updated',
      });

      const { result } = renderHook(() => useRecordings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateRecording('rec-1', { title: 'Updated' });
      });

      expect(updateRecording).toHaveBeenCalledWith('rec-1', { title: 'Updated' });
    });
  });

  describe('deleteRecording', () => {
    it('should delete recording and audio file', async () => {
      const mockRecordings = [
        {
          id: 'rec-1',
          title: 'To Delete',
          user_id: 'user-123',
          audio_url: 'https://test.com/user-123/audio.m4a',
        },
      ];

      (getUserRecordings as jest.Mock).mockResolvedValue(mockRecordings);
      (deleteRecording as jest.Mock).mockResolvedValue(undefined);
      (AudioUtils.deleteFromSupabase as jest.Mock).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useRecordings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteRecording('rec-1');
      });

      expect(AudioUtils.deleteFromSupabase).toHaveBeenCalled();
      expect(deleteRecording).toHaveBeenCalledWith('rec-1');
    });
  });

  describe('searchRecordings', () => {
    it('should search recordings', async () => {
      const mockResults = [
        {
          id: 'rec-1',
          title: 'Found Recording',
          user_id: 'user-123',
        },
      ];

      (getUserRecordings as jest.Mock).mockResolvedValue(mockResults);

      const { result } = renderHook(() => useRecordings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let searchResults: any[] = [];

      await act(async () => {
        searchResults = await result.current.searchRecordings('Found');
      });

      expect(getUserRecordings).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ searchQuery: 'Found' })
      );
      expect(searchResults.length).toBeGreaterThan(0);
    });

    it('should return empty array if user not authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
      });

      const { result } = renderHook(() => useRecordings());

      const results = await result.current.searchRecordings('test');

      expect(results).toEqual([]);
    });
  });

  describe('getRecordingsPaginated', () => {
    it('should get paginated recordings', async () => {
      const mockRecordings = [
        { id: 'rec-1', title: 'Recording 1', user_id: 'user-123' },
        { id: 'rec-2', title: 'Recording 2', user_id: 'user-123' },
      ];

      (getUserRecordings as jest.Mock).mockResolvedValue(mockRecordings);

      const { result } = renderHook(() => useRecordings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let paginatedResults: any[] = [];

      await act(async () => {
        paginatedResults = await result.current.getRecordingsPaginated(0, 20);
      });

      expect(getUserRecordings).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ limit: 20, offset: 0 })
      );
      expect(paginatedResults.length).toBeGreaterThan(0);
    });
  });
});
