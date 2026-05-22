import axios from 'axios';
import { auth } from '@/config/firebase';

// ============================================================================
// TYPE DEFINITIONS (JSDoc)
// ============================================================================

/**
 * @typedef {Object} PresignResponse
 * @property {string} upload_url - Presigned URL for uploading to R2
 * @property {string} file_key - Unique file key for the uploaded file
 */

/**
 * @typedef {Object} ConfirmResponse
 * @property {string} public_url - Public URL to access the uploaded file
 */

/**
 * @typedef {'avatar'|'collection_cover'|'generic'} UploadCategory
 */

// ============================================================================
// HTTP CLIENT CONFIGURATION
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_LOCAL_API || 'http://localhost:8000';

/**
 * Create configured axios instance for upload API
 */
const uploadClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add authentication token to all requests
 */
uploadClient.interceptors.request.use(
  async (config) => {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      const error = new Error('User not authenticated');
      error.code = 'AUTH_ERROR';
      throw error;
    }

    try {
      const token = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      const authError = new Error('Failed to get authentication token');
      authError.code = 'AUTH_TOKEN_ERROR';
      throw authError;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors consistently
 */
uploadClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'AUTH_ERROR' || error.code === 'AUTH_TOKEN_ERROR') {
      return Promise.reject(error);
    }

    if (error.response) {
      const apiError = new Error(error.response.data?.message || 'Upload request failed');
      apiError.statusCode = error.response.status;
      apiError.code = error.response.data?.code || 'API_ERROR';
      return Promise.reject(apiError);
    }

    if (error.request) {
      const networkError = new Error('Network error - unable to reach server');
      networkError.code = 'NETWORK_ERROR';
      return Promise.reject(networkError);
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// UPLOAD SERVICE
// ============================================================================

/**
 * Upload Service
 * Handles file uploads to Cloudflare R2 via presigned URLs
 */
export const uploadService = {
  /**
   * Upload a file to R2 storage
   * 
   * @param {File} file - The file to upload
   * @param {UploadCategory} category - Upload category (avatar, collection_cover, generic)
   * @returns {Promise<string>} Public URL of the uploaded file
   * @throws {Error} If upload fails at any step
   */
  async uploadFile(file, category = 'collection_cover') {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit.');
    }

    try {
      // STEP 1: Get presigned URL from backend
      // Ensure filename is present (Blob may not have a name). Use sensible fallback.
      const extMap = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif'
      };
      const inferredExt = extMap[file.type] || 'bin';
      const filename = (file.name && file.name.length > 0) ? file.name : `upload_${Date.now()}.${inferredExt}`;

      const presignPayload = {
        filename,
        content_type: file.type || 'application/octet-stream',
        file_size: file.size || 0,
        category: category
      };

      const presignResponse = await uploadClient.post('/uploads/presign', presignPayload);
      const { upload_url, file_key } = presignResponse.data.data || presignResponse.data;

      if (!upload_url || !file_key) {
        throw new Error('Invalid presign response - missing upload_url or file_key');
      }

      // STEP 2: Upload file directly to Cloudflare R2
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error(`R2 upload failed with status ${uploadResponse.status}`);
      }

      // STEP 3: Confirm upload with backend
      const confirmPayload = {
        file_key: file_key,
        file_size: file.size
      };

      const confirmResponse = await uploadClient.post('/uploads/confirm', confirmPayload);
      const { public_url } = confirmResponse.data.data || confirmResponse.data;

      if (!public_url) {
        throw new Error('Invalid confirm response - missing public_url');
      }

      return public_url;
    } catch (error) {
      console.error('Upload failed:', error);
      
      // Re-throw with more context if it's our custom error
      if (error.code === 'AUTH_ERROR' || error.code === 'AUTH_TOKEN_ERROR') {
        throw error;
      }

      // Wrap other errors
      const uploadError = new Error(error.message || 'File upload failed');
      uploadError.code = error.code || 'UPLOAD_ERROR';
      uploadError.statusCode = error.statusCode;
      throw uploadError;
    }
  }
};
