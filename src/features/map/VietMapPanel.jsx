import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Supercluster from "supercluster";
import { useApp } from "@/app/AppContext";
import {
  getVietMapStyleUrl,
  buildCircleGeoJSON,
  getDistanceMeters,
  getRadiusForCoverage,
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
  const hotelsRef = useRef(hotels);
  const initialUserLocationCenteredRef = useRef(false);
  const initialCircleRadiusSetRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [sdkReady, setSdkReady] = useState(!!window.vietmapgl);

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

  useEffect(() => {
    hotelsRef.current = hotels;
  }, [hotels]);

  // Helper functions for cluster markers
  function clearClusterMarkers() {
    clusterMarkersRef.current.forEach(marker => marker.remove());
    clusterMarkersRef.current = [];
  }

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
          
          // Create cluster marker element (hover handled by useEffect)
          const element = createClusterMarkerElement(
            cluster,
            firstHotel,
            pointCount,
            () => {
              // Handle cluster click - open split view overlay
              const hotels = clusterHotels.map(c => c.properties.hotel);
              setClusterHotels(hotels);
              setActiveHotel(firstHotel);
              // Don't show map popup for clusters - use split view instead
            },
            clusterHotelIds,
            null // Don't pass hoveredHotelId, handled by useEffect
          );
          
          const marker = new window.vietmapgl.Marker({ element, anchor: 'center' })
            .setLngLat([lng, lat])
            .addTo(map);
          
          clusterMarkersRef.current.push(marker);
        } else {
          // Single hotel - render as regular hotel marker
          const hotel = cluster.properties.hotel;
          const insideCircle = getDistanceMeters(validUserLoc, { lat, lng }) <= radiusM;
          
          // Create hotel marker element (hover handled by useEffect)
          const element = createHotelMarkerElement(hotel, insideCircle, (selectedHotel) => {
            setClusterHotels([]);
            setActiveHotel(selectedHotel);
            showHotelPopup(selectedHotel, [lng, lat]);
          }, false); // Don't pass isHovered, handled by useEffect
          
          const marker = new window.vietmapgl.Marker({ element, anchor: 'center' })
            .setLngLat([lng, lat])
            .addTo(map);
          
          clusterMarkersRef.current.push(marker);
        }
      });
    } catch (error) {
      console.error('Error rendering clusters:', error);
    }
  }, [mapReady, validUserLoc, radiusM, setActiveHotel, setClusterHotels]);

  // Hover effect: add/remove CSS class on marker inner elements (no re-render)
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
    });  }, [hoveredHotelId, mapReady]);

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

  // 0. CHỜ SDK LOAD
  useEffect(() => {
    if (sdkReady) return;

    const checkSDK = () => {
      if (window.vietmapgl) {
        console.log("✅ VietMap SDK is now available");
        setSdkReady(true);
        return true;
      }
      return false;
    };

    // Kiểm tra ngay
    if (checkSDK()) return;

    // Nếu chưa có, đợi window.load event
    const handleLoad = () => {
      if (checkSDK()) {
        console.log("✅ VietMap SDK loaded (via window.load)");
      }
    };

    window.addEventListener("load", handleLoad);

    // Hoặc kiểm tra mỗi 100ms trong tối đa 10 giây
    const interval = setInterval(() => {
      if (checkSDK()) {
        clearInterval(interval);
        console.log("✅ VietMap SDK loaded (via interval)");
      }
    }, 100);

    // Cleanup sau 10 giây
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!window.vietmapgl) {
        console.error("❌ VietMap SDK failed to load after 10 seconds");
        setMapError(true);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      window.removeEventListener("load", handleLoad);
    };
  }, [sdkReady]);

  // 1. KHỞI TẠO BẢN ĐỒ - Chỉ chạy khi SDK ready
  useEffect(() => {
    if (!sdkReady || !mapRef.current || mapObjRef.current) return;

    let mounted = true;
    let loadTimeout;

    const initMap = () => {
      try {
        if (!window.vietmapgl) {
          console.error("VietMap SDK disappeared!");
          setMapError(true);
          return;
        }

        console.log("🗺️ Initializing map...");
        console.log("User location:", validUserLoc);
        console.log("Style URL:", getVietMapStyleUrl());

        // Test if the style URL is accessible
        fetch(getVietMapStyleUrl())
          .then(response => {
            console.log("Style URL response status:", response.status);
            if (!response.ok) {
              console.error("Style URL not accessible:", response.statusText);
            }
          })
          .catch(error => {
            console.error("Style URL fetch error:", error);
          });

        const map = new window.vietmapgl.Map({
          container: mapRef.current,
          style: getVietMapStyleUrl(),
          center: [validUserLoc.lng, validUserLoc.lat],
          zoom: 14,
          antialias: true,
          doubleClickZoom: false,
        });

        mapObjRef.current = map;
        console.log("✅ VietMap instance created");

        loadTimeout = setTimeout(() => {
          if (mounted && !mapReady && mapObjRef.current) {
            console.warn("⏱️ Map load timeout - forcing ready state");
            // Try to set map ready even if load event didn't fire
            try {
              const map = mapObjRef.current;
              if (map && map.isStyleLoaded && map.isStyleLoaded()) {
                console.log("✅ Style is loaded, setting map ready");
                setMapReady(true);
              } else {
                console.warn("⚠️ Style not loaded, but forcing ready anyway");
                setMapReady(true);
              }
            } catch (timeoutError) {
              console.error("Error in timeout handler:", timeoutError);
              setMapReady(true); // Force ready to prevent infinite loading
            }
          }
        }, 15000); // Increase timeout to 15 seconds

        map.on("load", () => {
          console.log("✅ VietMap load event fired");
          if (!mounted) return;
          clearTimeout(loadTimeout);

          try {
            // Add search radius source and layers
            if (!map.getSource("search-radius")) {
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
            }

            // Add user location source and layer
            map.addSource("user-location", {
              type: "geojson",
              data: {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [validUserLoc.lng, validUserLoc.lat],
                },
              },
            });

            map.addLayer({
              id: "user-location-dot",
              type: "circle",
              source: "user-location",
              paint: {
                "circle-color": "#00346f",
                "circle-radius": 10,
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 3,
              },
            });

            // Create user location marker with animation
            if (!userLocationMarkerRef.current) {
              const locEl = document.createElement("div");
              locEl.className = "user-location-marker";
              userLocationMarkerRef.current = new window.vietmapgl.Marker({
                element: locEl,
                anchor: "center"
              })
                .setLngLat([validUserLoc.lng, validUserLoc.lat])
                .addTo(map);
            }

            map.resize();
            setMapReady(true);
            console.log("✅ Map is ready!");
          } catch (err) {
            console.error("Error in map.on('load'):", err);
            setMapError(true);
          }
        });

        map.on("error", (e) => {
          console.error("VietMap error:", e);
          console.error("Error details:", e.error);
          if (e.error?.message?.includes("abort")) return;
          if (mounted) {
            console.error("Setting map error state due to:", e.error?.message || "Unknown error");
            setMapError(true);
          }
        });

        map.on("styledata", () => {
          console.log("✅ VietMap style loaded");
          // Additional check: if load event hasn't fired but style is loaded, set ready
          if (!mapReady && map.isStyleLoaded && map.isStyleLoaded()) {
            console.log("✅ Setting map ready from styledata event");
            setTimeout(() => {
              if (!mapReady && mounted) {
                setMapReady(true);
              }
            }, 1000);
          }
        });

        // Additional fallback: check periodically if map is ready
        const readyCheckInterval = setInterval(() => {
          if (!mounted || mapReady) {
            clearInterval(readyCheckInterval);
            return;
          }
          
          try {
            if (map && map.isStyleLoaded && map.isStyleLoaded()) {
              console.log("✅ Map ready detected via interval check");
              clearInterval(readyCheckInterval);
              setMapReady(true);
            }
          } catch (intervalError) {
            console.warn("Error in ready check interval:", intervalError);
          }
        }, 2000);

        // Clean up interval after 30 seconds
        setTimeout(() => {
          clearInterval(readyCheckInterval);
        }, 30000);

      } catch (err) {
        console.error("Map init error:", err);
        if (mounted) setMapError(true);
      }
    };

    initMap();

    return () => {
      mounted = false;
      clearTimeout(loadTimeout);
    };
  }, [sdkReady, validUserLoc, radiusM, hotels]); // Add dependencies

  // 2. RENDER CLUSTERS ON MAP READY AND HOTEL CHANGES
  useEffect(() => {
    if (!mapReady || !mapObjRef.current) return;
    
    // Initial render
    renderClusters();
    
    // Auto-adjust radius for hotel coverage
    if (hotels.length > 0) {
      const targetRadius = getRadiusForCoverage(validUserLoc, hotels, 0.5);
      setRadiusM(prev => Math.max(prev, targetRadius));
    }
  }, [hotels, mapReady, validUserLoc, setRadiusM, renderClusters]);

  // 3. ADD MOVEEND EVENT LISTENER FOR CLUSTER UPDATES
  useEffect(() => {
    if (!mapReady || !mapObjRef.current) return;
    
    const map = mapObjRef.current;
    map.on('moveend', debouncedRenderClusters);
    
    return () => {
      map.off('moveend', debouncedRenderClusters);
    };
  }, [mapReady, debouncedRenderClusters]);

  // 3. CẬP NHẬT RADIUS VÀ USER LOCATION
  useEffect(() => {
    if (!mapReady || !mapObjRef.current) return;
    
    try {
      const map = mapObjRef.current;

      // Update search radius circle
      const radiusSource = map.getSource("search-radius");
      if (radiusSource) {
        radiusSource.setData(buildCircleGeoJSON(validUserLoc, radiusM));
      }

      // Update user location
      const userSource = map.getSource("user-location");
      if (userSource) {
        userSource.setData({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [validUserLoc.lng, validUserLoc.lat],
          },
        });
      }

      // Update user location marker
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.setLngLat([validUserLoc.lng, validUserLoc.lat]);
      }

      // Update radius handle
      updateRadiusHandle(validUserLoc, radiusM);

      // Update cluster markers for radius changes
      renderClusters();

      // Fit bounds to search circle with comprehensive error handling
      try {
        const bounds = getCircleBounds(validUserLoc, radiusM);
        if (bounds && Array.isArray(bounds) && bounds.length === 2 && 
            Array.isArray(bounds[0]) && Array.isArray(bounds[1]) &&
            bounds[0].length === 2 && bounds[1].length === 2) {
          // Additional validation: ensure bounds are valid numbers
          const [[west, south], [east, north]] = bounds;
          if (typeof west === 'number' && typeof south === 'number' && 
              typeof east === 'number' && typeof north === 'number' &&
              !isNaN(west) && !isNaN(south) && !isNaN(east) && !isNaN(north) &&
              isFinite(west) && isFinite(south) && isFinite(east) && isFinite(north)) {
            
            // Ensure bounds make sense (west < east, south < north)
            if (west < east && south < north) {
              map.fitBounds(bounds, { padding: 100, maxZoom: 14 });
            } else {
              console.warn('Invalid bounds order:', { west, east, south, north });
            }
          } else {
            console.warn('Invalid bounds values:', bounds);
          }
        } else {
          console.warn('Invalid bounds format from getCircleBounds:', bounds);
        }
      } catch (boundsError) {
        console.error("Error fitting bounds:", boundsError);
        // Fallback: just center on user location without fitting bounds
        try {
          map.easeTo({ center: [validUserLoc.lng, validUserLoc.lat], zoom: 14 });
        } catch (fallbackError) {
          console.error("Fallback centering also failed:", fallbackError);
        }
      }
    } catch (error) {
      console.error("Error in radius/location update effect:", error);
    }
  }, [mapReady, radiusM, validUserLoc, updateRadiusHandle, renderClusters]);

  // 5. INITIAL USER LOCATION CENTERING
  useEffect(() => {
    if (!mapReady || !mapObjRef.current || initialUserLocationCenteredRef.current) return;
    mapObjRef.current.easeTo({ center: [validUserLoc.lng, validUserLoc.lat], zoom: 14 });
    initialUserLocationCenteredRef.current = true;
  }, [mapReady, validUserLoc]);

  // 6. INITIAL CIRCLE RADIUS SETUP
  useEffect(() => {
    if (!mapReady || !mapObjRef.current || initialCircleRadiusSetRef.current) return;
    const map = mapObjRef.current;
    const bounds = map.getBounds();
    if (!bounds.isEmpty()) {
      const center = map.getCenter();
      const north = bounds.getNorth();
      const south = bounds.getSouth();
      const east = bounds.getEast();
      const west = bounds.getWest();
      const dLat = Math.min(
        getDistanceMeters({ lat: center.lat, lng: center.lng }, { lat: north, lng: center.lng }),
        getDistanceMeters({ lat: center.lat, lng: center.lng }, { lat: south, lng: center.lng })
      );
      const dLng = Math.min(
        getDistanceMeters({ lat: center.lat, lng: center.lng }, { lat: center.lat, lng: east }),
        getDistanceMeters({ lat: center.lat, lng: center.lng }, { lat: center.lat, lng: west })
      );
      const nextRadius = Math.min(40000, Math.max(500, Math.round(Math.min(dLat, dLng) * 0.9 / 100) * 100));
      setRadiusM(nextRadius);
      initialCircleRadiusSetRef.current = true;
    }
  }, [mapReady, validUserLoc, setRadiusM]);

  // 7. WINDOW RESIZE HANDLING
  useEffect(() => {
    if (!mapReady || !mapObjRef.current) return;
    mapObjRef.current.resize();
  }, [mapReady]);

  useEffect(() => {
    if (!mapReady || !mapObjRef.current) return;
    const handleResize = () => mapObjRef.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mapReady]);

  // 8. CLEANUP CLUSTER MARKERS ON UNMOUNT
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
      
      {/* Fallback khi lỗi thật sự (Key sai, style hỏng) */}
      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-50">
           <Icon name="cloud_off" size={48} className="text-gray-400 mb-2" />
           <p className="text-sm font-bold text-gray-500">VietMap API Error. Please check your Key.</p>
        </div>
      )}

      {/* Loading State */}
      {!mapReady && !mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 z-10">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-gray-600 mb-2">Loading VietMap...</p>
          <p className="text-xs text-gray-500">SDK Ready: {sdkReady ? 'Yes' : 'No'}</p>
          {process.env.NODE_ENV === 'development' && (
            <button 
              onClick={() => {
                console.log('Debug info:');
                console.log('- SDK Ready:', sdkReady);
                console.log('- Map Ready:', mapReady);
                console.log('- Map Error:', mapError);
                console.log('- Window vietmapgl:', !!window.vietmapgl);
                console.log('- Map Ref:', !!mapRef.current);
                console.log('- Map Obj:', !!mapObjRef.current);
                console.log('- User Location:', userLoc);
                console.log('- Style URL:', getVietMapStyleUrl());
              }}
              className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded"
            >
              Debug Info
            </button>
          )}
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        <button onClick={() => zoom(1)} className="bg-white p-2.5 rounded-xl shadow-md text-primary hover:bg-gray-50 transition-colors"><Icon name="add" /></button>
        <button onClick={() => zoom(-1)} className="bg-white p-2.5 rounded-xl shadow-md text-primary hover:bg-gray-50 transition-colors"><Icon name="remove" /></button>
        <button onClick={recenter} className="bg-white p-2.5 rounded-xl shadow-md text-primary hover:bg-gray-50 transition-colors mt-3"><Icon name="my_location" /></button>
      </div>
    </div>
  );
}

export default VietMapPanel;