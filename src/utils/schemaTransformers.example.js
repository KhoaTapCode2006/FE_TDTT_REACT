/**
 * Example Usage of Schema Transformers with Error Handling
 * 
 * This file demonstrates how to use the error handling classes
 * in real-world schema transformation scenarios.
 */

import {
  snakeToCamel,
  camelToSnake,
  SchemaTransformError,
  ValidationError,
  logSchemaError
} from './schemaTransformers.js';

/**
 * Example 1: Transform user profile with error handling
 */
export function transformUserProfile(backendUser) {
  try {
    // Validate required fields
    if (!backendUser || typeof backendUser !== 'object') {
      throw new ValidationError(
        'User data must be an object',
        'backendUser',
        backendUser
      );
    }

    if (!backendUser.uid) {
      throw new ValidationError(
        'User ID is required',
        'uid',
        backendUser.uid
      );
    }

    if (!backendUser.username) {
      throw new ValidationError(
        'Username is required',
        'username',
        backendUser.username
      );
    }

    // Transform the data
    const transformed = snakeToCamel(backendUser);

    // Validate transformed data
    if (!transformed.uid || !transformed.username) {
      throw new SchemaTransformError(
        'Transformation resulted in missing required fields',
        backendUser,
        'UserProfile'
      );
    }

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
 * Example 2: Transform collection with validation
 */
export function transformCollection(backendCollection) {
  try {
    // Validate input
    if (!backendCollection) {
      throw new ValidationError(
        'Collection data is required',
        'backendCollection',
        backendCollection
      );
    }

    // Check required fields
    const requiredFields = ['id', 'owner_uid', 'name'];
    for (const field of requiredFields) {
      if (!backendCollection[field]) {
        throw new ValidationError(
          `Required field '${field}' is missing`,
          field,
          backendCollection[field]
        );
      }
    }

    // Validate visibility enum
    const validVisibility = ['PUBLIC', 'UNLISTED', 'PRIVATE'];
    if (backendCollection.visibility && !validVisibility.includes(backendCollection.visibility)) {
      throw new ValidationError(
        `Invalid visibility value. Must be one of: ${validVisibility.join(', ')}`,
        'visibility',
        backendCollection.visibility
      );
    }

    // Transform the data
    const transformed = snakeToCamel(backendCollection);

    return transformed;
  } catch (error) {
    // Log with context
    logSchemaError(error, {
      operation: 'transformCollection',
      endpoint: '/collections',
      collectionId: backendCollection?.id
    });

    throw error;
  }
}

/**
 * Example 3: Safe transformation with fallback
 */
export function safeTransform(data, schemaType, fallbackValue = null) {
  try {
    if (!data) {
      return fallbackValue;
    }

    return snakeToCamel(data);
  } catch (error) {
    // Log the error but don't throw - return fallback instead
    logSchemaError(error, {
      operation: 'safeTransform',
      schemaType: schemaType
    });

    return fallbackValue;
  }
}

/**
 * Example 4: Batch transformation with error collection
 */
export function transformBatch(items, schemaType) {
  const results = [];
  const errors = [];

  for (let i = 0; i < items.length; i++) {
    try {
      const transformed = snakeToCamel(items[i]);
      results.push(transformed);
    } catch (error) {
      // Collect errors instead of failing immediately
      const errorLog = logSchemaError(error, {
        operation: 'transformBatch',
        schemaType: schemaType,
        itemIndex: i
      });
      
      errors.push({
        index: i,
        item: items[i],
        error: errorLog
      });
    }
  }

  return {
    results,
    errors,
    successCount: results.length,
    errorCount: errors.length
  };
}

/**
 * Example 5: API service with error handling
 */
export async function fetchUserProfile(userId) {
  try {
    // Simulate API call
    const response = await fetch(`/api/users/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const backendData = await response.json();

    // Transform with validation
    return transformUserProfile(backendData);
  } catch (error) {
    // Log with full context
    logSchemaError(error, {
      operation: 'fetchUserProfile',
      endpoint: `/api/users/${userId}`,
      userId: userId
    });

    // Provide user-friendly error message
    if (error instanceof ValidationError) {
      throw new Error(`Invalid user data: ${error.message}`);
    }

    if (error instanceof SchemaTransformError) {
      throw new Error(`Failed to process user data: ${error.message}`);
    }

    // Re-throw other errors
    throw error;
  }
}
