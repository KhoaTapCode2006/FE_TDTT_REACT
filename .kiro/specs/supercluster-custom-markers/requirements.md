# Requirements Document

## Introduction

This document specifies the requirements for refactoring the map clustering implementation in VietMapPanel.jsx from GeoJSON-based circle layers to custom React markers using the supercluster library. The refactoring aims to provide a richer visual experience by displaying hotel thumbnail images in cluster markers and enabling better cluster exploration through the sidebar.

## Glossary

- **VietMapPanel**: The React component that renders the interactive map using VietMap GL JS (MapLibre-based)
- **Cluster_Marker**: A custom div-based marker representing multiple hotels at the same geographic location
- **Hotel_Marker**: A marker representing a single hotel location on the map
- **Supercluster**: A fast geospatial point clustering library for browsers and Node
- **HotelPopup**: A React component that displays detailed information about a selected hotel
- **Sidebar**: The HotelSidebar component that displays hotel cards and navigation controls
- **AppContext**: React context providing shared state including hotels, activeHotel, userLoc, and radiusM
- **Search_Radius_Circle**: The visual circle on the map indicating the search area around the user location
- **GeoJSON_Layer**: MapLibre's native layer type for rendering geographic features (being replaced)

## Requirements

### Requirement 1: Install Supercluster Library

**User Story:** As a developer, I want to install the supercluster library, so that I can use it for custom cluster management.

#### Acceptance Criteria

1. THE System SHALL include supercluster as a project dependency in package.json
2. THE System SHALL use supercluster version ^8.0.0 or higher

### Requirement 2: Replace GeoJSON Clustering with Supercluster

**User Story:** As a developer, I want to replace the GeoJSON-based clustering with supercluster, so that I can render custom cluster markers.

#### Acceptance Criteria

1. THE VietMapPanel SHALL remove the "hotels" GeoJSON source from the map
2. THE VietMapPanel SHALL remove the "clusters" and "cluster-count" layers from the map
3. THE VietMapPanel SHALL initialize a supercluster instance with hotel data
4. WHEN the map moves or zooms, THE VietMapPanel SHALL call supercluster.getClusters() with current bounds and zoom level
5. THE VietMapPanel SHALL configure supercluster with radius: 50 and maxZoom: 14

### Requirement 3: Render Custom Cluster Markers

**User Story:** As a user, I want to see hotel thumbnail images in cluster markers, so that I can visually identify what hotels are in each cluster.

#### Acceptance Criteria

1. WHEN a cluster contains multiple hotels, THE VietMapPanel SHALL create a custom div-based Cluster_Marker
2. THE Cluster_Marker SHALL display the first hotel's first image as a thumbnail background
3. THE Cluster_Marker SHALL display a badge at the top-right corner showing the count of additional hotels (e.g., "+2" for 3 hotels)
4. THE Cluster_Marker SHALL use Tailwind CSS classes: rounded-full, border-white, and shadow
5. THE Cluster_Marker SHALL have dimensions of 60px width and 60px height
6. THE Cluster_Marker badge SHALL have a background color of #ff5a3c with white text
7. WHEN a cluster contains only one hotel, THE VietMapPanel SHALL render it as a regular Hotel_Marker

### Requirement 4: Handle Cluster Click Interaction

**User Story:** As a user, I want to click on a cluster marker to see the first hotel's details and explore all hotels in that cluster, so that I can discover nearby accommodation options.

#### Acceptance Criteria

1. WHEN a user clicks a Cluster_Marker, THE VietMapPanel SHALL open the HotelPopup for the first hotel in the cluster
2. WHEN a user clicks a Cluster_Marker, THE VietMapPanel SHALL pass the complete list of cluster hotels to the Sidebar
3. WHEN a user clicks a Cluster_Marker, THE VietMapPanel SHALL set the first hotel as activeHotel in AppContext
4. THE VietMapPanel SHALL extract cluster children using supercluster.getLeaves(clusterId, Infinity)

### Requirement 5: Display Cluster Hotels in Sidebar

**User Story:** As a user, I want to see a list of all hotels in a clicked cluster in the sidebar, so that I can browse and select different hotels from that location.

#### Acceptance Criteria

1. WHEN a cluster is selected, THE Sidebar SHALL display a list of all hotel names in that cluster
2. THE Sidebar SHALL render each hotel name as a clickable button or link
3. WHEN a user clicks a hotel name in the cluster list, THE Sidebar SHALL update activeHotel in AppContext
4. WHEN a user clicks a hotel name in the cluster list, THE Sidebar SHALL open the HotelPopup for that hotel
5. THE Sidebar SHALL visually distinguish the currently active hotel in the cluster list

### Requirement 6: Update Clusters on Map Movement

**User Story:** As a user, I want clusters to update when I pan or zoom the map, so that I see accurate clustering for the current view.

#### Acceptance Criteria

1. WHEN the map fires a 'moveend' event, THE VietMapPanel SHALL recalculate clusters using supercluster.getClusters()
2. THE VietMapPanel SHALL pass the current map bounds to supercluster.getClusters()
3. THE VietMapPanel SHALL pass the current zoom level to supercluster.getClusters()
4. THE VietMapPanel SHALL remove all existing cluster markers before rendering new ones
5. THE VietMapPanel SHALL render the updated cluster markers on the map

### Requirement 7: Manage Cluster Marker Lifecycle

**User Story:** As a developer, I want to properly manage cluster marker lifecycle, so that I prevent memory leaks and ensure clean updates.

#### Acceptance Criteria

1. THE VietMapPanel SHALL store cluster marker references in a useRef hook
2. WHEN clusters are recalculated, THE VietMapPanel SHALL call .remove() on all existing cluster markers
3. WHEN clusters are recalculated, THE VietMapPanel SHALL clear the cluster marker references array
4. WHEN the component unmounts, THE VietMapPanel SHALL remove all cluster markers from the map
5. THE VietMapPanel SHALL maintain separate refs for cluster markers and individual hotel markers

### Requirement 8: Preserve Existing Map Features

**User Story:** As a user, I want all existing map features to continue working, so that I don't lose functionality during the refactoring.

#### Acceptance Criteria

1. THE VietMapPanel SHALL maintain the Search_Radius_Circle visualization
2. THE VietMapPanel SHALL maintain the user location marker with animation
3. THE VietMapPanel SHALL maintain the zoom controls (+, -, recenter buttons)
4. THE VietMapPanel SHALL maintain the radius adjustment slider
5. THE VietMapPanel SHALL maintain the radius handle drag functionality
6. THE VietMapPanel SHALL continue to filter hotels based on the search radius
7. THE VietMapPanel SHALL continue to center the map on activeHotel when selected

### Requirement 9: Handle Edge Cases

**User Story:** As a user, I want the map to handle edge cases gracefully, so that I have a reliable experience.

#### Acceptance Criteria

1. WHEN a cluster contains no hotels, THE VietMapPanel SHALL not render a Cluster_Marker
2. WHEN a hotel has no images, THE Cluster_Marker SHALL display a placeholder image
3. WHEN supercluster.getLeaves() returns an empty array, THE VietMapPanel SHALL not open the HotelPopup
4. WHEN the hotels array is empty, THE VietMapPanel SHALL not initialize supercluster
5. WHEN a hotel has invalid coordinates (null lat or lng), THE VietMapPanel SHALL exclude it from clustering

### Requirement 10: Update AppContext for Cluster State

**User Story:** As a developer, I want to add cluster state to AppContext, so that the Sidebar can access the list of hotels in the selected cluster.

#### Acceptance Criteria

1. THE AppContext SHALL provide a clusterHotels state variable
2. THE AppContext SHALL provide a setClusterHotels function
3. THE clusterHotels state SHALL default to an empty array
4. WHEN a cluster is clicked, THE VietMapPanel SHALL call setClusterHotels with the cluster's hotel list
5. WHEN a single hotel marker is clicked, THE VietMapPanel SHALL call setClusterHotels with an empty array

### Requirement 11: Maintain Performance

**User Story:** As a user, I want the map to remain responsive, so that I can interact with it smoothly.

#### Acceptance Criteria

1. WHEN the map contains 100 or more hotels, THE VietMapPanel SHALL render clusters within 500ms of a moveend event
2. THE VietMapPanel SHALL debounce cluster updates to prevent excessive recalculation during rapid map movement
3. THE VietMapPanel SHALL reuse supercluster instance instead of recreating it on every update
4. WHEN hotels data changes, THE VietMapPanel SHALL call supercluster.load() to update the index
5. THE VietMapPanel SHALL limit cluster marker DOM updates to only changed clusters

### Requirement 12: Style Cluster Markers Consistently

**User Story:** As a user, I want cluster markers to match the application's design system, so that the interface feels cohesive.

#### Acceptance Criteria

1. THE Cluster_Marker SHALL use a circular shape (border-radius: 50%)
2. THE Cluster_Marker SHALL have a 3px white border
3. THE Cluster_Marker SHALL have a box-shadow matching the design system
4. THE Cluster_Marker badge SHALL use font-weight: 700 and font-size: 12px
5. THE Cluster_Marker SHALL have a hover effect that increases brightness by 10%
6. THE Cluster_Marker SHALL have a cursor: pointer style
