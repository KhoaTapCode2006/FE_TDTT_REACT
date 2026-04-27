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
  const { userLoc, hotels, activeHotel, setActiveHotel, radiusM, setRadiusM, setClusterHotels, hoveredHotelId } = useApp();
  const mapRef = useRef(null);
  const mapObjRef = useRef(null);
  const clusterMarkersRef = useRef([]);
  const superclusterRef = useRef(null);
  const userLocationMarkerRef = useRef(null);
  const radiusHandleRef = useRef(null);
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
  const validHotels = useMemo(() => validateHotelCoordinates(hotels), [hotels]);
  
  const superclusterPoints = useMemo(() => 
    convertHotelsToSuperclusterPoints(validHotels),
    [validHotels]
  );

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
        console.error('Error loading supercluster:', error);
      }
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
    console.log('Show hotel popup for:', hotel.name, 'at coordinates:', coordinates);
  }, [setActiveHotel]);

  // Render clusters function
  const renderClusters = useCallback(() => {
    if (!mapReady || !mapObjRef.current || !superclusterRef.current || !window.vietmapgl) return;
    
    const map = mapObjRef.current;
    
    try {
      const bounds = map.getBounds().toArray().flat();
      const zoom = Math.floor(map.getZoom());
      
      const clusters = superclusterRef.current.getClusters(bounds, zoom);
      
      // Clear existing cluster markers
      clearClusterMarkers();
      
      // Render each cluster or single hotel
      clusters.forEach(cluster => {
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
              console.log('Cluster clicked, opening split view with hotels:', hotels.length);
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
            console.log('Single hotel marker clicked:', selectedHotel.name);
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
        console.log('VietMap SDK not ready, retrying...');
        setTimeout(initMap, 500);
        return;
      }

      try {
        console.log('🗺️ Initializing VietMap...');
        
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
          console.log("✅ VietMap loaded successfully");
          
          try {
            // Add search radius source and layers
            map.addSource("search-radius", {
              type: "geojson",
              data: buildCircleGeoJSON(validUserLoc, radiusM),
            });

            map.addLayer({
              id: "search-radius-fill",
              type: "fill",
              source: "search-radius",
              paint: { "fill-color": "#00346f", "fill-opacity": 0.08 },
            });

            map.addLayer({
              id: "search-radius-line",
              type: "line",
              source: "search-radius",
              paint: {
                "line-color": "#00346f",
                "line-opacity": 0.7,
                "line-width": 2,
              },
            });

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
      const radiusSource = map.getSource("search-radius");
      if (radiusSource) {
        radiusSource.setData(buildCircleGeoJSON(validUserLoc, radiusM));
      }

      // Update user location marker
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.setLngLat([validUserLoc.lng, validUserLoc.lat]);
      }

      // Update radius handle
      updateRadiusHandle(validUserLoc, radiusM);

      // Update cluster markers for radius changes
      renderClusters();

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
    <div className="flex-1 relative overflow-hidden h-full min-h-[640px] bg-gray-50">
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

      {/* Map Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        <button onClick={() => zoom(1)} className="bg-white p-2.5 rounded-xl shadow-md text-primary hover:bg-gray-50 transition-colors">
          <Icon name="add" />
        </button>
        <button onClick={() => zoom(-1)} className="bg-white p-2.5 rounded-xl shadow-md text-primary hover:bg-gray-50 transition-colors">
          <Icon name="remove" />
        </button>
        <button onClick={recenter} className="bg-white p-2.5 rounded-xl shadow-md text-primary hover:bg-gray-50 transition-colors mt-3">
          <Icon name="my_location" />
        </button>
      </div>
    </div>
  );
}

export default VietMapPanel;