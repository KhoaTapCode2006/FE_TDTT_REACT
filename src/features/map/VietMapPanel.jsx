import { useEffect, useRef, useState } from "react";
import { useApp } from "@/app/AppContext";
import {
  getVietMapStyleUrl,
  buildCircleGeoJSON,
  buildHotelGeoJSON,
  getDistanceMeters,
  getRadiusForCoverage,
} from "@/services/external/vietmap.service";
import Icon from "@/components/ui/Icon";

function loadVietMapScript() {
  return new Promise((resolve, reject) => {
    if (window.vietmapgl) return resolve(window.vietmapgl);

    const existing = document.querySelector('script[src*="vietmap-gl-js"]');
    if (existing) {
      if (window.vietmapgl) return resolve(window.vietmapgl);
      existing.addEventListener(
        "load",
        () => (window.vietmapgl ? resolve(window.vietmapgl) : reject(new Error("VietMap library did not initialize"))),
        { once: true }
      );
      existing.addEventListener(
        "error",
        () => reject(new Error("VietMap script failed to load")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/@vietmap/vietmap-gl-js@6.0.1/dist/vietmap-gl.js";
    script.async = true;
    script.defer = true;
    script.onload = () => (window.vietmapgl ? resolve(window.vietmapgl) : reject(new Error("VietMap library did not initialize")));
    script.onerror = () => reject(new Error("VietMap script failed to load"));
    document.head.appendChild(script);
  });
}

function createHotelMarkerElement(hotel, insideCircle, onSelect) {
  const size = insideCircle ? 52 : 42;
  const element = document.createElement("div");
  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
  element.style.borderRadius = "50%";
  element.style.overflow = "hidden";
  element.style.boxShadow = "0 0 0 2px rgba(255,255,255,0.95), 0 10px 22px rgba(0,0,0,0.22)";
  element.style.border = "2px solid rgba(255,255,255,0.95)";
  element.style.cursor = "pointer";
  element.style.backgroundColor = "#ffffff";
  element.style.transition = "width 0.2s ease, height 0.2s ease, transform 0.2s ease";
  if (insideCircle) {
    element.style.transform = "scale(1.05)";
  }

  const image = document.createElement("img");
  image.src = hotel.thumbnail || hotel.images?.[0] || "";
  image.alt = hotel.name || "Hotel";
  image.style.width = "100%";
  image.style.height = "100%";
  image.style.objectFit = "cover";
  image.style.display = "block";
  element.appendChild(image);

  element.addEventListener("click", (event) => {
    event.stopPropagation();
    onSelect?.(hotel);
  });

  return element;
}

function createHotelMarkers(map, hotels, userLocation, radiusM, setActiveHotel, markerRef) {
  markerRef.current.forEach((marker) => marker.remove());
  markerRef.current = [];

  hotels
    .filter((hotel) => hotel.lat != null && hotel.lng != null)
    .forEach((hotel) => {
      const insideCircle = getDistanceMeters(userLocation, { lat: hotel.lat, lng: hotel.lng }) <= radiusM;
      const marker = new window.vietmapgl.Marker({
        element: createHotelMarkerElement(hotel, insideCircle, setActiveHotel),
        anchor: "center",
      })
        .setLngLat([hotel.lng, hotel.lat])
        .addTo(map);

      markerRef.current.push(marker);
    });
}

function VietMapPanel() {
  const { userLoc, hotels, activeHotel, setActiveHotel, radiusM, setRadiusM } = useApp();
  const mapRef = useRef(null);
  const mapObjRef = useRef(null);
  const hotelMarkersRef = useRef([]);
  const userLocationMarkerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (!mapRef.current) {
      setMapError(true);
      return;
    }

    let mounted = true;

    const initMap = async () => {
      try {
        await loadVietMapScript();

        const map = new window.vietmapgl.Map({
          container: mapRef.current,
          style: getVietMapStyleUrl(),
          center: [userLoc.lng, userLoc.lat],
          zoom: 14,
          doubleClickZoom: false,
        });

        mapObjRef.current = map;

        map.on("load", () => {
          map.addSource("search-radius", {
            type: "geojson",
            data: buildCircleGeoJSON(userLoc, radiusM),
          });

          map.addLayer({
            id: "search-radius-fill",
            type: "fill",
            source: "search-radius",
            paint: {
              "fill-color": "#00346f",
              "fill-opacity": 0.08,
            },
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

          map.addSource("user-location", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [userLoc.lng, userLoc.lat],
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

          const locationElement = document.createElement("div");
          locationElement.className = "user-location-marker";
          userLocationMarkerRef.current = new window.vietmapgl.Marker({ element: locationElement, anchor: "center" })
            .setLngLat([userLoc.lng, userLoc.lat])
            .addTo(map);

          map.addSource("hotels", {
            type: "geojson",
            data: buildHotelGeoJSON(hotels),
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          });

          map.addLayer({
            id: "clusters",
            type: "circle",
            source: "hotels",
            filter: ["has", "point_count"],
            paint: {
              "circle-color": "#ff5a3c",
              "circle-radius": ["step", ["get", "point_count"], 18, 10, 26, 30, 36],
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 2,
            },
          });

          map.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "hotels",
            filter: ["has", "point_count"],
            layout: {
              "text-field": "{point_count_abbreviated}",
              "text-size": 12,
            },
            paint: {
              "text-color": "#ffffff",
            },
          });

          map.on("click", "clusters", (event) => {
            const feature = event.features?.[0];
            if (!feature || !map.getSource("hotels")) return;
            const clusterId = feature.properties?.cluster_id;
            map.getSource("hotels").getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return;
              map.easeTo({ center: feature.geometry.coordinates, zoom });
            });
          });

          map.on("mouseenter", "clusters", () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "clusters", () => {
            map.getCanvas().style.cursor = "";
          });

          if (mounted) {
            setMapReady(true);
          }
          createHotelMarkers(map, hotels, userLoc, radiusM, setActiveHotel, hotelMarkersRef);
        });

        map.on("error", () => {
          if (mounted) setMapError(true);
        });
      } catch (error) {
        console.error("VietMap initialization failed:", error);
        if (mounted) setMapError(true);
      }
    };

    initMap();

    return () => {
      mounted = false;
      hotelMarkersRef.current.forEach((marker) => marker.remove());
      hotelMarkersRef.current = [];
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
      }
      if (mapObjRef.current) {
        mapObjRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapObjRef.current) return;
    const map = mapObjRef.current;
    const hotelsSource = map.getSource("hotels");
    if (hotelsSource) {
      hotelsSource.setData(buildHotelGeoJSON(hotels));
    }
    createHotelMarkers(map, hotels, userLoc, radiusM, setActiveHotel, hotelMarkersRef);

    if (hotels.length > 0) {
      const targetRadius = getRadiusForCoverage(userLoc, hotels, 0.5);
      setRadiusM((prev) => Math.max(prev, targetRadius));
    }
  }, [hotels, mapReady, userLoc, setActiveHotel, setRadiusM, radiusM]);

  useEffect(() => {
    if (!mapReady || !mapObjRef.current) return;
    const map = mapObjRef.current;
    const radiusSource = map.getSource("search-radius");
    if (radiusSource) {
      radiusSource.setData(buildCircleGeoJSON(userLoc, radiusM));
    }
    const userSource = map.getSource("user-location");
    if (userSource) {
      userSource.setData({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [userLoc.lng, userLoc.lat],
        },
      });
    }

    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.setLngLat([userLoc.lng, userLoc.lat]);
    }
  }, [mapReady, userLoc, radiusM]);

  useEffect(() => {
    if (!mapReady || !mapObjRef.current || !activeHotel) return;
    mapObjRef.current.easeTo({ center: [activeHotel.lng, activeHotel.lat], zoom: 16 });
  }, [mapReady, activeHotel]);

  return (
    <div className="flex-1 relative overflow-hidden bg-surface-container-highest min-h-[640px]">
      <div ref={mapRef} className="absolute inset-0 w-full h-full" />

      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-container-low">
          <div
            className="w-full h-full"
            style={{
              background: "#e8eaed",
              backgroundImage: `
                linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),
                linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px),
                linear-gradient(rgba(0,0,0,.03) 1px,transparent 1px),
                linear-gradient(90deg,rgba(0,0,0,.03) 1px,transparent 1px)`,
              backgroundSize: "100px 100px,100px 100px,20px 20px,20px 20px",
            }}
          />
          <div className="absolute flex flex-col items-center gap-2">
            <Icon name="map" size={40} className="text-outline" />
            <p className="text-sm font-semibold text-on-surface-variant bg-white/80 px-4 py-2 rounded-xl">
              VietMap failed to load — please check your connection.
            </p>
          </div>
        </div>
      )}

      {!mapReady && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low/70 z-10">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => mapObjRef.current?.easeTo({ zoom: (mapObjRef.current.getZoom() || 14) + 1 })}
          className="bg-white p-2.5 rounded-xl shadow-card text-primary hover:bg-surface-container-low transition-colors"
        >
          <Icon name="add" />
        </button>
        <button
          type="button"
          onClick={() => mapObjRef.current?.easeTo({ zoom: (mapObjRef.current.getZoom() || 14) - 1 })}
          className="bg-white p-2.5 rounded-xl shadow-card text-primary hover:bg-surface-container-low transition-colors"
        >
          <Icon name="remove" />
        </button>
        <button
          type="button"
          onClick={() => mapObjRef.current?.easeTo({ center: [userLoc.lng, userLoc.lat], zoom: 14 })}
          className="bg-white p-2.5 rounded-xl shadow-card text-primary hover:bg-surface-container-low transition-colors"
        >
          <Icon name="my_location" />
        </button>
      </div>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 glass rounded-2xl shadow-editorial px-5 py-3 flex items-center gap-4 border border-white/60">
        <Icon name="radio_button_checked" className="text-primary" size={20} />
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Search Radius</label>
          <input
            type="range"
            min={500}
            max={40000}
            step={500}
            value={radiusM}
            onChange={(event) => setRadiusM(Number(event.target.value))}
            className="w-36 h-1.5 cursor-pointer accent-primary"
          />
        </div>
        <span className="text-sm font-bold text-primary w-14 text-right">{(radiusM / 1000).toFixed(1)} km</span>
      </div>
    </div>
  );
}

export default VietMapPanel;
