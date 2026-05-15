import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { userService } from './user.service';
import { auth } from '@/config/firebase';

// Mock axios
vi.mock('axios');

describe('userService - Task 1.1: User Service and API Integration', () => {
  let mockAxiosInstance;
  
  beforeEach(() => {
    // Create mock axios instance
    mockAxiosInstance = {
      get: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn((successHandler, errorHandler) => {
            mockAxiosInstance._requestInterceptor = { successHandler, errorHandler };
          }),
        },
        response: {
          use: vi.fn((successHandler, errorHandler) => {
            mockAxiosInstance._responseInterceptor = { successHandler, errorHandler };
          }),
        },
      },
    };
    
    axios.create.mockReturnValue(mockAxiosInstance);
    
    // Mock Firebase auth
    auth.currentUser = {
      uid: 'test-user-123',
      getIdToken: vi.fn().mockResolvedValue('mock-token-12345'),
    };
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  // ============================================================================
  // Validation Tests
  // ============================================================================
  
  describe('Input Validation', () => {
    it('should reject search query less than 2 characters', async () => {
      await expect(userService.searchUsers('a')).rejects.toThrow('Search query must be at least 2 characters');
    });
    
    it('should reject empty search query', async () => {
      await expect(userService.searchUsers('')).rejects.toThrow('Search query must be at least 2 characters');
    });
    
    it('should reject search query with only whitespace', async () => {
      await expect(userService.searchUsers('  ')).rejects.toThrow('Search query must be at least 2 characters');
    });
    
    it('should reject non-string search query', async () => {
      await expect(userService.searchUsers(123)).rejects.toThrow('Search query must be a string');
    });
    
    it('should reject search query longer than 100 characters', async () => {
      const longQuery = 'a'.repeat(101);
      await expect(userService.searchUsers(longQuery)).rejects.toThrow('Search query must be maximum 100 characters');
    });
    
    it('should accept valid search query with 2 characters', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { data: [] }
      });
      
      await expect(userService.searchUsers('ab')).resolves.toBeDefined();
    });
    
    it('should trim whitespace from search query', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { data: [] }
      });
      
      await userService.searchUsers('  test  ');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/users',
        expect.objectContaining({
          params: { search: 'test' }
        })
      );
    });
  });
  
  // ============================================================================
  // API Request Tests
  // ============================================================================
  
  describe('API Request', () => {
    it('should call GET /users endpoint with search parameter', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { data: [] }
      });
      
      await userService.searchUsers('john');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/users',
        expect.objectContaining({
          params: { search: 'john' }
        })
      );
    });
    
    it('should include AbortSignal when provided', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { data: [] }
      });
      
      const controller = new AbortController();
      await userService.searchUsers('test', { signal: controller.signal });
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/users',
        expect.objectContaining({
          signal: controller.signal
        })
      );
    });
    
    it('should work without AbortSignal', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { data: [] }
      });
      
      await userService.searchUsers('test');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/users',
        expect.objectContaining({
          params: { search: 'test' }
        })
      );
    });
  });
  
  // ============================================================================
  // Authentication Tests
  // ============================================================================
  
  describe('Authentication', () => {
    it('should add authentication token to request headers', async () => {
      const mockConfig = {
        headers: {},
        url: '/users',
      };
      
      // Call the request interceptor
      const result = await mockAxiosInstance._requestInterceptor.successHandler(mockConfig);
      
      expect(auth.currentUser.getIdToken).toHaveBeenCalled();
      expect(result.headers.Authorization).toBe('Bearer mock-token-12345');
    });
    
    it('should reject request when user is not authenticated', async () => {
      auth.currentUser = null;
      
      const mockConfig = {
        headers: {},
        url: '/users',
      };
      
      await expect(
        mockAxiosInstance._requestInterceptor.successHandler(mockConfig)
      ).rejects.toThrow('User not authenticated');
    });
    
    it('should handle token retrieval errors', async () => {
      auth.currentUser.getIdToken.mockRejectedValue(new Error('Token error'));
      
      const mockConfig = {
        headers: {},
        url: '/users',
      };
      
      await expect(
        mockAxiosInstance._requestInterceptor.successHandler(mockConfig)
      ).rejects.toThrow('Token error');
    });
  });
  
  // ============================================================================
  // Response Transformation Tests
  // ============================================================================
  
  describe('Response Transformation', () => {
    it('should transform API response to UserItem array', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              uid: 'user-1',
              username: 'john_doe',
              display_name: 'John Doe',
              avatar_url: 'https://example.com/avatar1.jpg'
            },
            {
              uid: 'user-2',
              username: 'jane_smith',
              display_name: 'Jane Smith',
              avatar_url: null
            }
          ]
        }
      };
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      
      const result = await userService.searchUsers('john');
      
      expect(result).toEqual([
        {
          uid: 'user-1',
          username: 'john_doe',
          display_name: 'John Doe',
          avatar_url: 'https://example.com/avatar1.jpg'
        },
        {
          uid: 'user-2',
          username: 'jane_smith',
          display_name: 'Jane Smith',
          avatar_url: null
        }
      ]);
    });
    
    it('should handle empty results array', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { data: [] }
      });
      
      const result = await userService.searchUsers('nonexistent');
      
      expect(result).toEqual([]);
    });
    
    it('should convert missing avatar_url to null', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          data: [
            {
              uid: 'user-1',
              username: 'test_user',
              display_name: 'Test User',
              // avatar_url is missing
            }
          ]
        }
      });
      
      const result = await userService.searchUsers('test');
      
      expect(result[0].avatar_url).toBeNull();
    });
  });
  
  // ============================================================================
  // Error Handling Tests
  // ============================================================================
  
  describe('Error Handling', () => {
    it('should transform network errors to NETWORK_ERROR', async () => {
      const networkError = new Error('Network failed');
      networkError.request = {};
      
      mockAxiosInstance.get.mockRejectedValue(networkError);
      
      try {
        await userService.searchUsers('test');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.code).toBe('NETWORK_ERROR');
        expect(error.message).toBe('Network error - please check your connection');
      }
    });
    
    it('should transform timeout errors to TIMEOUT_ERROR', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.code = 'ECONNABORTED';
      
      mockAxiosInstance.get.mockRejectedValue(timeoutError);
      
      try {
        await userService.searchUsers('test');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.code).toBe('TIMEOUT_ERROR');
        expect(error.message).toBe('Request timeout - please try again');
      }
    });
    
    it('should transform 404 errors to SERVER_ERROR with specific message', async () => {
      const notFoundError = new Error('Not found');
      notFoundError.response = {
        status: 404,
        data: {}
      };
      
      mockAxiosInstance.get.mockRejectedValue(notFoundError);
      
      try {
        await userService.searchUsers('test');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.code).toBe('SERVER_ERROR');
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('User not found');
      }
    });
    
    it('should transform 500 errors to SERVER_ERROR with specific message', async () => {
      const serverError = new Error('Internal server error');
      serverError.response = {
        status: 500,
        data: {}
      };
      
      mockAxiosInstance.get.mockRejectedValue(serverError);
      
      try {
        await userService.searchUsers('test');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.code).toBe('SERVER_ERROR');
        expect(error.statusCode).toBe(500);
        expect(error.message).toBe('Server error - please try again later');
      }
    });
    
    it('should transform 403 errors to SERVER_ERROR with permission message', async () => {
      const forbiddenError = new Error('Forbidden');
      forbiddenError.response = {
        status: 403,
        data: { message: 'Access denied' }
      };
      
      mockAxiosInstance.get.mockRejectedValue(forbiddenError);
      
      try {
        await userService.searchUsers('test');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.code).toBe('SERVER_ERROR');
        expect(error.statusCode).toBe(403);
        expect(error.message).toBe('Access denied');
      }
    });
    
    it('should preserve original error in transformed error', async () => {
      const originalError = new Error('Original error');
      originalError.request = {};
      
      mockAxiosInstance.get.mockRejectedValue(originalError);
      
      try {
        await userService.searchUsers('test');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.originalError).toBe(originalError);
      }
    });
  });
  
  // ============================================================================
  // Request Cancellation Tests
  // ============================================================================
  
  describe('Request Cancellation', () => {
    it('should support request cancellation via AbortSignal', async () => {
      const controller = new AbortController();
      
      mockAxiosInstance.get.mockImplementation(() => {
        controller.abort();
        const error = new Error('Request aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });
      
      await expect(
        userService.searchUsers('test', { signal: controller.signal })
      ).rejects.toThrow('Request aborted');
    });
    
    it('should pass signal to axios request', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { data: [] }
      });
      
      const controller = new AbortController();
      await userService.searchUsers('test', { signal: controller.signal });
      
      const callArgs = mockAxiosInstance.get.mock.calls[0];
      expect(callArgs[1].signal).toBe(controller.signal);
    });
  });
  
  // ============================================================================
  // Integration Tests
  // ============================================================================
  
  describe('Integration: Full Request Flow', () => {
    it('should complete successful search flow', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              uid: 'user-1',
              username: 'testuser',
              display_name: 'Test User',
              avatar_url: 'https://example.com/avatar.jpg'
            }
          ]
        }
      };
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      
      const result = await userService.searchUsers('test');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        uid: 'user-1',
        username: 'testuser',
        display_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg'
      });
    });
    
    it('should handle search with special characters', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { data: [] }
      });
      
      await userService.searchUsers('test@user');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/users',
        expect.objectContaining({
          params: { search: 'test@user' }
        })
      );
    });
  });
});
