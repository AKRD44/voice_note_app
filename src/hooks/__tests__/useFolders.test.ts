import { renderHook, act } from '@testing-library/react-native';
import { useFolders } from '../hooks/useFolders';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

jest.mock('../contexts/AuthContext');
jest.mock('../../lib/supabase');

describe('useFolders', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
    });

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      single: jest.fn(),
    });

    (supabase.from as jest.Mock) = mockFrom;
  });

  describe('loadFolders', () => {
    it('should load folders on mount', async () => {
      const mockFolders = [
        {
          id: 'folder-1',
          user_id: 'user-123',
          name: 'Test Folder',
          color: '#FF0000',
          created_at: '2024-01-01',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockFolders,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const { result, waitForNextUpdate } = renderHook(() => useFolders());

      await waitForNextUpdate();

      expect(result.current.folders.length).toBeGreaterThan(0);
    });

    it('should handle loading errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Load failed'),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should handle error gracefully
      expect(result.current.folders).toEqual([]);
    });
  });

  describe('createFolder', () => {
    it('should create a new folder', async () => {
      const mockFolder = {
        id: 'folder-new',
        user_id: 'user-123',
        name: 'New Folder',
        color: '#0000FF',
        created_at: '2024-01-01',
      };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockFolder,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await result.current.createFolder('New Folder', '#0000FF');
      });

      expect(mockQuery.insert).toHaveBeenCalled();
    });

    it('should throw error if user not authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
      });

      const { result } = renderHook(() => useFolders());

      await expect(
        result.current.createFolder('Test Folder')
      ).rejects.toThrow();
    });
  });

  describe('updateFolder', () => {
    it('should update folder', async () => {
      const mockUpdatedFolder = {
        id: 'folder-1',
        name: 'Updated Folder',
        color: '#00FF00',
      };

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockUpdatedFolder,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await result.current.updateFolder('folder-1', { name: 'Updated Folder' });
      });

      expect(mockQuery.update).toHaveBeenCalled();
    });
  });

  describe('deleteFolder', () => {
    it('should delete folder', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await result.current.deleteFolder('folder-1');
      });

      expect(mockQuery.delete).toHaveBeenCalled();
    });
  });

  describe('addRecordingToFolder', () => {
    it('should add recording to folder', async () => {
      const mockQuery = {
        insert: jest.fn().mockResolvedValue({
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await result.current.addRecordingToFolder('rec-1', 'folder-1');
      });

      expect(mockQuery.insert).toHaveBeenCalled();
    });
  });

  describe('removeRecordingFromFolder', () => {
    it('should remove recording from folder', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await result.current.removeRecordingFromFolder('rec-1', 'folder-1');
      });

      expect(mockQuery.delete).toHaveBeenCalled();
    });
  });
});
