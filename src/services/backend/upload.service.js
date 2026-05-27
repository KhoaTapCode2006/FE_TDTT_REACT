// ─── Upload Service ───────────────────────────────────────────────────────────
//
// Presigned upload flow:
//   1. POST /uploads/presign  → { upload_url, file_key, public_url, expires_at }
//   2. PUT  upload_url        → upload file binary trực tiếp lên storage
//   3. POST /uploads/confirm  → { file_key, public_url, size_bytes, content_type }
//
// Export chính: uploadFile(file, category?) → public_url
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios';
import { auth } from '@/config/firebase';

// ============================================================================
// HTTP CLIENT
// ============================================================================

const uploadClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

uploadClient.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    const err = new Error('User not authenticated');
    err.code = 'AUTH_ERROR';
    throw err;
  }
  const token = await currentUser.getIdToken(/* forceRefresh */ true);
  config.headers.Authorization = `Bearer ${token}`;
  console.debug('[uploadClient] uid:', currentUser.uid, 'url:', config.url);
  return config;
});

uploadClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail ?? error.response?.data?.message ?? error.message;
    console.error(`[uploadClient] ${status}:`, detail);
    const err = new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    err.statusCode = status;
    return Promise.reject(err);
  }
);

// ============================================================================
// UPLOAD FLOW
// ============================================================================

/**
 * Step 1 — Request a presigned upload URL from the backend.
 *
 * @param {{ filename: string, content_type: string, file_size: number, category?: string }} param0
 * @returns {Promise<{ upload_url: string, file_key: string, public_url: string, expires_at: string }>}
 */
async function presign({ filename, content_type, file_size, category = 'generic' }) {
  const payload = {
    filename,
    content_type,
    file_size,
    category,
  };
  console.debug('[presign] request:', payload);
  const res = await uploadClient.post('/uploads/presign', payload);
  console.debug('[presign] response:', res.data);
  const data = res.data?.data;
  if (!data?.upload_url || !data?.file_key) {
    throw new Error('Invalid presign response');
  }
  return data;
}

/**
 * Step 2 — Upload the file binary directly to the presigned URL.
 * Uses native fetch (no auth header — presigned URL is self-authenticating).
 *
 * @param {string} uploadUrl
 * @param {File} file
 * @returns {Promise<string>} ETag from response headers
 */
async function putFile(uploadUrl, file) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
  }
  // ETag is returned by S3-compatible storage
  const etag = res.headers.get('ETag') ?? res.headers.get('etag') ?? '';
  return etag.replace(/"/g, ''); // strip surrounding quotes if present
}

/**
 * Step 3 — Confirm the upload with the backend.
 *
 * @param {{ file_key: string, file_size: number, etag: string }} param0
 * @returns {Promise<{ file_key: string, public_url: string, size_bytes: number, content_type: string }>}
 */
async function confirm({ file_key, file_size, etag }) {
  const res = await uploadClient.post('/uploads/confirm', {
    file_key,
    file_size,
    etag,
  });
  const data = res.data?.data;
  if (!data?.public_url) {
    throw new Error('Invalid confirm response');
  }
  return data;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Upload a file using the presigned upload flow.
 * Returns the public URL of the uploaded file.
 *
 * @param {File} file - The file to upload
 * @param {string} [category='generic'] - Upload category (e.g. 'avatar', 'thumbnail')
 * @returns {Promise<string>} Public URL
 * @throws {Error} On any step failure
 */
export async function uploadFile(file, category = 'generic') {
  // Step 1: get presigned URL
  const { upload_url, file_key } = await presign({
    filename:     file.name,
    content_type: file.type,
    file_size:    file.size,
    category,
  });

  // Step 2: upload binary
  const etag = await putFile(upload_url, file);

  // Step 3: confirm
  const { public_url } = await confirm({
    file_key,
    file_size: file.size,
    etag,
  });

  return public_url;
}
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
