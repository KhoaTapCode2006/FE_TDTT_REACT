/**
 * Frontend Schema Type Definitions
 * 
 * This file contains JSDoc type definitions for all schemas used in the application.
 * These types match the backend Pydantic schemas but use camelCase naming conventions.
 * 
 * Backend schemas are defined in T04_TDTT-main/T04_TDTT-main/schemas/
 * 
 * @module schemas
 */

// ============================================================================
// USER PREFERENCE TYPES
// ============================================================================

/**
 * Weather tolerance level
 * @typedef {'thap' | 'trung_binh' | 'cao'} WeatherTolerance
 */

/**
 * User event types for behavior tracking
 * @typedef {'xem' | 'nhan' | 'luu' | 'xoa' | 'dat_phong' | 'danh_gia'} UserEventType
 */

/**
 * User travel preferences (from survey form)
 * @typedef {Object} UserTravelPreference
 * @property {WeatherTolerance} weatherTolerance - Weather tolerance level
 * @property {string[]} preferredAmenities - List of preferred amenities
 * @property {string[]} mustHaveAmenities - List of required amenities
 * @property {string[]} excludedAmenities - List of amenities to exclude
 * @property {string[]} preferredLocationTags - List of preferred location tags
 * @property {string[]} dislikedLocationTags - List of disliked location tags
 * @property {string|null} notes - Additional notes
 */

/**
 * User behavior event for tracking interactions
 * @typedef {Object} UserBehaviorEvent
 * @property {UserEventType} eventType - Type of event
 * @property {string|null} hotelId - Hotel ID if applicable
 * @property {string|null} hotelName - Hotel name if applicable
 * @property {string|null} collectionId - Collection ID if applicable
 * @property {Date} createdAt - Event timestamp
 * @property {number|null} value - Event value if applicable
 * @property {Object.<string, string>} metadata - Additional metadata
 */

/**
 * Scoring weights for personalization
 * @typedef {Object} ScoringWeights
 * @property {number} realRating - Weight for real rating (default: 0.32)
 * @property {number} profileMatch - Weight for profile match (default: 0.16)
 * @property {number} tripMatch - Weight for trip match (default: 0.18)
 * @property {number} collectionAffinity - Weight for collection affinity (default: 0.14)
 * @property {number} historyAffinity - Weight for history affinity (default: 0.10)
 * @property {number} weatherFit - Weight for weather fit (default: 0.10)
 */

// ============================================================================
// COLLECTION TYPES
// ============================================================================

/**
 * Collection visibility levels
 * @typedef {'public' | 'unlisted' | 'private'} CollectionVisibility
 */

/**
 * Collection collaborator information
 * @typedef {Object} CollectionCollaborator
 * @property {string} uid - User ID of collaborator
 * @property {number} contributedCount - Number of places added by this collaborator
 * @property {Date} joinedAt - When the collaborator was added
 */

/**
 * Place in a collection
 * @typedef {Object} CollectionPlace
 * @property {string} placeId - Place/hotel ID
 * @property {Date} addedAt - When the place was added
 * @property {string} addedBy - UID of user who added this place
 */

/**
 * User who saved a collection
 * @typedef {Object} CollectionSaver
 * @property {string} uid - User ID
 * @property {Date} savedAt - When the collection was saved
 */

/**
 * Public collection information
 * @typedef {Object} Collection
 * @property {string} id - Collection ID
 * @property {string} ownerUid - Owner's user ID
 * @property {string} name - Collection name (3-32 characters)
 * @property {string|null} description - Collection description (max 512 characters)
 * @property {string|null} thumbnailUrl - Thumbnail image URL
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 * @property {number} savedCount - Number of times saved
 * @property {CollectionSaver[]} savers - List of users who saved this collection
 * @property {CollectionCollaborator[]} collaborators - List of collaborators
 * @property {CollectionPlace[]} places - List of places in collection
 * @property {string[]} tags - User-defined tags
 * @property {CollectionVisibility} visibility - Visibility level
 */

// ============================================================================
// HOTEL DISCOVERY TYPES
// ============================================================================

/**
 * GPS coordinates with geohash
 * @typedef {Object} GPSCoordinates
 * @property {number} latitude - Latitude coordinate
 * @property {number} longitude - Longitude coordinate
 * @property {string|null} geohash - Geohash string for location
 */

/**
 * Hotel image with thumbnail and original
 * @typedef {Object} HotelImage
 * @property {string|null} thumbnail - Thumbnail image URL
 * @property {string|null} originalImage - Original full-size image URL
 */

/**
 * User review for a hotel
 * @typedef {Object} UserReview
 * @property {string} text - Review text
 * @property {number} rawStars - Star rating (0-5)
 */

/**
 * Analyzed review with sentiment analysis
 * @typedef {Object} AnalyzedReview
 * @property {string} text - Review text
 * @property {number} rawStars - Original star rating
 * @property {number} sentimentScore - Sentiment score from PhoBERT
 * @property {number} trustWeight - Trust weight (0.0-1.0)
 * @property {number} adjustedStars - Adjusted star rating
 */

/**
 * AI sentiment analysis result
 * @typedef {Object} AISentimentResult
 * @property {number|null} aiScore - AI-calculated sentiment score
 * @property {Date|null} aiScoreExpirationDate - When the AI score expires
 * @property {number} trustWeight - Overall trust weight
 * @property {AnalyzedReview[]} analyzedReviews - List of analyzed reviews
 */

/**
 * AI-generated review summary
 * @typedef {Object} AIReviewSummary
 * @property {Date|null} aiSummaryExpirationDate - When the summary expires
 * @property {string|null} overview - Summary overview
 * @property {string[]|null} pros - List of positive points
 * @property {string[]|null} cons - List of negative points
 * @property {string|null} notes - Additional notes
 */

/**
 * Booking source information
 * @typedef {Object} BookingSource
 * @property {string} source - Source name (e.g., "Agoda", "Booking.com")
 * @property {string|null} logo - Logo URL
 * @property {string|null} link - Booking link
 * @property {number|null} price - Price at this source
 */

/**
 * Transportation method to nearby place
 * @typedef {Object} Transportation
 * @property {string|null} type - Transportation type (e.g., "walking", "driving")
 * @property {string|null} distance - Distance string (e.g., "1.5 km")
 * @property {string|null} duration - Duration string (e.g., "15 min")
 */

/**
 * Nearby place information
 * @typedef {Object} NearbyPlace
 * @property {string|null} category - Place category
 * @property {string} name - Place name
 * @property {string|null} thumbnail - Thumbnail image URL
 * @property {string|null} description - Place description
 * @property {GPSCoordinates|null} gpsCoordinates - GPS coordinates
 * @property {Transportation[]} transportations - Available transportation methods
 */

/**
 * Hotel information from discover endpoint
 * @typedef {Object} DiscoverHotel
 * @property {string|null} propertyToken - Google property token
 * @property {string} name - Hotel name
 * @property {string|null} description - Hotel description
 * @property {string|null} link - Hotel website link
 * @property {string|null} address - Hotel address
 * @property {string|null} phone - Hotel phone number
 * @property {GPSCoordinates|null} gpsCoordinates - GPS coordinates
 * @property {NearbyPlace[]} nearbyPlaces - List of nearby places
 * @property {string|null} checkInTime - Check-in time
 * @property {string|null} checkOutTime - Check-out time
 * @property {number} price - Price per night
 * @property {string|null} deal - Special deal information
 * @property {BookingSource[]} bookingSources - Booking sources with prices
 * @property {HotelImage[]} images - Hotel images
 * @property {string[]} amenities - List of amenities
 * @property {number} rawRating - Average rating from user reviews
 * @property {UserReview[]} userReviews - List of user reviews
 * @property {AISentimentResult|null} aiSentiment - AI sentiment analysis
 * @property {AIReviewSummary|null} aiSummary - AI-generated summary
 * @property {Date|null} lastUpdated - Last update timestamp
 */

// ============================================================================
// USER PROFILE TYPES
// ============================================================================

/**
 * Public user profile information
 * @typedef {Object} UserPublic
 * @property {string} username - Username (unique)
 * @property {string} displayName - Display name
 * @property {string|null} avatarUrl - Avatar image URL
 * @property {string|null} bio - User bio (max 500 characters)
 * @property {Date} createdAt - Account creation timestamp
 * @property {Date|null} lastLogin - Last login timestamp
 * @property {Collection[]} publicCollections - List of public collections
 */

/**
 * Private user profile information (extends UserPublic)
 * @typedef {Object} UserProfile
 * @property {string} username - Username (unique)
 * @property {string} displayName - Display name
 * @property {string|null} avatarUrl - Avatar image URL
 * @property {string|null} bio - User bio (max 500 characters)
 * @property {Date} createdAt - Account creation timestamp
 * @property {Date|null} lastLogin - Last login timestamp
 * @property {Collection[]} publicCollections - List of public collections
 * @property {string|null} email - Email address
 * @property {string|null} likedCollection - ID of liked collection
 * @property {string|null} phoneNumber - Phone number (max 10 digits)
 * @property {Date|null} lastUpdated - Last profile update timestamp
 * @property {UserTravelPreference|null} travelProfile - Travel preferences
 * @property {Collection[]} collections - All collections (including private)
 * @property {UserBehaviorEvent[]} userBehaviorHistory - Behavior history
 * @property {ScoringWeights|null} scoringWeights - Personalization weights
 */

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

/**
 * Authentication request
 * @typedef {Object} AuthRequest
 * @property {string} token - Firebase ID token
 */

/**
 * Authentication response
 * @typedef {Object} AuthResponse
 * @property {string} uid - User ID
 * @property {string} username - Username
 * @property {string} displayName - Display name
 * @property {string|null} email - Email address
 */

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * User profile update request
 * @typedef {Object} UserUpdateRequest
 * @property {string|null} username - New username (3-16 characters)
 * @property {string|null} displayName - New display name (3-32 characters)
 * @property {string|null} email - New email address
 * @property {string|null} phoneNumber - New phone number (max 10 digits)
 * @property {string|null} avatarUrl - New avatar URL
 * @property {string|null} currentTrip - Current trip ID
 * @property {string|null} bio - New bio (max 500 characters)
 */

/**
 * Collection creation request
 * @typedef {Object} CollectionCreateRequest
 * @property {string} name - Collection name (3-32 characters)
 * @property {string|null} description - Collection description (max 512 characters)
 * @property {string[]} tags - Initial tags
 * @property {CollectionVisibility} visibility - Visibility level
 * @property {string|null} thumbnailUrl - Thumbnail URL
 */

/**
 * Collection update request
 * @typedef {Object} CollectionUpdateRequest
 * @property {string|null} name - New name (3-32 characters)
 * @property {string|null} description - New description (max 512 characters)
 * @property {CollectionVisibility|null} visibility - New visibility level
 * @property {string|null} thumbnailUrl - New thumbnail URL
 */

/**
 * Add multiple places request
 * @typedef {Object} AddMultiplePlacesRequest
 * @property {string[]} placeIds - List of place IDs to add (1-50)
 */

/**
 * Remove multiple places request
 * @typedef {Object} RemoveMultiplePlacesRequest
 * @property {string[]} placeIds - List of place IDs to remove (1-50)
 */

/**
 * Add multiple collaborators request
 * @typedef {Object} AddMultipleCollaboratorsRequest
 * @property {string[]} collaboratorUids - List of user IDs to add (1-50)
 */

/**
 * Remove multiple collaborators request
 * @typedef {Object} RemoveMultipleCollaboratorsRequest
 * @property {string[]} collaboratorUids - List of user IDs to remove (1-50)
 */

/**
 * Add multiple tags request
 * @typedef {Object} AddMultipleTagsRequest
 * @property {string[]} tags - List of tags to add (1-50)
 */

/**
 * Remove multiple tags request
 * @typedef {Object} RemoveMultipleTagsRequest
 * @property {string[]} tags - List of tags to remove (1-50)
 */

/**
 * User response wrapper
 * @typedef {Object} UserResponse
 * @property {UserPublic|UserProfile} user - User data
 */

/**
 * Collection response wrapper
 * @typedef {Object} CollectionResponse
 * @property {Collection} collection - Collection data
 */

/**
 * Discover response
 * @typedef {Object} DiscoverResponse
 * @property {DiscoverHotel[]} data - List of discovered hotels
 */

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * This file only contains type definitions and does not export any runtime values.
 * Import types using JSDoc comments in your code:
 * 
 * @example
 * // In your JavaScript file:
 * 
 * /**
 *  * Get user profile
 *  * @param {string} userId - User ID
 *  * @returns {Promise<UserProfile>} User profile data
 *  *‎/
 * async function getUserProfile(userId) {
 *   // implementation
 * }
 * 
 * /**
 *  * Transform hotel data
 *  * @param {DiscoverHotel} hotel - Backend hotel data
 *  * @returns {DiscoverHotel} Frontend hotel data
 *  *‎/
 * function transformHotel(hotel) {
 *   // implementation
 * }
 */

export {};
