/**
 * COLLECTION SERVICE - USAGE EXAMPLES
 * 
 * This file demonstrates how to use the Collection Service API.
 * Import the service in your components and use these patterns.
 */

import { collectionService } from './collection.service';

// ============================================================================
// EXAMPLE 1: Create a new collection
// ============================================================================

async function exampleCreateCollection() {
  try {
    const newCollection = await collectionService.createCollection({
      name: 'My Favorite Hotels',
      description: 'A curated list of amazing hotels I want to visit',
      tags: ['luxury', 'beach', 'romantic'],
      visibility: 'public',
      thumbnail_url: 'https://example.com/thumbnail.jpg'
    });
    
    console.log('Collection created:', newCollection);
    // Returns: CollectionData object with id, owner_uid, created_at, etc.
  } catch (error) {
    if (error.code === 'VALIDATION_ERROR') {
      console.error('Validation failed:', error.message);
    } else if (error.code === 'AUTH_ERROR') {
      console.error('Please login first');
    } else {
      console.error('Failed to create collection:', error.message);
    }
  }
}

// ============================================================================
// EXAMPLE 2: Get collection details
// ============================================================================

async function exampleGetCollection(collectionId) {
  try {
    const collection = await collectionService.getCollection(collectionId);
    
    console.log('Collection:', collection.name);
    console.log('Places:', collection.places.length);
    console.log('Collaborators:', collection.collaborators.length);
    console.log('Tags:', collection.tags);
  } catch (error) {
    if (error.code === 'SERVER_ERROR' && error.statusCode === 404) {
      console.error('Collection not found');
    } else {
      console.error('Failed to get collection:', error.message);
    }
  }
}

// ============================================================================
// EXAMPLE 3: Update collection
// ============================================================================

async function exampleUpdateCollection(collectionId) {
  try {
    const updated = await collectionService.updateCollection(collectionId, {
      name: 'Updated Collection Name',
      description: 'New description',
      visibility: 'private'
    });
    
    console.log('Collection updated:', updated);
  } catch (error) {
    if (error.code === 'SERVER_ERROR' && error.statusCode === 403) {
      console.error('Only the owner can update this collection');
    } else {
      console.error('Failed to update:', error.message);
    }
  }
}

// ============================================================================
// EXAMPLE 4: Add places (hotels) to collection
// ============================================================================

async function exampleAddPlaces(collectionId, hotelIds) {
  try {
    const updated = await collectionService.addPlacesToCollection(
      collectionId,
      hotelIds // e.g., ['hotel_123', 'hotel_456']
    );
    
    console.log('Places added. Total places:', updated.places.length);
  } catch (error) {
    if (error.code === 'VALIDATION_ERROR') {
      console.error('Invalid place IDs:', error.message);
    } else {
      console.error('Failed to add places:', error.message);
    }
  }
}

// ============================================================================
// EXAMPLE 5: Remove places from collection
// ============================================================================

async function exampleRemovePlaces(collectionId, hotelIds) {
  try {
    const updated = await collectionService.removePlacesFromCollection(
      collectionId,
      hotelIds
    );
    
    console.log('Places removed. Remaining places:', updated.places.length);
  } catch (error) {
    console.error('Failed to remove places:', error.message);
  }
}

// ============================================================================
// EXAMPLE 6: Add collaborators
// ============================================================================

async function exampleAddCollaborators(collectionId, userIds) {
  try {
    const updated = await collectionService.addCollaboratorsToCollection(
      collectionId,
      userIds // e.g., ['user_uid_1', 'user_uid_2']
    );
    
    console.log('Collaborators added:', updated.collaborators.length);
  } catch (error) {
    if (error.code === 'SERVER_ERROR' && error.statusCode === 403) {
      console.error('Only the owner can add collaborators');
    } else {
      console.error('Failed to add collaborators:', error.message);
    }
  }
}

// ============================================================================
// EXAMPLE 7: Manage tags
// ============================================================================

async function exampleManageTags(collectionId) {
  try {
    // Add tags
    const withNewTags = await collectionService.addTagsToCollection(
      collectionId,
      ['beach', 'luxury', 'family-friendly']
    );
    console.log('Tags after adding:', withNewTags.tags);
    
    // Remove tags
    const withRemovedTags = await collectionService.removeTagsFromCollection(
      collectionId,
      ['family-friendly']
    );
    console.log('Tags after removing:', withRemovedTags.tags);
  } catch (error) {
    console.error('Failed to manage tags:', error.message);
  }
}

// ============================================================================
// EXAMPLE 8: Delete collection
// ============================================================================

async function exampleDeleteCollection(collectionId) {
  try {
    const success = await collectionService.deleteCollection(collectionId);
    
    if (success) {
      console.log('Collection deleted successfully');
    }
  } catch (error) {
    if (error.code === 'SERVER_ERROR' && error.statusCode === 403) {
      console.error('Only the owner can delete this collection');
    } else if (error.code === 'SERVER_ERROR' && error.statusCode === 404) {
      console.error('Collection not found');
    } else {
      console.error('Failed to delete:', error.message);
    }
  }
}

// ============================================================================
// EXAMPLE 9: Complete workflow - Create, Add Places, Share, Delete
// ============================================================================

async function exampleCompleteWorkflow() {
  try {
    // 1. Create collection
    const collection = await collectionService.createCollection({
      name: 'Summer Vacation 2024',
      description: 'Hotels for our summer trip',
      tags: ['summer', 'vacation'],
      visibility: 'public'
    });
    console.log('✅ Created:', collection.id);
    
    // 2. Add hotels
    const withPlaces = await collectionService.addPlacesToCollection(
      collection.id,
      ['hotel_001', 'hotel_002', 'hotel_003']
    );
    console.log('✅ Added places:', withPlaces.places.length);
    
    // 3. Add collaborators
    const withCollabs = await collectionService.addCollaboratorsToCollection(
      collection.id,
      ['friend_uid_1', 'friend_uid_2']
    );
    console.log('✅ Added collaborators:', withCollabs.collaborators.length);
    
    // 4. Update details
    const updated = await collectionService.updateCollection(collection.id, {
      description: 'Updated: Best hotels for summer 2024'
    });
    console.log('✅ Updated description');
    
    // 5. Get final state
    const final = await collectionService.getCollection(collection.id);
    console.log('✅ Final collection:', {
      name: final.name,
      places: final.places.length,
      collaborators: final.collaborators.length,
      tags: final.tags
    });
    
    // 6. Delete (optional)
    // await collectionService.deleteCollection(collection.id);
    // console.log('✅ Deleted');
    
  } catch (error) {
    console.error('❌ Workflow failed:', error.message);
  }
}

// ============================================================================
// ERROR HANDLING PATTERNS
// ============================================================================

async function exampleErrorHandling(collectionId) {
  try {
    const collection = await collectionService.getCollection(collectionId);
    return collection;
  } catch (error) {
    // Handle different error types
    switch (error.code) {
      case 'VALIDATION_ERROR':
        // Show validation error to user
        alert(error.message);
        break;
        
      case 'AUTH_ERROR':
        // Redirect to login
        window.location.href = '/login';
        break;
        
      case 'NETWORK_ERROR':
      case 'TIMEOUT_ERROR':
        // Show retry option
        if (confirm('Network error. Retry?')) {
          return exampleErrorHandling(collectionId); // Retry
        }
        break;
        
      case 'SERVER_ERROR':
        if (error.statusCode === 403) {
          alert('You do not have permission to perform this action');
        } else if (error.statusCode === 404) {
          alert('Collection not found');
        } else {
          alert(error.message);
        }
        break;
        
      default:
        alert('An unexpected error occurred');
        console.error(error);
    }
  }
}

// ============================================================================
// REACT COMPONENT EXAMPLE
// ============================================================================

/*
import React, { useState, useEffect } from 'react';
import { collectionService } from '@/services/backend/collection.service';

function MyCollectionComponent({ collectionId }) {
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCollection();
  }, [collectionId]);

  async function loadCollection() {
    try {
      setLoading(true);
      const data = await collectionService.getCollection(collectionId);
      setCollection(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPlace(placeId) {
    try {
      const updated = await collectionService.addPlacesToCollection(
        collectionId,
        [placeId]
      );
      setCollection(updated);
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!collection) return null;

  return (
    <div>
      <h1>{collection.name}</h1>
      <p>{collection.description}</p>
      <p>Places: {collection.places.length}</p>
      <p>Tags: {collection.tags.join(', ')}</p>
    </div>
  );
}
*/

export {
  exampleCreateCollection,
  exampleGetCollection,
  exampleUpdateCollection,
  exampleAddPlaces,
  exampleRemovePlaces,
  exampleAddCollaborators,
  exampleManageTags,
  exampleDeleteCollection,
  exampleCompleteWorkflow,
  exampleErrorHandling
};
