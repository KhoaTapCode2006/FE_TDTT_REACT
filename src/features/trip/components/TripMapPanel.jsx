import { useState, useRef, useEffect, useCallback } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import { useTripMembers } from "../hooks/useTripMembers";
import { MEMBER_COLORS } from "./modals/TripMapModal";

// ─── TripMapPanel ─────────────────────────────────────────────────────────────
// Giống TripMapModal nhưng là panel inline (không có modal wrapper).
// Dùng cho tab "TripMap" trong TripPage.

const statusLabel = {
  active:          { text: "Đang di chuyển", color: "text-green-600" },
  lost_signal:     { text: "Mất tín hiệu",   color: "text-yellow-600" },
  wrong_direction: { text: "Sai hướng",       color: "text-red-500" },
  arrived:         { text: "Đã đến",          color: "text-blue-600" },
  left:            { text: "Đã rời",           color: "text-gray-400" },
  no_share:        { text: "Không chia sẻ",   color: "text-gray-400" },
};

export default function TripMapPanel({ trip }) {
  const mapRef     = useRef(null);
  const mapObjRef  = useRef(null);
  const markersRef = useRef({});
  const watchIdRef = useRef(null);

  const [mapReady, setMapReady]             = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [routeInfoMap, setRouteInfoMap]     = useState({});
  const [loadingRoutes, setLoadingRoutes]   = useState(false);
  const [distToDestM, setDistToDestM]       = useState(null);

  const currentUid = auth.currentUser?.uid;
  const tripId     = trip?.id;

  const { members: firestoreMembers } = useTripMembers(tripId ?? null);

  const memberTracking = Object.fromEntries(
    firestoreMembers
      .filter((m) => m.tracking)
      .map((m) => [m.uid, {
        lat:      m.tracking.lat      ?? null,
        lng:      m.tracking.lng      ?? null,
        status:   m.tracking.status   || "no_share",
        accident: m.tracking.accident === true,
        updated_at: m.tracking.updated_at,
      }])
  );

  const DEST = {
    lat:  trip?.place?.gps_coordinates?.latitude  ?? 10.7626,
    lng:  trip?.place?.gps_coordinates?.longitude ?? 106.6822,
    name: trip?.place?.name ?? "Điểm đến",
  };

  // ── Push GPS ──────────────────────────────────────────────────────────────
  const pushTracking = useCallback(async (lat, lng) => {
    if (!currentUid || !tripId) return;
    const R = 6371000;
    const dLat = (DEST.lat - lat) * Math.PI / 180;
    const dLng = (DEST.lng - lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(DEST.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    setDistToDestM(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    try {
      await setDoc(doc(db, "trips", tripId, "members", currentUid), {
        tracking: { lat, lng, updated_at: serverTimestamp(), status: "active" },
      }, { merge: true });
    } catch (err) {
      console.warn("[TripMapPanel] pushTracking failed:", err);
    }
  }, [currentUid, tripId, DEST.lat, DEST.lng]);

  const pushTrackingRef = useRef(pushTracking);
  useEffect(() => { pushTrackingRef.current = pushTracking; }, [pushTracking]);

  // ── GPS setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUid || !tripId) return;
    const ref = doc(db, "trips", tripId, "members", currentUid);
    setDoc(ref, { tracking: { status: "active", updated_at: serverTimestamp() } }, { merge: true }).catch(() => {});
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => pushTrackingRef.current?.(pos.coords.latitude, pos.coords.longitude),
      () => {}, { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => pushTrackingRef.current?.(pos.coords.latitude, pos.coords.longitude),
      () => {}, { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      setDoc(ref, { tracking: { status: "no_share", updated_at: serverTimestamp() } }, { merge: true }).catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUid, tripId]);

  // ── Build members ─────────────────────────────────────────────────────────
  const members = firestoreMembers.map((m, i) => {
    const t = memberTracking[m.uid];
    const hasRealGps = !!(t?.lat != null && t?.lng != null);
    const angle = (i / (firestoreMembers.length || 1)) * 2 * Math.PI;
    const r     = 0.008 + (i % 3) * 0.005;
    return {
      id: m.uid, name: m.uid,
      avatar: m.uid.slice(0, 2).toUpperCase(),
      color:  MEMBER_COLORS[i % MEMBER_COLORS.length],
      lat:    hasRealGps ? t.lat : DEST.lat + Math.sin(angle) * r,
      lng:    hasRealGps ? t.lng : DEST.lng + Math.cos(angle) * r,
      hasRealGps,
      status:   t?.status || "no_share",
      accident: t?.accident === true,
      isMe:     m.uid === currentUid,
    };
  });

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapObjRef.current) return;
    const init = () => {
      if (!window.vietmapgl) { setTimeout(init, 300); return; }
      const map = new window.vietmapgl.Map({
        container: mapRef.current,
        style: `https://maps.vietmap.vn/maps/styles/dm/style.json?apikey=6033c4efaa0e172ca5cb9ebc5c9d394da9a38466072ce84e`,
        center: [DEST.lng, DEST.lat],
        zoom: 13,
        antialias: true,
      });
      mapObjRef.current = map;
      map.on("load", () => setMapReady(true));
    };
    init();
    return () => {
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};
      if (mapObjRef.current) { mapObjRef.current.remove(); mapObjRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  // ── Update markers ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapObjRef.current || !window.vietmapgl) return;
    const map = mapObjRef.current;

    if (!markersRef.current["__dest__"]) {
      const destEl = document.createElement("div");
      destEl.style.cssText = `width:40px;height:40px;border-radius:50%;background:#255dad;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:20px;`;
      destEl.innerHTML = "🏁";
      destEl.title = `${DEST.name} — Điểm đến`;
      markersRef.current["__dest__"] = new window.vietmapgl.Marker({ element: destEl, anchor: "center" })
        .setLngLat([DEST.lng, DEST.lat]).addTo(map);
    }

    members.forEach((m) => {
      if (markersRef.current[m.id]) {
        markersRef.current[m.id].setLngLat([m.lng, m.lat]);
        const el = markersRef.current[m.id].getElement();
        if (el) { el.style.background = m.accident ? "#dc2626" : m.color; el.innerHTML = m.accident ? "🚨" : m.avatar; }
      } else {
        const el = document.createElement("div");
        const bg = m.accident ? "#dc2626" : m.color;
        const pulse = m.isMe ? `box-shadow:0 0 0 4px ${m.color}44,0 2px 8px rgba(0,0,0,0.3);` : `box-shadow:0 2px 8px rgba(0,0,0,0.3);`;
        el.style.cssText = `width:36px;height:36px;border-radius:50%;background:${bg};border:3px solid white;${pulse}display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;cursor:pointer;transition:transform 0.2s;`;
        el.innerHTML = m.accident ? "🚨" : m.avatar;
        el.title = m.isMe ? `${m.name} (bạn)` : m.name;
        el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.2)"; });
        el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });
        el.addEventListener("click", () => handleMemberClick(m));
        markersRef.current[m.id] = new window.vietmapgl.Marker({ element: el, anchor: "center" })
          .setLngLat([m.lng, m.lat]).addTo(map);
      }
    });

    const all  = [[DEST.lng, DEST.lat], ...members.map((m) => [m.lng, m.lat])];
    const lngs = all.map((p) => p[0]);
    const lats  = all.map((p) => p[1]);
    map.fitBounds(
      [[Math.min(...lngs) - 0.005, Math.min(...lats) - 0.005], [Math.max(...lngs) + 0.005, Math.max(...lats) + 0.005]],
      { padding: 60, duration: 800, maxZoom: 16 }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, memberTracking]);

  // ── Route helpers ─────────────────────────────────────────────────────────
  const fetchAndDrawRoute = useCallback(async (map, member) => {
    const layerId  = `route-line-${member.id}`;
    const sourceId = `route-${member.id}`;
    if (map.getLayer(layerId))   map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${member.lng},${member.lat};${DEST.lng},${DEST.lat}?overview=full&geometries=geojson`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error();
      const data   = await res.json();
      const route  = data?.routes?.[0];
      const coords = route?.geometry?.coordinates;
      if (!coords?.length) throw new Error();
      map.addSource(sourceId, { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: coords } } });
      map.addLayer({ id: layerId, type: "line", source: sourceId, layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": member.color, "line-width": 4, "line-opacity": 0.85 } });
      return { distKm: (route.distance / 1000).toFixed(1), timeMin: Math.round(route.duration / 60), memberName: member.name, hasRealGps: member.hasRealGps };
    } catch {
      map.addSource(sourceId, { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: [[member.lng, member.lat], [DEST.lng, DEST.lat]] } } } );
      map.addLayer({ id: layerId, type: "line", source: sourceId, layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": member.color, "line-width": 3, "line-dasharray": [2, 2] } });
      const R = 6371;
      const dLat = (DEST.lat - member.lat) * Math.PI / 180;
      const dLng = (DEST.lng - member.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(member.lat * Math.PI / 180) * Math.cos(DEST.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
      const distKm = (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
      return { distKm, timeMin: Math.round(distKm / 0.5), memberName: member.name, hasRealGps: member.hasRealGps };
    }
  }, [DEST.lat, DEST.lng]);

  const loadAllRoutes = useCallback(async (currentMembers) => {
    if (!mapObjRef.current || !mapReady) return;
    setLoadingRoutes(true);
    try {
      const results = await Promise.all(currentMembers.map((m) => fetchAndDrawRoute(mapObjRef.current, m).then((info) => [m.id, info])));
      setRouteInfoMap(Object.fromEntries(results.filter(([, info]) => info)));
    } finally {
      setLoadingRoutes(false);
    }
  }, [mapReady, fetchAndDrawRoute]);

  const handleMemberClick = useCallback((member) => {
    if (!mapObjRef.current || !mapReady) return;
    setSelectedMember((prev) => prev?.id === member.id ? null : member);
    mapObjRef.current.flyTo({ center: [member.lng, member.lat], zoom: 14, duration: 800 });
  }, [mapReady]);

  const memberIdsKey = firestoreMembers.map((m) => m.uid).join(",");
  useEffect(() => {
    if (!mapReady || members.length === 0) return;
    loadAllRoutes(members);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, memberIdsKey]);

  // ── Accident / Arrive ─────────────────────────────────────────────────────
  const handleAccident = useCallback(async () => {
    if (!currentUid || !tripId) return;
    try {
      await setDoc(doc(db, "trips", tripId, "members", currentUid), { tracking: { accident: true, updated_at: serverTimestamp() } }, { merge: true });
    } catch (err) { console.warn("[TripMapPanel] handleAccident failed:", err); }
  }, [currentUid, tripId]);

  const handleArrive = useCallback(async () => {
    if (!currentUid || !tripId) return;
    try {
      await setDoc(doc(db, "trips", tripId, "members", currentUid), { tracking: { status: "arrived", updated_at: serverTimestamp() } }, { merge: true });
    } catch (err) { console.warn("[TripMapPanel] handleArrive failed:", err); }
  }, [currentUid, tripId]);

  const meAccident = members.find((m) => m.isMe)?.accident === true;
  const meArrived  = members.find((m) => m.isMe)?.status === "arrived";
  const canArrive  = distToDestM !== null && distToDestM < 500;

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <span className="text-4xl mb-3">🗺️</span>
        <p className="text-sm font-medium">Chọn một chuyến đi để xem bản đồ</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Member sidebar */}
      <div className="w-52 shrink-0 border-r border-gray-100 flex flex-col">
        {/* Trip title + actions */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900 truncate">{trip.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">Điểm đến: <span className="text-primary font-semibold">{DEST.name}</span></p>
          {members.some((m) => m.isMe) && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAccident}
                disabled={meAccident}
                className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-colors ${meAccident ? "bg-red-100 text-red-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 text-white"}`}
              >
                🚨 Accident
              </button>
              <button
                onClick={handleArrive}
                disabled={!canArrive || meArrived}
                title={!canArrive ? `Cần đến gần hơn (${distToDestM != null ? Math.round(distToDestM) + "m" : "?"})` : ""}
                className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-colors ${meArrived ? "bg-blue-100 text-blue-400 cursor-not-allowed" : canArrive ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
              >
                🏁 Arrive
              </button>
            </div>
          )}
        </div>

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 pt-3 pb-2">
          Thành viên ({members.length})
        </p>
        <div className="flex-1 overflow-y-auto">
          {members.map((m) => {
            const sl = statusLabel[m.status] || statusLabel.no_share;
            return (
              <button
                key={m.id}
                onClick={() => handleMemberClick(m)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${selectedMember?.id === m.id ? "bg-primary/10" : "hover:bg-gray-50"} ${m.accident ? "bg-red-50" : ""}`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 relative"
                  style={{ background: m.accident ? "#dc2626" : m.color }}
                >
                  {m.accident ? "🚨" : m.avatar}
                  {m.hasRealGps && !m.accident && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />}
                  {m.accident && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-600 border-2 border-white rounded-full animate-pulse" />}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-sm truncate ${selectedMember?.id === m.id ? "font-semibold text-primary" : m.accident ? "font-semibold text-red-600" : "text-gray-700"}`}>
                    {m.isMe ? "Bạn" : m.name.slice(0, 10) + "..."}
                  </span>
                  <span className={`text-[10px] ${m.accident ? "text-red-500" : sl.color}`}>
                    {m.accident ? "Tai nạn" : sl.text}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {loadingRoutes && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500">Đang tải tuyến đường...</span>
          </div>
        )}
        {!loadingRoutes && selectedMember && routeInfoMap[selectedMember.id] && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 space-y-1">
            <p className="text-xs font-semibold truncate" style={{ color: selectedMember.color }}>
              {selectedMember.isMe ? "Bạn" : selectedMember.name.slice(0, 12) + "..."}
            </p>
            <p className="text-xs text-gray-500">📍 {routeInfoMap[selectedMember.id].distKm} km</p>
            <p className="text-xs text-gray-500">⏱ ~{routeInfoMap[selectedMember.id].timeMin} phút</p>
            {!routeInfoMap[selectedMember.id].hasRealGps && <p className="text-[10px] text-yellow-500">⚠ Vị trí ước tính</p>}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0 w-full h-full" />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {mapReady && !selectedMember && !loadingRoutes && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow text-xs text-gray-600 font-medium">
            Nhấn vào thành viên để focus tuyến đường
          </div>
        )}
      </div>
    </div>
  );
}
