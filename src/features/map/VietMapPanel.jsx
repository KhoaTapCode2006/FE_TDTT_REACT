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

// Helper: Tạo element Marker (giữ nguyên logic của Huy nhưng bọc thêm CSS)
function createHotelMarkerElement(hotel, insideCircle, onSelect) {
  const size = insideCircle ? 52 : 42;
  const element = document.createElement("div");
  element.style.cssText = `
    width: ${size}px; height: ${size}px; border-radius: 50%; overflow: hidden;
    box-shadow: 0 0 0 2px white, 0 10px 22px rgba(0,0,0,0.2);
    border: 2px solid white; cursor: pointer; background: #fff;
    transition: all 0.2s ease; transform: ${insideCircle ? 'scale(1.1)' : 'none'};
  `;

  const image = document.createElement("img");
  image.src = hotel.thumbnail || hotel.images?.[0] || "";
  image.style.cssText = "width: 100%; height: 100%; object-fit: cover;";
  element.appendChild(image);

  element.addEventListener("click", (e) => {
    e.stopPropagation();
    onSelect?.(hotel);
  });
  return element;
}

function VietMapPanel() {
  const { userLoc, hotels, activeHotel, setActiveHotel, radiusM, setRadiusM } = useApp();
  const mapRef = useRef(null);
  const mapObjRef = useRef(null);
  const hotelMarkersRef = useRef([]);
  const userLocationMarkerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  // 1. KHỞI TẠO BẢN ĐỒ
  useEffect(() => {
    if (!mapRef.current || !window.vietmapgl || mapObjRef.current) return;
    let mounted = true;

    const initMap = () => {
      try {
        const map = new window.vietmapgl.Map({
          container: mapRef.current,
          style: getVietMapStyleUrl(),
          center: [userLoc.lng, userLoc.lat],
          zoom: 14,
          antialias: true
        });

        mapObjRef.current = map;

        map.on("load", () => {
          if (!mounted) return;

          // Thêm Source và Layer Radius
          map.addSource("search-radius", {
            type: "geojson",
            data: buildCircleGeoJSON(userLoc, radiusM),
          });

          map.addLayer({
            id: "search-radius-fill",
            type: "fill",
            source: "search-radius",
            paint: { "fill-color": "#00346f", "fill-opacity": 0.08 }
          });

          // Marker vị trí người dùng
          const locEl = document.createElement("div");
          locEl.className = "w-6 h-6 bg-primary border-4 border-white rounded-full shadow-lg";
          userLocationMarkerRef.current = new window.vietmapgl.Marker({ element: locEl })
            .setLngLat([userLoc.lng, userLoc.lat])
            .addTo(map);

          setMapReady(true);
        });

        // QUAN TRỌNG: Lọc lỗi AbortError để không hiện màn hình lỗi sai
        map.on("error", (e) => {
          if (e.error?.message?.includes("abort") || e.error?.status === 0) return;
          console.error("VietMap Critical Error:", e);
          if (mounted) setMapError(true);
        });

      } catch (err) {
        if (mounted) setMapError(true);
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (mapObjRef.current) {
        try {
          mapObjRef.current.remove();
        } catch (e) { /* Bịt miệng AbortError hoàn toàn */ }
        mapObjRef.current = null;
      }
    };
  }, []);

  // 2. CẬP NHẬT MARKERS & RADIUS KHI DỮ LIỆU THAY ĐỔI
  useEffect(() => {
    if (!mapReady || !mapObjRef.current) return;
    const map = mapObjRef.current;

    // Cập nhật Markers khách sạn
    hotelMarkersRef.current.forEach(m => m.remove());
    hotelMarkersRef.current = [];
    hotels.filter(h => h.lat && h.lng).forEach(hotel => {
      const dist = getDistanceMeters(userLoc, { lat: hotel.lat, lng: hotel.lng });
      const marker = new window.vietmapgl.Marker({
        element: createHotelMarkerElement(hotel, dist <= radiusM, setActiveHotel),
      })
      .setLngLat([hotel.lng, hotel.lat])
      .addTo(map);
      hotelMarkersRef.current.push(marker);
    });

    // Cập nhật Vòng tròn bán kính
    const source = map.getSource("search-radius");
    if (source) {
      source.setData(buildCircleGeoJSON(userLoc, radiusM));
    }
  }, [hotels, mapReady, radiusM, userLoc, setActiveHotel]);

  // 3. ĐIỀU HƯỚNG KHI CHỌN KHÁCH SẠN
  useEffect(() => {
    if (mapReady && mapObjRef.current && activeHotel) {
      mapObjRef.current.easeTo({ center: [activeHotel.lng, activeHotel.lat], zoom: 16 });
    }
  }, [mapReady, activeHotel]);

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
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
        <button onClick={() => mapObjRef.current?.zoomIn()} className="bg-white p-2.5 rounded-xl shadow-md text-primary"><Icon name="add" /></button>
        <button onClick={() => mapObjRef.current?.zoomOut()} className="bg-white p-2.5 rounded-xl shadow-md text-primary"><Icon name="remove" /></button>
        <button onClick={() => mapObjRef.current?.flyTo({ center: [userLoc.lng, userLoc.lat], zoom: 14 })} className="bg-white p-2.5 rounded-xl shadow-md text-primary"><Icon name="my_location" /></button>
      </div>

      {/* Radius UI */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 glass rounded-2xl shadow-editorial px-5 py-3 flex items-center gap-4 border border-white/60">
        <Icon name="distance" className="text-primary" size={20} />
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Bán kính tìm kiếm</label>
          <input 
            type="range" min={500} max={20000} step={500} 
            value={radiusM} onChange={(e) => setRadiusM(Number(e.target.value))} 
            className="w-36 h-1.5 cursor-pointer accent-primary" 
          />
        </div>
        <span className="text-sm font-bold text-primary w-12 text-right">{(radiusM / 1000).toFixed(1)}km</span>
      </div>
    </div>
  );
}

export default VietMapPanel;