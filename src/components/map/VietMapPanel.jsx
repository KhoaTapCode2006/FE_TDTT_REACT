import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Supercluster from "supercluster";
import { useApp } from "@/app/AppContext";
import {
  getVietMapStyleUrl,
  buildCircleGeoJSON,
  getDistanceMeters,
  getRadiusHandleCoordinates,
  createHotelMarkerElement,
  createClusterMarkerElement,
  clampRadius,
  getCircleBounds,
  validateHotelCoordinates,
  convertHotelsToSuperclusterPoints,
} from "@/services/external/vietmap.service";
import Icon from "@/components/ui/Icon";
import "./VietMapPanel.css";

function VietMapPanel() {
  const { userLoc, hotels, activeHotel, setActiveHotel, radiusM, setRadiusM, setClusterHotels, hoveredHotelId, searchGps } = useApp();
  
  const mapRef = useRef(null);
  const mapObjRef = useRef(null);
  const clusterMarkersRef = useRef([]);
  const superclusterRef = useRef(null);
  const userLocationMarkerRef = useRef(null);
  const radiusHandleRef = useRef(null);
  const searchLocationMarkerRef = useRef(null); // Marker for search location
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Validate userLoc to prevent crashes
  const validUserLoc = useMemo(() => {
    if (!userLoc || typeof userLoc.lat !== 'number' || typeof userLoc.lng !== 'number') {
      console.warn('Invalid userLoc, using default coordinates:', userLoc);
      return { lat: 10.7719, lng: 106.6983 }; // Default to Ben Thanh Market, HCMC
    }
    return userLoc;
  }, [userLoc]);

  // Memoize valid hotels and supercluster points
  const validHotels = useMemo(() => {
    const validated = validateHotelCoordinates(hotels);
    return validated;
  }, [hotels]);
  
  const superclusterPoints = useMemo(() => {
    const points = convertHotelsToSuperclusterPoints(validHotels);
    return points;
  }, [validHotels]);

  // Initialize and update supercluster
  useEffect(() => {
    if (!superclusterRef.current) {
      superclusterRef.current = new Supercluster({
        radius: 50,
        maxZoom: 14,
        minPoints: 2,
      });
    }

    if (superclusterPoints.length > 0) {
      try {
        superclusterRef.current.load(superclusterPoints);
      } catch (error) {
      }
    } else {
      console.warn('⚠️ No points to load into Supercluster');
    }
  }, [superclusterPoints]);

  // Helper functions for cluster markers
  function clearClusterMarkers() {
    clusterMarkersRef.current.forEach(marker => marker.remove());
    clusterMarkersRef.current = [];
  }

  // Show hotel popup function
  const showHotelPopup = useCallback((hotel, coordinates) => {
    // Set active hotel to trigger popup
    setActiveHotel(hotel);
  }, [setActiveHotel]);

  // Render clusters function
  const renderClusters = useCallback(() => {
    if (!mapReady || !mapObjRef.current || !superclusterRef.current || !window.vietmapgl) {
      return;
    }
    
    const map = mapObjRef.current;
    
    try {
      // Check if map.getBounds() is available
      const mapBounds = map.getBounds();
      if (!mapBounds) {
        console.warn('Map bounds not available yet');
        return;
      }
      
      // VietMap GL bounds format: [west, south, east, north]
      const bounds = [
        mapBounds.getWest(),
        mapBounds.getSouth(),
        mapBounds.getEast(),
        mapBounds.getNorth()
      ];
      
      // Validate bounds
      if (!bounds.every(b => typeof b === 'number' && isFinite(b))) {
        console.error('Invalid bounds:', bounds);
        return;
      }
      
      const zoom = Math.floor(map.getZoom());
      
      // Validate zoom
      if (typeof zoom !== 'number' || !isFinite(zoom)) {
        console.error('Invalid zoom:', zoom);
        return;
      }
      
      // Check if supercluster has data
      const points = superclusterRef.current.points;
      if (!points || points.length === 0) {
        console.warn('Supercluster has no points loaded');
        return;
      }
      
      const clusters = superclusterRef.current.getClusters(bounds, zoom);
      
      // Clear existing cluster markers
      clearClusterMarkers();
      
      // Render each cluster or single hotel
      clusters.forEach((cluster, index) => {
        const [lng, lat] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount } = cluster.properties;
        
        
        if (isCluster) {
          // Get hotels in this cluster
          const clusterId = cluster.properties.cluster_id;
          const clusterHotels = superclusterRef.current.getLeaves(clusterId, Infinity);
          
          if (clusterHotels.length === 0) return;
          
          const firstHotel = clusterHotels[0].properties.hotel;
          const clusterHotelIds = clusterHotels.map(c => c.properties.hotel.id);
          
          // Create cluster marker element
          const element = createClusterMarkerElement(
            cluster,
            firstHotel,
            pointCount,
            () => {
              // Handle cluster click - open split view overlay
              const hotels = clusterHotels.map(c => c.properties.hotel);
              setClusterHotels(hotels);
              setActiveHotel(hotels[0]); // Set first hotel as active
            },
            clusterHotelIds,
            null
          );
          
          const marker = new window.vietmapgl.Marker({ element, anchor: 'center' })
            .setLngLat([lng, lat])
            .addTo(map);
          
          clusterMarkersRef.current.push(marker);
        } else {
          // Single hotel - render as regular hotel marker
          const hotel = cluster.properties.hotel;
          const insideCircle = getDistanceMeters(validUserLoc, { lat, lng }) <= radiusM;
          
          // Create hotel marker element
          const element = createHotelMarkerElement(hotel, insideCircle, (selectedHotel) => {
            setClusterHotels([]); // Clear cluster view
            setActiveHotel(selectedHotel); // This will trigger the standalone popup
            showHotelPopup(selectedHotel, [lng, lat]);
          }, false);
          
          const marker = new window.vietmapgl.Marker({ element, anchor: 'center' })
            .setLngLat([lng, lat])
            .addTo(map);
          
          clusterMarkersRef.current.push(marker);
        }
      });
      
    } catch (error) {
      console.error('Error rendering clusters:', error);
      console.error('Error stack:', error.stack);
    }
  }, [mapReady, validUserLoc, radiusM, setActiveHotel, setClusterHotels, showHotelPopup]);

  // Hover effect: add/remove CSS class on marker inner elements
  useEffect(() => {
    if (!mapReady) return;

    // Reset all hotel markers
    document.querySelectorAll('.hotel-marker-item').forEach(inner => {
      inner.classList.remove('is-active-hover');
      const wrapper = inner.parentElement;
      if (wrapper) wrapper.style.zIndex = '';
    });

    // Reset all cluster markers
    document.querySelectorAll('.cluster-marker-inner').forEach(inner => {
      inner.classList.remove('is-active-hover');
      const wrapper = inner.parentElement;
      if (wrapper) wrapper.style.zIndex = '';
    });

    if (!hoveredHotelId) return;

    // Highlight matching single hotel marker
    document.querySelectorAll('.hotel-marker-item').forEach(inner => {
      if (inner.dataset.hotelId === String(hoveredHotelId)) {
        inner.classList.add('is-active-hover');
        const wrapper = inner.parentElement;
        if (wrapper) wrapper.style.zIndex = '99';
      }
    });

    // Highlight cluster marker if it contains the hovered hotel
    document.querySelectorAll('.cluster-marker-inner').forEach(inner => {
      try {
        const ids = JSON.parse(inner.dataset.clusterHotelIds || '[]');
        if (ids.includes(hoveredHotelId) || ids.includes(String(hoveredHotelId))) {
          inner.classList.add('is-active-hover');
          const wrapper = inner.parentElement;
          if (wrapper) wrapper.style.zIndex = '99';
        }
      } catch (_) {}
    });
  }, [hoveredHotelId, mapReady]);

  // Debounced version of renderClusters
  const debouncedRenderClusters = useMemo(() => {
    let timeoutId;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        renderClusters();
      }, 150);
    };
  }, [renderClusters]);

  const updateRadiusHandle = useCallback((center, radius) => {
    if (!mapObjRef.current || !window.vietmapgl) return;
    const map = mapObjRef.current;
    const coords = getRadiusHandleCoordinates(center, radius);

    function setHandleToRadius(nextRadius) {
      const nextCoords = getRadiusHandleCoordinates(center, nextRadius);
      if (radiusHandleRef.current) {
        radiusHandleRef.current.setLngLat(nextCoords);
      }
    }

    function setRadiusFromPointer(clientX, clientY) {
      const rect = map.getContainer().getBoundingClientRect();
      const point = map.unproject([clientX - rect.left, clientY - rect.top]);
      const distance = getDistanceMeters(center, { lat: point.lat, lng: point.lng });
      const nextRadius = clampRadius(distance);
      setRadiusM(nextRadius);
      setHandleToRadius(nextRadius);
    }

    if (radiusHandleRef.current) {
      radiusHandleRef.current.setLngLat(coords);
      return;
    }

    // Create radius handle element
    const element = document.createElement("div");
    element.style.width = "28px";
    element.style.height = "28px";
    element.style.borderRadius = "50%";
    element.style.background = "#ff5a3c";
    element.style.border = "2px solid #fff";
    element.style.boxShadow = "0 0 0 8px rgba(255,90,60,0.18)";
    element.style.display = "flex";
    element.style.alignItems = "center";
    element.style.justifyContent = "center";
    element.style.fontSize = "14px";
    element.style.fontWeight = "700";
    element.style.color = "#fff";
    element.style.cursor = "grab";
    element.style.userSelect = "none";
    element.style.touchAction = "none";
    element.innerText = "⇔";

    const marker = new window.vietmapgl.Marker({ element, anchor: "center" })
      .setLngLat(coords)
      .addTo(map);

    // Add drag functionality
    const onPointerMove = (evt) => {
      if (!evt.isPrimary) return;
      setRadiusFromPointer(evt.clientX, evt.clientY);
    };

    const onPointerUp = () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      element.style.cursor = "grab";
    };

    element.addEventListener("pointerdown", (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      element.style.cursor = "grabbing";
      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp, { once: true });
    });

    radiusHandleRef.current = marker;
  }, [setRadiusM]);

  // Simplified map initialization
  useEffect(() => {
    if (!mapRef.current || mapObjRef.current) return;

    // Wait for VietMap SDK to be available
    const initMap = () => {
      if (!window.vietmapgl) {
        setTimeout(initMap, 500);
        return;
      }

      try {
        
        const map = new window.vietmapgl.Map({
          container: mapRef.current,
          style: getVietMapStyleUrl(),
          center: [validUserLoc.lng, validUserLoc.lat],
          zoom: 14,
          antialias: true,
          doubleClickZoom: false,
        });

        mapObjRef.current = map;

        // Set up map load handler with timeout
        const loadTimeout = setTimeout(() => {
          console.log('⏱️ Map load timeout, forcing ready state');
          setMapReady(true);
        }, 10000);

        map.on("load", () => {
          clearTimeout(loadTimeout);
          
          try {
            // Add search radius source (keep for potential future use)
            map.addSource("search-radius", {
              type: "geojson",
              data: buildCircleGeoJSON(validUserLoc, radiusM),
            });

            // Note: search-radius-fill and search-radius-line layers removed per requirements 5.7, 5.8

            // Add user location marker
            const locEl = document.createElement("div");
            locEl.className = "user-location-marker";
            userLocationMarkerRef.current = new window.vietmapgl.Marker({
              element: locEl,
              anchor: "center"
            })
              .setLngLat([validUserLoc.lng, validUserLoc.lat])
              .addTo(map);

            setMapReady(true);
          } catch (err) {
            console.error("Error setting up map layers:", err);
            setMapReady(true); // Still set ready to prevent infinite loading
          }
        });

        map.on("error", (e) => {
          console.error("VietMap error:", e);
          if (e.error?.message?.includes("abort")) return;
          setMapError(true);
        });

      } catch (err) {
        console.error("Map initialization error:", err);
        setMapError(true);
      }
    };

    initMap();
  }, [validUserLoc, radiusM]);

  // Render clusters when map is ready and hotels change
  useEffect(() => {
    if (!mapReady || !mapObjRef.current) return;
    renderClusters();
  }, [hotels, mapReady, renderClusters]);

  // Add moveend event listener for cluster updates
  useEffect(() => {
    if (!mapReady || !mapObjRef.current) return;
    
    const map = mapObjRef.current;
    map.on('moveend', debouncedRenderClusters);
    
    return () => {
      map.off('moveend', debouncedRenderClusters);
    };
  }, [mapReady, debouncedRenderClusters]);

  // Update radius and user location
  useEffect(() => {
    if (!mapReady || !mapObjRef.current) return;
    
    try {
      const map = mapObjRef.current;

      // Update search radius circle

      // Update user location marker
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.setLngLat([validUserLoc.lng, validUserLoc.lat]);
      }

    } catch (error) {
      console.error("Error updating map:", error);
    }
  }, [mapReady, radiusM, validUserLoc, updateRadiusHandle, renderClusters]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearClusterMarkers();
    };
  }, []);

  // Task 7.2: Map auto-navigation to search location (Requirement 6.1, 6.2, 6.3, 6.4, 6.5)
  useEffect(() => {
    if (!mapReady || !mapObjRef.current || !searchGps) return;
    
    const map = mapObjRef.current;
    
    // Validate GPS coordinates
    if (!searchGps.latitude || !searchGps.longitude) {
      console.warn('Invalid search GPS coordinates:', searchGps);
      return;
    }
    
    try {
      
      // Navigate to search location with smooth animation
      map.easeTo({
        center: [searchGps.longitude, searchGps.latitude],
        zoom: 14,
        duration: 1000
      });
      
      // Remove existing search location marker if any
      if (searchLocationMarkerRef.current) {
        searchLocationMarkerRef.current.remove();
      }
      
      // Create search location marker element
      const markerEl = document.createElement('div');
      markerEl.style.width = '32px';
      markerEl.style.height = '32px';
      markerEl.style.backgroundImage = 'url(/src/constants/iconmap.png)';
      markerEl.style.backgroundSize = 'contain';
      markerEl.style.backgroundRepeat = 'no-repeat';
      markerEl.style.backgroundPosition = 'center';
      
      // Add search location marker
      searchLocationMarkerRef.current = new window.vietmapgl.Marker({
        element: markerEl,
        anchor: 'center'
      })
        .setLngLat([searchGps.longitude, searchGps.latitude])
        .addTo(map);
      
    } catch (error) {
      console.error('Error navigating to search location:', error);
    }
  }, [mapReady, searchGps]);

  // Helper functions for map controls
  function zoom(delta) {
    if (!mapObjRef.current) return;
    mapObjRef.current.easeTo({ zoom: (mapObjRef.current.getZoom() || 14) + delta });
  }

  function recenter() {
    if (!mapObjRef.current) return;
    const c = [validUserLoc.lng, validUserLoc.lat];
    mapObjRef.current.easeTo({ center: c, zoom: 14 });
  }

  return (
    <div className="flex-1 relative overflow-hidden h-full max-h-[640px] bg-gray-50">
      <div className="vietmap-container">
        <div ref={mapRef} className="absolute inset-0 w-full h-full" />
        
        {/* Error State */}
        {mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-50">
             <Icon name="cloud_off" size={48} className="text-gray-400 mb-2" />
             <p className="text-sm font-bold text-gray-500">VietMap API Error</p>
             <p className="text-xs text-gray-400 mt-1">Please check your API key</p>
          </div>
        )}

        {/* Loading State */}
        {!mapReady && !mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-gray-600 mb-2">Loading Map...</p>
            <p className="text-xs text-gray-500">Please wait</p>
          </div>
        )}

        {/* Map Controls - positioned on the right side */}
          <div className="map-controls-vertical">
            <button 
              onClick={() => zoom(1)} 
              className="map-control-btn-mini"
              title="Phóng to"
            >
              <Icon name="add" size={18} />
            </button>
            
            <button 
              onClick={() => zoom(-1)} 
              className="map-control-btn-mini"
              title="Thu nhỏ"
            >
              <Icon name="remove" size={18} />
            </button>

            <button onClick={recenter} className="map-control-btn-mini">
            <Icon name="my_location" size={18} />
            </button>
          </div>
        </div>
      </div>
  );
}

export default VietMapPanel;