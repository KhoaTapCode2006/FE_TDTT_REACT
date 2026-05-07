import { useState, useRef, useEffect } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

export const MEMBER_COLORS = [
  "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6", "#3498db",
  "#1abc9c", "#e67e22", "#e91e63", "#00bcd4", "#ff5722",
];

// Tọa độ điểm đến mặc định (HCMC)
const DEST = { lat: 10.7719, lng: 106.6983 };

function generateLocations(members) {
  return members.map((m, i) => {
    const angle = (i / members.length) * 2 * Math.PI;
    const r     = 0.008 + (i % 3) * 0.005;
    return {
      ...m,
      lat:   DEST.lat + Math.sin(angle) * r,
      lng:   DEST.lng + Math.cos(angle) * r,
      color: MEMBER_COLORS[i % MEMBER_COLORS.length],
    };
  });
}

// ─── TripMapModal ─────────────────────────────────────────────────────────────
// Modal bản đồ hiển thị vị trí các thành viên và tuyến đường đến điểm đến.
// Click vào member để vẽ route từ vị trí của họ đến điểm đến.
function TripMapModal({ trip, onClose }) {
  const mapRef    = useRef(null);
  const mapObjRef = useRef(null);
  const markersRef = useRef([]);

  const [mapReady, setMapReady]           = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [routeInfo, setRouteInfo]         = useState(null);
  const [loadingRoute, setLoadingRoute]   = useState(false);

  const rawMembers = (trip.member_uids || []).map((uid, i) => ({
    id:     i + 1,
    name:   uid,
    avatar: uid.slice(0, 2).toUpperCase(),
  }));
  const members = generateLocations(rawMembers);

  // ── Init map ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapObjRef.current) return;
    const init = () => {
      if (!window.vietmapgl) { setTimeout(init, 300); return; }
      const map = new window.vietmapgl.Map({
        container: mapRef.current,
        style:     `https://maps.vietmap.vn/maps/styles/dm/style.json?apikey=6033c4efaa0e172ca5cb9ebc5c9d394da9a38466072ce84e`,
        center:    [DEST.lng, DEST.lat],
        zoom:      13,
        antialias: true,
      });
      mapObjRef.current = map;
      map.on("load", () => setMapReady(true));
    };
    init();
    return () => {
      markersRef.current.forEach((m) => m.remove());
      if (mapObjRef.current) { mapObjRef.current.remove(); mapObjRef.current = null; }
    };
  }, []);

  // ── Place markers ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapObjRef.current || !window.vietmapgl) return;
    const map = mapObjRef.current;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Điểm đến
    const destEl = document.createElement("div");
    destEl.style.cssText = `width:36px;height:36px;border-radius:50%;background:#255dad;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:18px;`;
    destEl.innerHTML = "🏁";
    destEl.title = trip.title;
    markersRef.current.push(
      new window.vietmapgl.Marker({ element: destEl, anchor: "center" })
        .setLngLat([DEST.lng, DEST.lat])
        .addTo(map)
    );

    // Thành viên
    members.forEach((m) => {
      const el = document.createElement("div");
      el.style.cssText = `width:36px;height:36px;border-radius:50%;background:${m.color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;cursor:pointer;transition:transform 0.2s;`;
      el.innerHTML = m.avatar;
      el.title = m.name;
      el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.2)"; });
      el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });
      el.addEventListener("click", () => handleMemberClick(m));
      markersRef.current.push(
        new window.vietmapgl.Marker({ element: el, anchor: "center" })
          .setLngLat([m.lng, m.lat])
          .addTo(map)
      );
    });

    const all  = [[DEST.lng, DEST.lat], ...members.map((m) => [m.lng, m.lat])];
    const lngs = all.map((p) => p[0]);
    const lats = all.map((p) => p[1]);
    map.fitBounds(
      [[Math.min(...lngs) - 0.01, Math.min(...lats) - 0.01], [Math.max(...lngs) + 0.01, Math.max(...lats) + 0.01]],
      { padding: 50, duration: 800 }
    );
  }, [mapReady]);

  // ── Route ─────────────────────────────────────────────────────────────────────
  const handleMemberClick = async (member) => {
    if (!mapObjRef.current || !mapReady) return;
    setSelectedMember(member);
    setLoadingRoute(true);
    setRouteInfo(null);

    const map = mapObjRef.current;
    if (map.getLayer("route-line")) map.removeLayer("route-line");
    if (map.getSource("route"))     map.removeSource("route");

    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${member.lng},${member.lat};${DEST.lng},${DEST.lat}?overview=full&geometries=geojson`
      );
      if (!res.ok) throw new Error();
      const data   = await res.json();
      const route  = data?.routes?.[0];
      const coords = route?.geometry?.coordinates;
      if (!coords?.length) throw new Error();

      map.addSource("route", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: coords } } });
      map.addLayer({ id: "route-line", type: "line", source: "route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": member.color, "line-width": 4, "line-opacity": 0.85 } });
      setRouteInfo({ distKm: (route.distance / 1000).toFixed(1), timeMin: Math.round(route.duration / 60), memberName: member.name });

      const lngs = coords.map((c) => c[0]);
      const lats  = coords.map((c) => c[1]);
      map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 60, duration: 800 });
    } catch {
      // Fallback: đường thẳng
      if (!map.getSource("route")) {
        map.addSource("route", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: [[member.lng, member.lat], [DEST.lng, DEST.lat]] } } });
        map.addLayer({ id: "route-line", type: "line", source: "route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": member.color, "line-width": 3, "line-dasharray": [2, 2] } });
      }
      const R    = 6371;
      const dLat = (DEST.lat - member.lat) * Math.PI / 180;
      const dLng = (DEST.lng - member.lng) * Math.PI / 180;
      const a    = Math.sin(dLat / 2) ** 2 + Math.cos(member.lat * Math.PI / 180) * Math.cos(DEST.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
      const distKm = (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
      setRouteInfo({ distKm, timeMin: Math.round(distKm / 0.5), memberName: member.name });
    } finally {
      setLoadingRoute(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col" style={{ height: "560px" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <div>
              <h3 className="text-base font-bold text-gray-900">Trip — Tuyến đường</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {trip.title} · Điểm đến: <span className="text-primary font-semibold">{trip.title}</span>
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors">✕</button>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Member list */}
            <div className="w-48 shrink-0 border-r border-gray-100 flex flex-col">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 pt-3 pb-2">
                Thành viên ({members.length})
              </p>
              <div className="flex-1 overflow-y-auto">
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleMemberClick(m)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      selectedMember?.id === m.id ? "bg-primary/10" : "hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: m.color }}
                    >
                      {m.avatar}
                    </div>
                    <span className={`text-sm truncate ${selectedMember?.id === m.id ? "font-semibold text-primary" : "text-gray-700"}`}>
                      {m.name.split(" ").slice(-1)[0]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Route info */}
              {(routeInfo || loadingRoute) && (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                  {loadingRoute ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-gray-500">Đang tính...</span>
                    </div>
                  ) : routeInfo && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-700 truncate">{routeInfo.memberName.split(" ").slice(-1)[0]}</p>
                      <p className="text-xs text-gray-500">📍 {routeInfo.distKm} km</p>
                      <p className="text-xs text-gray-500">⏱ ~{routeInfo.timeMin} phút</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Map */}
            <div className="flex-1 relative">
              <div ref={mapRef} className="absolute inset-0 w-full h-full rounded-br-2xl" />
              {!mapReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-br-2xl">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {mapReady && !selectedMember && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow text-xs text-gray-600 font-medium">
                  Chọn thành viên để xem tuyến đường
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default TripMapModal;
