# Implementation Plan: Supercluster Custom Markers

## Overview

This implementation plan refactors the VietMapPanel clustering system from GeoJSON-based circle layers to custom React markers using the supercluster library. The refactoring enables displaying hotel thumbnail images in cluster markers and provides better cluster exploration through sidebar integration.

## Tasks

- [x] 1. Install supercluster dependency and create utility functions
  - Install supercluster package (^8.0.0 or higher) via npm
  - Create utility functions in src/services/external/vietmap.service.js for coordinate validation, data transformation, and thumbnail URL resolution
  - _Requirements: 1.1, 1.2_

- [x] 2. Add cluster state management to AppContext
  - [x] 2.1 Add clusterHotels state and setClusterHotels function to AppContext
    - Add clusterHotels state variable (default: empty array)
    - Add setClusterHotels function to context value
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 3. Create supercluster utility functions
  - [x] 3.1 Implement validateHotelCoordinates function
    - Filter hotels with null, NaN, or non-number coordinates
    - Return array of valid hotels
    - _Requirements: 9.5_
  
  - [x] 3.2 Implement convertHotelsToSuperclusterPoints function
    - Convert hotel objects to GeoJSON Feature format
    - Set coordinates as [lng, lat] array
    - Store hotel data in properties.hotel
    - _Requirements: 2.3_
  
  - [x] 3.3 Implement getHotelThumbnailUrl function
    - Return hotel.thumbnail if available
    - Fallback to hotel.images[0] if no thumbnail
    - Fallback to placeholder image if no images
    - _Requirements: 9.2_
  
  - [x] 3.4 Implement getClusterBadgeText function
    - Return "+N" for N additional hotels (e.g., "+2" for 3 hotels)
    - Return empty string for single hotel
    - _Requirements: 3.3_
  
  - [ ]* 3.5 Write unit tests for utility functions
    - Test coordinate validation edge cases
    - Test data transformation with various inputs
    - Test thumbnail URL resolution fallbacks
    - Test cluster badge text calculation
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 4. Initialize supercluster in VietMapPanel
  - [x] 4.1 Create supercluster instance ref and configuration
    - Create superclusterRef using useRef
    - Configure with radius: 50, maxZoom: 14, minPoints: 2
    - _Requirements: 2.3, 2.5_
  
  - [x] 4.2 Load hotel data into supercluster on mount and updates
    - Validate hotels using validateHotelCoordinates
    - Convert to GeoJSON points using convertHotelsToSuperclusterPoints
    - Call supercluster.load() with points array
    - Update when hotels array changes
    - _Requirements: 2.3, 9.4_

- [x] 5. Remove GeoJSON clustering layers and source
  - [x] 5.1 Remove GeoJSON source and layers from map initialization
    - Remove "hotels" GeoJSON source with cluster: true
    - Remove "clusters" circle layer
    - Remove "cluster-count" symbol layer
    - Remove cluster click and hover event handlers
    - _Requirements: 2.1, 2.2_

- [x] 6. Create cluster marker element function
  - [x] 6.1 Implement createClusterMarkerElement function
    - Create div element with 60px width/height
    - Apply Tailwind classes: rounded-full, border-white, shadow
    - Set hotel thumbnail as background image
    - Create badge element with "+N" text
    - Style badge with #ff5a3c background, white text, positioned top-right
    - Add hover effect (scale 1.05, brightness 1.1)
    - Set cursor: pointer
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [x] 7. Implement cluster calculation and marker rendering
  - [x] 7.1 Add cluster markers ref for lifecycle management
    - Create clusterMarkersRef using useRef (array)
    - Store all cluster marker instances
    - _Requirements: 7.1_
  
  - [x] 7.2 Implement clearClusterMarkers function
    - Call .remove() on all cluster markers
    - Clear clusterMarkersRef array
    - _Requirements: 7.2, 7.3_
  
  - [x] 7.3 Implement renderClusters function
    - Get current map bounds and zoom level
    - Call supercluster.getClusters(bounds, zoom)
    - Clear existing cluster markers
    - For each cluster, determine if it's a cluster or single hotel
    - Create cluster marker for multi-hotel clusters
    - Create hotel marker for single hotels
    - Store marker references in clusterMarkersRef
    - _Requirements: 2.4, 3.7, 6.1, 6.2, 6.3_
  
  - [x] 7.4 Add moveend event listener to update clusters
    - Attach renderClusters to map's moveend event
    - Remove listener on component unmount
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8. Implement cluster click event handlers
  - [x] 8.1 Add click handler to cluster markers
    - Extract cluster ID from marker data
    - Call supercluster.getLeaves(clusterId, Infinity) to get all hotels
    - Guard against empty cluster arrays
    - Set first hotel as activeHotel in AppContext
    - Call setClusterHotels with complete hotel list
    - Open HotelPopup for first hotel
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 9.3, 10.4_
  
  - [x] 8.2 Update single hotel marker click handler
    - Call setClusterHotels with empty array when single hotel clicked
    - Maintain existing activeHotel and popup behavior
    - _Requirements: 10.5_

- [x] 9. Update HotelSidebar for cluster hotel display
  - [x] 9.1 Access clusterHotels from AppContext
    - Import and use clusterHotels state from useApp hook
    - _Requirements: 5.1_
  
  - [x] 9.2 Render cluster hotels list in sidebar
    - Display list of hotel names when clusterHotels is not empty
    - Render each hotel name as clickable button/link
    - Visually distinguish currently active hotel
    - _Requirements: 5.1, 5.2, 5.5_
  
  - [x] 9.3 Implement hotel selection from cluster list
    - Add click handler to each hotel name
    - Call setActiveHotel with selected hotel
    - Open HotelPopup for selected hotel
    - _Requirements: 5.3, 5.4_
  
  - [ ]* 9.4 Write integration tests for sidebar cluster interaction
    - Test cluster hotels list display
    - Test active hotel update on click
    - Test popup opening for selected hotel
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 10. Add performance optimizations
  - [x] 10.1 Implement debouncing for cluster updates
    - Create debounced version of renderClusters (150ms delay)
    - Use useMemo to memoize debounced function
    - Apply to moveend event handler
    - _Requirements: 11.2_
  
  - [x] 10.2 Optimize marker DOM updates
    - Track existing marker IDs
    - Only remove markers that no longer exist
    - Only add new markers that don't exist
    - Reuse existing markers when possible
    - _Requirements: 11.5_
  
  - [x] 10.3 Memoize expensive calculations
    - Use useMemo for validHotels calculation
    - Use useMemo for superclusterPoints transformation
    - _Requirements: 11.3_
  
  - [ ]* 10.4 Write performance tests
    - Test rendering 100+ hotels within 500ms
    - Test debouncing during rapid map movement
    - Validate supercluster instance reuse
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 11. Handle edge cases and error scenarios
  - [x] 11.1 Add guards for empty hotels array
    - Skip supercluster initialization if hotels is empty
    - Clear all markers when hotels becomes empty
    - _Requirements: 9.4_
  
  - [x] 11.2 Add guards for invalid hotel data
    - Filter hotels with invalid coordinates before clustering
    - Use placeholder image for hotels without images
    - Handle hotels with null lat/lng gracefully
    - _Requirements: 9.1, 9.2, 9.5_
  
  - [x] 11.3 Add error handling for supercluster operations
    - Wrap getClusters in try-catch block
    - Wrap getLeaves in try-catch block
    - Log errors and fallback to safe state
    - _Requirements: 9.3_
  
  - [x] 11.4 Add guards for map readiness
    - Check mapReady state before cluster operations
    - Check mapObjRef.current exists before accessing map
    - Check window.vietmapgl is available
    - _Requirements: 2.4, 6.1_
  
  - [ ]* 11.5 Write edge case tests
    - Test zero hotels scenario
    - Test single hotel scenario
    - Test all hotels at same location
    - Test hotels with missing images
    - Test hotels with invalid coordinates
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 12. Verify existing map features are preserved
  - [x] 12.1 Test search radius circle visualization
    - Verify circle updates with radius changes
    - Verify circle centers on user location
    - _Requirements: 8.1_
  
  - [x] 12.2 Test user location marker with animation
    - Verify animated marker displays correctly
    - Verify marker updates with location changes
    - _Requirements: 8.2_
  
  - [x] 12.3 Test zoom controls and recenter button
    - Verify +/- zoom buttons work
    - Verify recenter button returns to user location
    - _Requirements: 8.3_
  
  - [x] 12.4 Test radius adjustment slider and drag handle
    - Verify slider updates radius
    - Verify drag handle updates radius
    - Verify radius display shows correct value
    - _Requirements: 8.4, 8.5_
  
  - [x] 12.5 Test hotel filtering by search radius
    - Verify hotels outside radius have different styling
    - Verify radius changes update marker styling
    - _Requirements: 8.6_
  
  - [x] 12.6 Test map centering on activeHotel selection
    - Verify map centers and zooms to selected hotel
    - Verify popup opens for selected hotel
    - _Requirements: 8.7_

- [x] 13. Cleanup and component unmount handling
  - [x] 13.1 Add cleanup for cluster markers on unmount
    - Remove all cluster markers in useEffect cleanup
    - Clear clusterMarkersRef array
    - _Requirements: 7.4_
  
  - [x] 13.2 Verify no memory leaks from marker references
    - Test component mount/unmount cycles
    - Verify markers are properly removed from DOM
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 14. Final checkpoint - Ensure all tests pass
  - Run all unit tests and integration tests
  - Verify all existing map features work correctly
  - Test with various hotel datasets (0, 1, 10, 100+ hotels)
  - Test cluster interactions and sidebar navigation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The design uses JavaScript/React, so all code will be in JavaScript
- Supercluster configuration matches existing GeoJSON clustering behavior
- All existing map features must continue working after refactoring
- Performance optimizations ensure smooth experience with 100+ hotels
- Comprehensive error handling prevents crashes from invalid data
