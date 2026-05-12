/**
 * Schema Transformers Module
 * 
 * This module provides bidirectional transformation between backend (Python/Pydantic/snake_case)
 * and frontend (JavaScript/camelCase) data formats.
 * 
 * Core Functions:
 * - snakeToCamel: Convert snake_case keys to camelCase recursively
 * - camelToSnake: Convert camelCase keys to snake_case recursively
 * - parseISODate: Convert ISO datetime strings to Date objects
 * - formatISODate: Convert Date objects to ISO datetime strings
 * 
 * Error Handling:
 * - SchemaTransformError: Custom error for schema transformation failures
 * - ValidationError: Custom error for validation failures
 * - logSchemaError: Detailed error logging for debugging
 */

/**
 * Custom error class for schema transformation failures
 * Includes original data and schema type for debugging
 */
export class SchemaTransformError extends Error {
  /**
   * Create a SchemaTransformError
   * @param {string} message - Error message
   * @param {*} originalData - The original data that failed to transform
   * @param {string} schemaType - The schema type being transformed (e.g., 'UserProfile', 'Collection')
   */
  constructor(message, originalData, schemaType) {
    super(message);
    this.name = 'SchemaTransformError';
    this.originalData = originalData;
    this.schemaType = schemaType;
    
    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SchemaTransformError);
    }
  }
}

/**
 * Custom error class for validation failures
 * Includes field name and value that failed validation
 */
export class ValidationError extends Error {
  /**
   * Create a ValidationError
   * @param {string} message - Error message
   * @param {string} field - The field name that failed validation
   * @param {*} value - The value that failed validation
   */
  constructor(message, field, value) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    
    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

/**
 * Log detailed schema error information for debugging
 * In production, this can be extended to send errors to a tracking service
 * 
 * @param {Error} error - The error object to log
 * @param {Object} context - Additional context about where/when the error occurred
 * @param {string} [context.operation] - The operation being performed (e.g., 'transformUserProfile')
 * @param {string} [context.endpoint] - The API endpoint involved (if applicable)
 * @param {string} [context.userId] - The user ID involved (if applicable)
 * 
 * @example
 * try {
 *   transformUserProfile(data);
 * } catch (error) {
 *   logSchemaError(error, { operation: 'transformUserProfile', endpoint: '/me' });
 *   throw error;
 * }
 */
export function logSchemaError(error, context = {}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    errorType: error.name,
    message: error.message,
    context: context,
    stack: error.stack
  };
  
  // Add schema-specific error details
  if (error instanceof SchemaTransformError) {
    errorLog.schemaType = error.schemaType;
    errorLog.originalData = error.originalData;
  }
  
  // Add validation-specific error details
  if (error instanceof ValidationError) {
    errorLog.field = error.field;
    errorLog.value = error.value;
  }
  
  // Log to console with formatting
  console.error('=== Schema Error ===');
  console.error(JSON.stringify(errorLog, null, 2));
  console.error('===================');
  
  // In production, send to error tracking service
  // This is a placeholder for future integration with services like Sentry, LogRocket, etc.
  if (import.meta.env.PROD) {
    // Example: sendToErrorTracking(errorLog);
    // For now, we still log to console in production for visibility
    console.error('Production error logged:', errorLog);
  }
  
  return errorLog;
}

/**
 * Convert a snake_case string to camelCase
 * @param {string} str - String in snake_case format
 * @returns {string} String in camelCase format
 * @private
 */
function snakeToCamelString(str) {
  if (typeof str !== 'string') return str;
  
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Convert a camelCase string to snake_case
 * @param {string} str - String in camelCase format
 * @returns {string} String in snake_case format
 * @private
 */
function camelToSnakeString(str) {
  if (typeof str !== 'string') return str;
  
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case keys to camelCase recursively
 * Handles nested objects, arrays, null, and undefined values
 * 
 * @param {*} obj - Object with snake_case keys, or any other value
 * @returns {*} Object with camelCase keys, or the original value if not an object
 * 
 * @example
 * snakeToCamel({ user_name: 'test', display_name: 'Test User' })
 * // Returns: { userName: 'test', displayName: 'Test User' }
 * 
 * @example
 * snakeToCamel({ user_profile: { first_name: 'John', last_name: 'Doe' } })
 * // Returns: { userProfile: { firstName: 'John', lastName: 'Doe' } }
 * 
 * @example
 * snakeToCamel({ user_reviews: [{ review_text: 'Great', raw_stars: 5 }] })
 * // Returns: { userReviews: [{ reviewText: 'Great', rawStars: 5 }] }
 */
export function snakeToCamel(obj) {
  // Handle null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Handle primitive types (string, number, boolean)
  if (typeof obj !== 'object') {
    return obj;
  }
  
  // Handle Date objects - return as-is
  if (obj instanceof Date) {
    return obj;
  }
  
  // Handle arrays - recursively transform each element
  if (Array.isArray(obj)) {
    return obj.map(item => snakeToCamel(item));
  }
  
  // Handle objects - transform keys and recursively transform values
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = snakeToCamelString(key);
      result[camelKey] = snakeToCamel(obj[key]);
    }
  }
  
  return result;
}

/**
 * Convert camelCase keys to snake_case recursively
 * Handles nested objects, arrays, null, and undefined values
 * 
 * @param {*} obj - Object with camelCase keys, or any other value
 * @returns {*} Object with snake_case keys, or the original value if not an object
 * 
 * @example
 * camelToSnake({ userName: 'test', displayName: 'Test User' })
 * // Returns: { user_name: 'test', display_name: 'Test User' }
 * 
 * @example
 * camelToSnake({ userProfile: { firstName: 'John', lastName: 'Doe' } })
 * // Returns: { user_profile: { first_name: 'John', last_name: 'Doe' } }
 * 
 * @example
 * camelToSnake({ userReviews: [{ reviewText: 'Great', rawStars: 5 }] })
 * // Returns: { user_reviews: [{ review_text: 'Great', raw_stars: 5 }] }
 */
export function camelToSnake(obj) {
  // Handle null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Handle primitive types (string, number, boolean)
  if (typeof obj !== 'object') {
    return obj;
  }
  
  // Handle Date objects - return as-is
  if (obj instanceof Date) {
    return obj;
  }
  
  // Handle arrays - recursively transform each element
  if (Array.isArray(obj)) {
    return obj.map(item => camelToSnake(item));
  }
  
  // Handle objects - transform keys and recursively transform values
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = camelToSnakeString(key);
      result[snakeKey] = camelToSnake(obj[key]);
    }
  }
  
  return result;
}

/**
 * Convert ISO datetime string to JavaScript Date object
 * Handles null and undefined values gracefully
 * 
 * @param {string|null|undefined} isoString - ISO datetime string (e.g., "2024-01-15T10:30:00Z")
 * @returns {Date|null|undefined} JavaScript Date object, or null/undefined if input is null/undefined
 * 
 * @example
 * parseISODate('2024-01-15T10:30:00Z')
 * // Returns: Date object representing 2024-01-15 10:30:00 UTC
 * 
 * @example
 * parseISODate(null)
 * // Returns: null
 * 
 * @example
 * parseISODate(undefined)
 * // Returns: undefined
 */
export function parseISODate(isoString) {
  // Handle null and undefined
  if (isoString === null) {
    return null;
  }
  
  if (isoString === undefined) {
    return undefined;
  }
  
  // Handle non-string values
  if (typeof isoString !== 'string') {
    console.warn('parseISODate: Expected string, received:', typeof isoString);
    return null;
  }
  
  // Handle empty strings
  if (isoString.trim() === '') {
    return null;
  }
  
  // Parse ISO string to Date
  try {
    const date = new Date(isoString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('parseISODate: Invalid date string:', isoString);
      return null;
    }
    
    return date;
  } catch (error) {
    console.error('parseISODate: Error parsing date:', error);
    return null;
  }
}

/**
 * Convert JavaScript Date object to ISO datetime string
 * Handles null and undefined values gracefully
 * 
 * @param {Date|null|undefined} date - JavaScript Date object
 * @returns {string|null|undefined} ISO datetime string (e.g., "2024-01-15T10:30:00.000Z"), or null/undefined if input is null/undefined
 * 
 * @example
 * formatISODate(new Date('2024-01-15T10:30:00Z'))
 * // Returns: "2024-01-15T10:30:00.000Z"
 * 
 * @example
 * formatISODate(null)
 * // Returns: null
 * 
 * @example
 * formatISODate(undefined)
 * // Returns: undefined
 */
export function formatISODate(date) {
  // Handle null and undefined
  if (date === null) {
    return null;
  }
  
  if (date === undefined) {
    return undefined;
  }
  
  // Handle non-Date values
  if (!(date instanceof Date)) {
    console.warn('formatISODate: Expected Date object, received:', typeof date);
    return null;
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('formatISODate: Invalid Date object');
    return null;
  }
  
  // Convert to ISO string
  try {
    return date.toISOString();
  } catch (error) {
    console.error('formatISODate: Error formatting date:', error);
    return null;
  }
}

// ============================================================================
// AUTHENTICATION TRANSFORMERS
// ============================================================================

/**
 * Transform backend AuthResponse to frontend format
 * Converts snake_case to camelCase for authentication response data
 * 
 * @param {Object} backendAuth - Backend authentication response (snake_case)
 * @returns {Object} Frontend authentication data (camelCase)
 * @throws {ValidationError} If required fields are missing
 * @throws {SchemaTransformError} If transformation fails
 * 
 * @example
 * const backendAuth = {
 *   uid: 'user123',
 *   username: 'johndoe',
 *   display_name: 'John Doe',
 *   email: 'john@example.com'
 * };
 * const frontendAuth = transformAuthResponse(backendAuth);
 * // Returns: { uid: 'user123', username: 'johndoe', displayName: 'John Doe', email: 'john@example.com' }
 */
export function transformAuthResponse(backendAuth) {
  try {
    // Validate input
    if (!backendAuth || typeof backendAuth !== 'object') {
      throw new ValidationError(
        'Auth response must be an object',
        'backendAuth',
        backendAuth
      );
    }

    // Validate required fields
    if (!backendAuth.uid) {
      throw new ValidationError(
        'User ID (uid) is required in auth response',
        'uid',
        backendAuth.uid
      );
    }

    if (!backendAuth.username) {
      throw new ValidationError(
        'Username is required in auth response',
        'username',
        backendAuth.username
      );
    }

    if (!backendAuth.display_name) {
      throw new ValidationError(
        'Display name is required in auth response',
        'display_name',
        backendAuth.display_name
      );
    }

    // Transform snake_case to camelCase
    const transformed = snakeToCamel(backendAuth);

    // Validate transformed data has required fields
    if (!transformed.uid || !transformed.username || !transformed.displayName) {
      throw new SchemaTransformError(
        'Transformation resulted in missing required fields',
        backendAuth,
        'AuthResponse'
      );
    }

    return transformed;
  } catch (error) {
    // Log the error with context
    logSchemaError(error, {
      operation: 'transformAuthResponse',
      endpoint: '/auth'
    });

    // Re-throw for caller to handle
    throw error;
  }
}

/**
 * Transform frontend auth data to backend AuthRequest format
 * Converts camelCase to snake_case for authentication request
 * 
 * @param {Object} frontendAuth - Frontend authentication data (camelCase)
 * @returns {Object} Backend authentication request (snake_case)
 * @throws {ValidationError} If required fields are missing
 * @throws {SchemaTransformError} If transformation fails
 * 
 * @example
 * const frontendAuth = {
 *   token: 'firebase-id-token-here'
 * };
 * const backendRequest = transformAuthRequest(frontendAuth);
 * // Returns: { token: 'firebase-id-token-here' }
 */
export function transformAuthRequest(frontendAuth) {
  try {
    // Validate input
    if (!frontendAuth || typeof frontendAuth !== 'object') {
      throw new ValidationError(
        'Auth request must be an object',
        'frontendAuth',
        frontendAuth
      );
    }

    // Validate required fields
    if (!frontendAuth.token) {
      throw new ValidationError(
        'Firebase ID token is required',
        'token',
        frontendAuth.token
      );
    }

    if (typeof frontendAuth.token !== 'string' || frontendAuth.token.trim() === '') {
      throw new ValidationError(
        'Firebase ID token must be a non-empty string',
        'token',
        frontendAuth.token
      );
    }

    // Transform camelCase to snake_case
    const transformed = camelToSnake(frontendAuth);

    // Validate transformed data has required fields
    if (!transformed.token) {
      throw new SchemaTransformError(
        'Transformation resulted in missing required token',
        frontendAuth,
        'AuthRequest'
      );
    }

    return transformed;
  } catch (error) {
    // Log the error with context
    logSchemaError(error, {
      operation: 'transformAuthRequest',
      endpoint: '/auth'
    });

    // Re-throw for caller to handle
    throw error;
  }
}

// ============================================================================
// USER PROFILE TRANSFORMERS
// ============================================================================

/**
 * Transform backend UserPrivate to frontend UserProfile format
 * Handles all user profile fields including nested objects and datetime conversions
 * 
 * @param {Object} backendUser - Backend user data (snake_case)
 * @returns {Object} Frontend user profile (camelCase)
 * @throws {ValidationError} If required fields are missing
 * @throws {SchemaTransformError} If transformation fails
 * 
 * @example
 * const backendUser = {
 *   uid: 'user123',
 *   username: 'johndoe',
 *   display_name: 'John Doe',
 *   email: 'john@example.com',
 *   created_at: '2024-01-15T10:30:00Z',
 *   travel_profile: { weather_tolerance: 'cao' }
 * };
 * const frontendUser = transformUserProfile(backendUser);
 * // Returns: { uid: 'user123', username: 'johndoe', displayName: 'John Doe', ... }
 */
export function transformUserProfile(backendUser) {
  try {
    // Validate input
    if (!backendUser || typeof backendUser !== 'object') {
      throw new ValidationError(
        'User data must be an object',
        'backendUser',
        backendUser
      );
    }

    // Log backend response for debugging
    console.log('🔄 transformUserProfile input:', backendUser);

    // Validate required fields - uid should now be present in backend response
    if (!backendUser.uid) {
      console.warn('⚠️ User ID (uid) not found in backend response. Available fields:', Object.keys(backendUser));
      // Don't throw error, let it continue - uid might be added from Firebase user
    }

    if (!backendUser.username) {
      throw new ValidationError(
        'Username is required',
        'username',
        backendUser.username
      );
    }

    if (!backendUser.display_name) {
      throw new ValidationError(
        'Display name is required',
        'display_name',
        backendUser.display_name
      );
    }

    if (!backendUser.email) {
      throw new ValidationError(
        'Email is required',
        'email',
        backendUser.email
      );
    }

    if (!backendUser.created_at) {
      throw new ValidationError(
        'Created at timestamp is required',
        'created_at',
        backendUser.created_at
      );
    }

    // Transform snake_case to camelCase
    const transformed = snakeToCamel(backendUser);

    // Convert avatar_url to avatar object for backward compatibility
    if (transformed.avatarUrl) {
      transformed.avatar = {
        url: transformed.avatarUrl,
        provider: 'backend'
      };
      // Keep avatarUrl for direct access if needed
    } else if (transformed.avatarUrl === null || transformed.avatarUrl === undefined) {
      transformed.avatar = null;
    }

    // Convert datetime fields to Date objects
    if (transformed.createdAt) {
      transformed.createdAt = parseISODate(transformed.createdAt);
    }

    if (transformed.lastLogin) {
      transformed.lastLogin = parseISODate(transformed.lastLogin);
    }

    if (transformed.lastUpdated) {
      transformed.lastUpdated = parseISODate(transformed.lastUpdated);
    }

    // Handle nested objects - they're already transformed by snakeToCamel
    // but we need to ensure they exist with proper structure
    
    // travelProfile is already transformed (weather_tolerance -> weatherTolerance, etc.)
    // userBehaviorHistory array items are already transformed
    // If userBehaviorHistory has createdAt fields, convert them
    if (Array.isArray(transformed.userBehaviorHistory)) {
      transformed.userBehaviorHistory = transformed.userBehaviorHistory.map(event => {
        if (event.createdAt) {
          return {
            ...event,
            createdAt: parseISODate(event.createdAt)
          };
        }
        return event;
      });
    }

    // scoringWeights is already transformed by snakeToCamel
    
    // collections array items are already transformed
    // Convert datetime fields in collections
    if (Array.isArray(transformed.collections)) {
      transformed.collections = transformed.collections.map(collection => {
        const col = { ...collection };
        if (col.createdAt) col.createdAt = parseISODate(col.createdAt);
        if (col.updatedAt) col.updatedAt = parseISODate(col.updatedAt);
        
        // Transform nested arrays in collections
        if (Array.isArray(col.savers)) {
          col.savers = col.savers.map(saver => ({
            ...saver,
            savedAt: saver.savedAt ? parseISODate(saver.savedAt) : saver.savedAt
          }));
        }
        
        if (Array.isArray(col.collaborators)) {
          col.collaborators = col.collaborators.map(collab => ({
            ...collab,
            joinedAt: collab.joinedAt ? parseISODate(collab.joinedAt) : collab.joinedAt
          }));
        }
        
        if (Array.isArray(col.places)) {
          col.places = col.places.map(place => ({
            ...place,
            addedAt: place.addedAt ? parseISODate(place.addedAt) : place.addedAt
          }));
        }
        
        return col;
      });
    }

    // publicCollections array items are already transformed
    // Convert datetime fields in publicCollections
    if (Array.isArray(transformed.publicCollections)) {
      transformed.publicCollections = transformed.publicCollections.map(collection => {
        const col = { ...collection };
        if (col.createdAt) col.createdAt = parseISODate(col.createdAt);
        if (col.updatedAt) col.updatedAt = parseISODate(col.updatedAt);
        
        // Transform nested arrays in collections
        if (Array.isArray(col.savers)) {
          col.savers = col.savers.map(saver => ({
            ...saver,
            savedAt: saver.savedAt ? parseISODate(saver.savedAt) : saver.savedAt
          }));
        }
        
        if (Array.isArray(col.collaborators)) {
          col.collaborators = col.collaborators.map(collab => ({
            ...collab,
            joinedAt: collab.joinedAt ? parseISODate(collab.joinedAt) : collab.joinedAt
          }));
        }
        
        if (Array.isArray(col.places)) {
          col.places = col.places.map(place => ({
            ...place,
            addedAt: place.addedAt ? parseISODate(place.addedAt) : place.addedAt
          }));
        }
        
        return col;
      });
    }

    // Validate transformed data has required fields
    if (!transformed.uid || !transformed.username || !transformed.displayName || !transformed.email) {
      console.warn('⚠️ Missing required fields after transformation:', {
        hasUid: !!transformed.uid,
        hasUsername: !!transformed.username,
        hasDisplayName: !!transformed.displayName,
        hasEmail: !!transformed.email
      });
      throw new SchemaTransformError(
        'Transformation resulted in missing required fields (uid, username, displayName, or email)',
        backendUser,
        'UserProfile'
      );
    }

    console.log('✅ transformUserProfile output:', transformed);

    return transformed;
  } catch (error) {
    // Log the error with context
    logSchemaError(error, {
      operation: 'transformUserProfile',
      endpoint: '/me',
      userId: backendUser?.uid
    });

    // Re-throw for caller to handle
    throw error;
  }
}

/**
 * Transform frontend user profile update data to backend format
 * Converts camelCase to snake_case and Date objects to ISO strings
 * 
 * @param {Object} frontendData - Frontend update data (camelCase)
 * @returns {Object} Backend update data (snake_case)
 * @throws {ValidationError} If data validation fails
 * @throws {SchemaTransformError} If transformation fails
 * 
 * @example
 * const frontendUpdate = {
 *   displayName: 'John Doe Updated',
 *   bio: 'New bio text',
 *   avatarUrl: 'https://example.com/avatar.jpg'
 * };
 * const backendUpdate = transformUserProfileUpdate(frontendUpdate);
 * // Returns: { display_name: 'John Doe Updated', bio: 'New bio text', avatar_url: '...' }
 */
export function transformUserProfileUpdate(frontendData) {
  try {
    // Validate input
    if (!frontendData || typeof frontendData !== 'object') {
      throw new ValidationError(
        'Update data must be an object',
        'frontendData',
        frontendData
      );
    }

    // Validate field constraints if present
    if (frontendData.username !== undefined) {
      if (typeof frontendData.username !== 'string' || 
          frontendData.username.length < 3 || 
          frontendData.username.length > 16) {
        throw new ValidationError(
          'Username must be 3-16 characters',
          'username',
          frontendData.username
        );
      }
    }

    if (frontendData.displayName !== undefined) {
      if (typeof frontendData.displayName !== 'string' || 
          frontendData.displayName.length < 3 || 
          frontendData.displayName.length > 32) {
        throw new ValidationError(
          'Display name must be 3-32 characters',
          'displayName',
          frontendData.displayName
        );
      }
    }

    if (frontendData.bio !== undefined && frontendData.bio !== null) {
      if (typeof frontendData.bio !== 'string' || frontendData.bio.length > 500) {
        throw new ValidationError(
          'Bio must be a string with max 500 characters',
          'bio',
          frontendData.bio
        );
      }
    }

    if (frontendData.phoneNumber !== undefined && frontendData.phoneNumber !== null) {
      if (typeof frontendData.phoneNumber !== 'string' || frontendData.phoneNumber.length > 10) {
        throw new ValidationError(
          'Phone number must be a string with max 10 digits',
          'phoneNumber',
          frontendData.phoneNumber
        );
      }
    }

    // Convert Date objects to ISO strings before transformation
    const dataToTransform = { ...frontendData };
    
    // Handle avatar object conversion for backward compatibility
    // If avatar is an object with url property, extract the url
    if (dataToTransform.avatar && typeof dataToTransform.avatar === 'object' && dataToTransform.avatar.url) {
      dataToTransform.avatarUrl = dataToTransform.avatar.url;
      delete dataToTransform.avatar; // Remove nested object, keep flat avatarUrl
    }
    
    // Handle nested travelProfile if present
    if (dataToTransform.travelProfile && typeof dataToTransform.travelProfile === 'object') {
      // travelProfile doesn't have date fields, but ensure it's properly structured
      // Validate weatherTolerance if present
      if (dataToTransform.travelProfile.weatherTolerance) {
        const validTolerance = ['thap', 'trung_binh', 'cao'];
        if (!validTolerance.includes(dataToTransform.travelProfile.weatherTolerance)) {
          throw new ValidationError(
            `Weather tolerance must be one of: ${validTolerance.join(', ')}`,
            'travelProfile.weatherTolerance',
            dataToTransform.travelProfile.weatherTolerance
          );
        }
      }
    }

    // Handle nested scoringWeights if present
    if (dataToTransform.scoringWeights && typeof dataToTransform.scoringWeights === 'object') {
      // Validate that all weights are numbers between 0 and 1
      const weights = dataToTransform.scoringWeights;
      const weightFields = ['realRating', 'profileMatch', 'tripMatch', 'collectionAffinity', 'historyAffinity', 'weatherFit'];
      
      for (const field of weightFields) {
        if (weights[field] !== undefined) {
          if (typeof weights[field] !== 'number' || weights[field] < 0 || weights[field] > 1) {
            throw new ValidationError(
              `Scoring weight ${field} must be a number between 0 and 1`,
              `scoringWeights.${field}`,
              weights[field]
            );
          }
        }
      }
    }

    // Transform camelCase to snake_case
    const transformed = camelToSnake(dataToTransform);

    return transformed;
  } catch (error) {
    // Log the error with context
    logSchemaError(error, {
      operation: 'transformUserProfileUpdate',
      endpoint: '/me'
    });

    // Re-throw for caller to handle
    throw error;
  }
}

// ============================================================================
// COLLECTION TRANSFORMERS
// ============================================================================

/**
 * Transform backend CollectionPublic to frontend Collection format
 * Handles all collection fields including nested objects and datetime conversions
 * 
 * @param {Object} backendCollection - Backend collection data (snake_case)
 * @returns {Object} Frontend collection (camelCase)
 * @throws {ValidationError} If required fields are missing
 * @throws {SchemaTransformError} If transformation fails
 * 
 * @example
 * const backendCollection = {
 *   id: 'col123',
 *   owner_uid: 'user123',
 *   name: 'My Collection',
 *   created_at: '2024-01-15T10:30:00Z',
 *   visibility: 'PUBLIC'
 * };
 * const frontendCollection = transformCollection(backendCollection);
 */
export function transformCollection(backendCollection) {
  try {
    // Validate input
    if (!backendCollection || typeof backendCollection !== 'object') {
      throw new ValidationError(
        'Collection data must be an object',
        'backendCollection',
        backendCollection
      );
    }

    // Validate required fields
    if (!backendCollection.id) {
      throw new ValidationError(
        'Collection ID is required',
        'id',
        backendCollection.id
      );
    }

    if (!backendCollection.owner_uid) {
      throw new ValidationError(
        'Owner UID is required',
        'owner_uid',
        backendCollection.owner_uid
      );
    }

    if (!backendCollection.name) {
      throw new ValidationError(
        'Collection name is required',
        'name',
        backendCollection.name
      );
    }

    if (!backendCollection.created_at) {
      throw new ValidationError(
        'Created at timestamp is required',
        'created_at',
        backendCollection.created_at
      );
    }

    if (!backendCollection.updated_at) {
      throw new ValidationError(
        'Updated at timestamp is required',
        'updated_at',
        backendCollection.updated_at
      );
    }

    // Transform snake_case to camelCase
    const transformed = snakeToCamel(backendCollection);

    // Convert datetime fields to Date objects
    if (transformed.createdAt) {
      transformed.createdAt = parseISODate(transformed.createdAt);
    }

    if (transformed.updatedAt) {
      transformed.updatedAt = parseISODate(transformed.updatedAt);
    }

    // Transform nested arrays
    if (Array.isArray(transformed.savers)) {
      transformed.savers = transformed.savers.map(saver => ({
        ...saver,
        savedAt: saver.savedAt ? parseISODate(saver.savedAt) : saver.savedAt
      }));
    }

    if (Array.isArray(transformed.collaborators)) {
      transformed.collaborators = transformed.collaborators.map(collab => ({
        ...collab,
        joinedAt: collab.joinedAt ? parseISODate(collab.joinedAt) : collab.joinedAt
      }));
    }

    if (Array.isArray(transformed.places)) {
      transformed.places = transformed.places.map(place => ({
        ...place,
        addedAt: place.addedAt ? parseISODate(place.addedAt) : place.addedAt
      }));
    }

    // Convert visibility enum from uppercase to lowercase for frontend
    if (transformed.visibility) {
      transformed.visibility = transformed.visibility.toLowerCase();
    }

    // Validate transformed data has required fields
    if (!transformed.id || !transformed.ownerUid || !transformed.name) {
      throw new SchemaTransformError(
        'Transformation resulted in missing required fields',
        backendCollection,
        'Collection'
      );
    }

    return transformed;
  } catch (error) {
    // Log the error with context
    logSchemaError(error, {
      operation: 'transformCollection',
      endpoint: '/collections',
      collectionId: backendCollection?.id
    });

    // Re-throw for caller to handle
    throw error;
  }
}

/**
 * Transform frontend collection data to backend CollectionCreateRequest format
 * Converts camelCase to snake_case for collection creation
 * 
 * @param {Object} frontendData - Frontend collection data (camelCase)
 * @returns {Object} Backend collection create request (snake_case)
 * @throws {ValidationError} If required fields are missing or invalid
 * @throws {SchemaTransformError} If transformation fails
 * 
 * @example
 * const frontendData = {
 *   name: 'My Collection',
 *   description: 'A great collection',
 *   tags: ['travel', 'hotels'],
 *   visibility: 'public',
 *   thumbnailUrl: 'https://example.com/thumb.jpg'
 * };
 * const backendRequest = transformCollectionCreate(frontendData);
 */
export function transformCollectionCreate(frontendData) {
  try {
    // Validate input
    if (!frontendData || typeof frontendData !== 'object') {
      throw new ValidationError(
        'Collection data must be an object',
        'frontendData',
        frontendData
      );
    }

    // Validate required fields
    if (!frontendData.name) {
      throw new ValidationError(
        'Collection name is required',
        'name',
        frontendData.name
      );
    }

    if (typeof frontendData.name !== 'string' || 
        frontendData.name.length < 3 || 
        frontendData.name.length > 32) {
      throw new ValidationError(
        'Collection name must be 3-32 characters',
        'name',
        frontendData.name
      );
    }

    // Validate optional fields
    if (frontendData.description !== undefined && frontendData.description !== null) {
      if (typeof frontendData.description !== 'string' || 
          frontendData.description.length > 512) {
        throw new ValidationError(
          'Collection description must be a string with max 512 characters',
          'description',
          frontendData.description
        );
      }
    }

    if (frontendData.visibility) {
      const validVisibility = ['public', 'unlisted', 'private'];
      if (!validVisibility.includes(frontendData.visibility.toLowerCase())) {
        throw new ValidationError(
          `Visibility must be one of: ${validVisibility.join(', ')}`,
          'visibility',
          frontendData.visibility
        );
      }
    }

    // Prepare data for transformation
    const dataToTransform = {
      name: frontendData.name,
      description: frontendData.description || null,
      tags: Array.isArray(frontendData.tags) ? frontendData.tags : [],
      visibility: frontendData.visibility ? frontendData.visibility.toUpperCase() : 'PRIVATE',
      thumbnailUrl: frontendData.thumbnailUrl || null
    };

    // Transform camelCase to snake_case
    const transformed = camelToSnake(dataToTransform);

    return transformed;
  } catch (error) {
    // Log the error with context
    logSchemaError(error, {
      operation: 'transformCollectionCreate',
      endpoint: '/collections'
    });

    // Re-throw for caller to handle
    throw error;
  }
}

/**
 * Transform frontend collection update data to backend CollectionUpdateRequest format
 * Converts camelCase to snake_case for collection updates
 * 
 * @param {Object} frontendData - Frontend update data (camelCase)
 * @returns {Object} Backend collection update request (snake_case)
 * @throws {ValidationError} If data validation fails
 * @throws {SchemaTransformError} If transformation fails
 * 
 * @example
 * const frontendUpdate = {
 *   name: 'Updated Collection Name',
 *   description: 'Updated description',
 *   visibility: 'public'
 * };
 * const backendUpdate = transformCollectionUpdate(frontendUpdate);
 */
export function transformCollectionUpdate(frontendData) {
  try {
    // Validate input
    if (!frontendData || typeof frontendData !== 'object') {
      throw new ValidationError(
        'Update data must be an object',
        'frontendData',
        frontendData
      );
    }

    // Validate field constraints if present
    if (frontendData.name !== undefined) {
      if (typeof frontendData.name !== 'string' || 
          frontendData.name.length < 3 || 
          frontendData.name.length > 32) {
        throw new ValidationError(
          'Collection name must be 3-32 characters',
          'name',
          frontendData.name
        );
      }
    }

    if (frontendData.description !== undefined && frontendData.description !== null) {
      if (typeof frontendData.description !== 'string' || 
          frontendData.description.length > 512) {
        throw new ValidationError(
          'Collection description must be a string with max 512 characters',
          'description',
          frontendData.description
        );
      }
    }

    if (frontendData.visibility !== undefined) {
      const validVisibility = ['public', 'unlisted', 'private'];
      if (!validVisibility.includes(frontendData.visibility.toLowerCase())) {
        throw new ValidationError(
          `Visibility must be one of: ${validVisibility.join(', ')}`,
          'visibility',
          frontendData.visibility
        );
      }
    }

    // Prepare data for transformation
    const dataToTransform = { ...frontendData };

    // Convert visibility to uppercase if present
    if (dataToTransform.visibility) {
      dataToTransform.visibility = dataToTransform.visibility.toUpperCase();
    }

    // Transform camelCase to snake_case
    const transformed = camelToSnake(dataToTransform);

    return transformed;
  } catch (error) {
    // Log the error with context
    logSchemaError(error, {
      operation: 'transformCollectionUpdate',
      endpoint: '/collections'
    });

    // Re-throw for caller to handle
    throw error;
  }
}

// ============================================================================
// HOTEL DISCOVERY TRANSFORMERS
// ============================================================================

/**
 * Transform backend DiscoverHotel to frontend format
 * Handles all hotel fields including nested objects and datetime conversions
 * Implements fallback ID generation when propertyToken is null
 * 
 * @param {Object} backendHotel - Backend hotel data (snake_case)
 * @param {number} index - Index for fallback ID generation (optional)
 * @returns {Object} Frontend hotel (camelCase)
 * @throws {ValidationError} If required fields are missing
 * @throws {SchemaTransformError} If transformation fails
 * 
 * @example
 * const backendHotel = {
 *   property_token: 'hotel123',
 *   name: 'Grand Hotel',
 *   price: 150.00,
 *   raw_rating: 4.5,
 *   last_updated: '2024-01-15T10:30:00Z'
 * };
 * const frontendHotel = transformDiscoverHotel(backendHotel);
 */
export function transformDiscoverHotel(backendHotel, index = 0) {
  try {
    // Validate input
    if (!backendHotel || typeof backendHotel !== 'object') {
      throw new ValidationError(
        'Hotel data must be an object',
        'backendHotel',
        backendHotel
      );
    }

    // Validate required fields
    if (!backendHotel.name) {
      throw new ValidationError(
        'Hotel name is required',
        'name',
        backendHotel.name
      );
    }

    if (backendHotel.price === undefined || backendHotel.price === null) {
      throw new ValidationError(
        'Hotel price is required',
        'price',
        backendHotel.price
      );
    }

    if (backendHotel.raw_rating === undefined || backendHotel.raw_rating === null) {
      throw new ValidationError(
        'Hotel raw rating is required',
        'raw_rating',
        backendHotel.raw_rating
      );
    }

    // Transform snake_case to camelCase
    const transformed = snakeToCamel(backendHotel);

    // Handle fallback ID generation if propertyToken is null
    if (!transformed.propertyToken) {
      const timestamp = Date.now();
      transformed.propertyToken = `hotel-fallback-${timestamp}-${index}`;
      console.warn(`Generated fallback ID for hotel: ${transformed.name} -> ${transformed.propertyToken}`);
    }

    // Convert datetime fields to Date objects
    if (transformed.lastUpdated) {
      transformed.lastUpdated = parseISODate(transformed.lastUpdated);
    }

    // Handle nested aiSentiment object
    if (transformed.aiSentiment) {
      if (transformed.aiSentiment.aiScoreExpirationDate) {
        transformed.aiSentiment.aiScoreExpirationDate = parseISODate(
          transformed.aiSentiment.aiScoreExpirationDate
        );
      }
    }

    // Handle nested aiSummary object
    if (transformed.aiSummary) {
      if (transformed.aiSummary.aiSummaryExpirationDate) {
        transformed.aiSummary.aiSummaryExpirationDate = parseISODate(
          transformed.aiSummary.aiSummaryExpirationDate
        );
      }
    }

    // Nested objects (gpsCoordinates, images, userReviews, nearbyPlaces, bookingSources)
    // are already transformed by snakeToCamel recursively

    // Validate transformed data has required fields
    if (!transformed.name || transformed.price === undefined || transformed.rawRating === undefined) {
      throw new SchemaTransformError(
        'Transformation resulted in missing required fields',
        backendHotel,
        'DiscoverHotel'
      );
    }

    return transformed;
  } catch (error) {
    // Log the error with context
    logSchemaError(error, {
      operation: 'transformDiscoverHotel',
      endpoint: '/discover',
      hotelName: backendHotel?.name
    });

    // Re-throw for caller to handle
    throw error;
  }
}

/**
 * Transform frontend discover request to backend DiscoverRequest format
 * Converts camelCase to snake_case for hotel search parameters
 * 
 * @param {Object} frontendRequest - Frontend search parameters (camelCase)
 * @returns {Object} Backend discover request (snake_case)
 * @throws {ValidationError} If data validation fails
 * @throws {SchemaTransformError} If transformation fails
 * 
 * @example
 * const frontendRequest = {
 *   location: 'Hanoi',
 *   checkIn: '2024-02-01',
 *   checkOut: '2024-02-05',
 *   guests: 2,
 *   minPrice: 50,
 *   maxPrice: 200,
 *   amenities: ['wifi', 'pool']
 * };
 * const backendRequest = transformDiscoverRequest(frontendRequest);
 */
export function transformDiscoverRequest(frontendRequest) {
  try {
    // Validate input
    if (!frontendRequest || typeof frontendRequest !== 'object') {
      throw new ValidationError(
        'Discover request must be an object',
        'frontendRequest',
        frontendRequest
      );
    }

    // Validate required fields (if any)
    // Note: Backend may have different required fields, adjust as needed
    if (frontendRequest.location && typeof frontendRequest.location !== 'string') {
      throw new ValidationError(
        'Location must be a string',
        'location',
        frontendRequest.location
      );
    }

    if (frontendRequest.guests !== undefined) {
      if (typeof frontendRequest.guests !== 'number' || frontendRequest.guests < 1) {
        throw new ValidationError(
          'Guests must be a positive number',
          'guests',
          frontendRequest.guests
        );
      }
    }

    if (frontendRequest.minPrice !== undefined) {
      if (typeof frontendRequest.minPrice !== 'number' || frontendRequest.minPrice < 0) {
        throw new ValidationError(
          'Min price must be a non-negative number',
          'minPrice',
          frontendRequest.minPrice
        );
      }
    }

    if (frontendRequest.maxPrice !== undefined) {
      if (typeof frontendRequest.maxPrice !== 'number' || frontendRequest.maxPrice < 0) {
        throw new ValidationError(
          'Max price must be a non-negative number',
          'maxPrice',
          frontendRequest.maxPrice
        );
      }
    }

    // Validate price range
    if (frontendRequest.minPrice !== undefined && 
        frontendRequest.maxPrice !== undefined && 
        frontendRequest.minPrice > frontendRequest.maxPrice) {
      throw new ValidationError(
        'Min price cannot be greater than max price',
        'minPrice/maxPrice',
        { minPrice: frontendRequest.minPrice, maxPrice: frontendRequest.maxPrice }
      );
    }

    // Transform camelCase to snake_case
    const transformed = camelToSnake(frontendRequest);

    return transformed;
  } catch (error) {
    // Log the error with context
    logSchemaError(error, {
      operation: 'transformDiscoverRequest',
      endpoint: '/discover'
    });

    // Re-throw for caller to handle
    throw error;
  }
}

/**
 * Default export object containing all core transformation functions and error handling
 */
export default {
  snakeToCamel,
  camelToSnake,
  parseISODate,
  formatISODate,
  transformUserProfile,
  transformUserProfileUpdate,
  transformAuthResponse,
  transformAuthRequest,
  transformCollection,
  transformCollectionCreate,
  transformCollectionUpdate,
  transformDiscoverHotel,
  transformDiscoverRequest,
  SchemaTransformError,
  ValidationError,
  logSchemaError
};
