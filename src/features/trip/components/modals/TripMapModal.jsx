import { useState, useRef, useEffect, useCallback } from "react";
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/config/firebase";

// ─── Constants ────────────────────────────────────────────────────────────────

export const MEMBER_COLORS = [
  "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6", "#3498db",
  "#1abc9c", "#e67e22", "#e91e63", "#00bcd4", "#ff5722",
];

// Điểm đến cố định — HCMUS (227 Nguyễn Văn Cừ, Q5, TP.HCM)
const DEST = { lat: 10.7626, lng: 106.6822 };

// GPS tracking interval (ms)
const TRACKING_INTERVAL = 10000;

// ─── TripMapModal ─────────────────────────────────────────────────────────────
function TripMapModal({ trip, onClose }) {
  const mapRef     = useRef(null);
  const mapObjRef  = useRef(null);
  const markersRef = useRef({}); // { uid: vietmapgl.Marker }
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);

  const [mapReady, setMapReady]             = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [routeInfo, setRouteInfo]           = useState(null);
  const [loadingRoute, setLoadingRoute]     = useState(false);
  // memberTracking: { [uid]: { lat, lng, status, updated_at } }
  const [memberTracking, setMemberTracking] = useState({});

  const currentUid = auth.currentUser?.uid;
  const tripId     = trip.id;

  // ── 1. Push GPS của user hiện tại lên Firestore ───────────────────────────
  const pushTracking = useCallback(async (lat, lng) => {
    if (!currentUid || !tripId) return;
    try {
      const ref = doc(db, "trips", tripId, "members", currentUid);
      await setDoc(ref, {
        tracking: {
          lat,
          lng,
          updated_at: serverTimestamp(),
          status: "active",
        },
      }, { merge: true });
    } catch (err) {
      console.warn("[TripMapModal] pushTracking failed:", err);
    }
  }, [currentUid, tripId]);

  useEffect(() => {
    if (!currentUid || !tripId) return;

    // Cập nhật status = active ngay khi mở modal (trước khi có tọa độ)
    const ref = doc(db, "trips", tripId, "members", currentUid);
    setDoc(ref, { tracking: { status: "active", updated_at: serverTimestamp() } }, { merge: true })
      .catch((err) => console.warn("[TripMapModal] Failed to set active status on open:", err));

    if (!navigator.geolocation) return;

    // Lấy ngay lần đầu
    navigator.geolocation.getCurrentPosition(
      (pos) => pushTracking(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );

    // Watch liên tục
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => pushTracking(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      // Đặt status = no_share khi đóng modal
      setDoc(ref, { tracking: { status: "no_share", updated_at: serverTimestamp() } }, { merge: true })
        .catch(() => {});
    };
  }, [currentUid, tripId, pushTracking]);

  // ── 2. Subscribe realtime tracking của tất cả members ────────────────────
  useEffect(() => {
    if (!tripId) return;
    const colRef = collection(db, "trips", tripId, "members");
    const unsub = onSnapshot(colRef, (snap) => {
      const tracking = {};
      snap.forEach((d) => {
        const data = d.data();
        // Luôn lưu status nếu có, tọa độ là optional
        if (data.tracking) {
          tracking[d.id] = {
            lat:        data.tracking.lat ?? null,
            lng:        data.tracking.lng ?? null,
            status:     data.tracking.status || "no_share",
            updated_at: data.tracking.updated_at,
          };
        }
      });
      setMemberTracking(tracking);
    }, (err) => {
      console.warn("[TripMapModal] onSnapshot error:", err);
    });
    return () => unsub();
  }, [tripId]);

  // ── 3. Build members list với tọa độ thực hoặc fallback giả ──────────────
  const members = (trip.member_uids || []).map((uid, i) => {
    const t = memberTracking[uid];
    const hasRealGps = !!(t?.lat != null && t?.lng != null);
    // Fallback: vị trí giả xung quanh DEST nếu chưa có tracking
    const angle = (i / (trip.member_uids?.length || 1)) * 2 * Math.PI;
    const r     = 0.008 + (i % 3) * 0.005;
    return {
      id:     uid,
      name:   uid,
      avatar: uid.slice(0, 2).toUpperCase(),
      color:  MEMBER_COLORS[i % MEMBER_COLORS.length],
      lat:    hasRealGps ? t.lat : DEST.lat + Math.sin(angle) * r,
      lng:    hasRealGps ? t.lng : DEST.lng + Math.cos(angle) * r,
      hasRealGps,
      status: t?.status || "no_share",
      isMe:   uid === currentUid,
    };
  });

  // ── 4. Init map ───────────────────────────────────────────────────────────
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
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};
      if (mapObjRef.current) { mapObjRef.current.remove(); mapObjRef.current = null; }
    };
  }, []);

  // ── 5. Update markers khi tracking thay đổi ───────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapObjRef.current || !window.vietmapgl) return;
    const map = mapObjRef.current;

    // Đặt/cập nhật marker điểm đến (chỉ 1 lần)
    if (!markersRef.current["__dest__"]) {
      const destEl = document.createElement("div");
      destEl.style.cssText = `width:40px;height:40px;border-radius:50%;background:#255dad;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:20px;`;
      destEl.innerHTML = "🏁";
      destEl.title = "HCMUS — Điểm đến";
      markersRef.current["__dest__"] = new window.vietmapgl.Marker({ element: destEl, anchor: "center" })
        .setLngLat([DEST.lng, DEST.lat])
        .addTo(map);
    }

    // Cập nhật marker từng member
    members.forEach((m) => {
      if (markersRef.current[m.id]) {
        // Di chuyển marker đến vị trí mới
        markersRef.current[m.id].setLngLat([m.lng, m.lat]);
      } else {
        // Tạo marker mới
        const el = document.createElement("div");
        const pulse = m.isMe ? `box-shadow:0 0 0 4px ${m.color}44,0 2px 8px rgba(0,0,0,0.3);` : `box-shadow:0 2px 8px rgba(0,0,0,0.3);`;
        el.style.cssText = `width:36px;height:36px;border-radius:50%;background:${m.color};border:3px solid white;${pulse}display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;cursor:pointer;transition:transform 0.2s;`;
        el.innerHTML = m.avatar;
        el.title = m.isMe ? `${m.name} (bạn)` : m.name;
        el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.2)"; });
        el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });
        el.addEventListener("click", () => handleMemberClick(m));
        markersRef.current[m.id] = new window.vietmapgl.Marker({ element: el, anchor: "center" })
          .setLngLat([m.lng, m.lat])
          .addTo(map);
      }
    });

    // Fit bounds bao gồm tất cả markers
    const all  = [[DEST.lng, DEST.lat], ...members.map((m) => [m.lng, m.lat])];
    const lngs = all.map((p) => p[0]);
    const lats  = all.map((p) => p[1]);
    map.fitBounds(
      [[Math.min(...lngs) - 0.005, Math.min(...lats) - 0.005], [Math.max(...lngs) + 0.005, Math.max(...lats) + 0.005]],
      { padding: 60, duration: 800, maxZoom: 16 }
    );
  }, [mapReady, memberTracking]);

  // ── 6. Route ──────────────────────────────────────────────────────────────
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
      setRouteInfo({ distKm: (route.distance / 1000).toFixed(1), timeMin: Math.round(route.duration / 60), memberName: member.name, hasRealGps: member.hasRealGps });

      const lngs = coords.map((c) => c[0]);
      const lats  = coords.map((c) => c[1]);
      map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 60, duration: 800 });
    } catch {
      // Fallback: đường thẳng
      if (!map.getSource("route")) {
        map.addSource("route", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: [[member.lng, member.lat], [DEST.lng, DEST.lat]] } } });
        map.addLayer({ id: "route-line", type: "line", source: "route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": member.color, "line-width": 3, "line-dasharray": [2, 2] } });
      }
      const R      = 6371;
      const dLat   = (DEST.lat - member.lat) * Math.PI / 180;
      const dLng   = (DEST.lng - member.lng) * Math.PI / 180;
      const a      = Math.sin(dLat / 2) ** 2 + Math.cos(member.lat * Math.PI / 180) * Math.cos(DEST.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
      const distKm = (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
      setRouteInfo({ distKm, timeMin: Math.round(distKm / 0.5), memberName: member.name, hasRealGps: member.hasRealGps });
    } finally {
      setLoadingRoute(false);
    }
  };

  // ── Status badge ──────────────────────────────────────────────────────────
  const statusLabel = {
    active:            { text: "Đang di chuyển", color: "text-green-600" },
    lost_signal:       { text: "Mất tín hiệu",   color: "text-yellow-600" },
    wrong_direction:   { text: "Sai hướng",       color: "text-red-500" },
    arrived:           { text: "Đã đến",          color: "text-blue-600" },
    left:              { text: "Đã rời",           color: "text-gray-400" },
    no_share:          { text: "Không chia sẻ",   color: "text-gray-400" },
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
                {trip.title} · Điểm đến: <span className="text-primary font-semibold">HCMUS</span>
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors">✕</button>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Member list */}
            <div className="w-52 shrink-0 border-r border-gray-100 flex flex-col">
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
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        selectedMember?.id === m.id ? "bg-primary/10" : "hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 relative"
                        style={{ background: m.color }}
                      >
                        {m.avatar}
                        {/* Dot GPS thực */}
                        {m.hasRealGps && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-sm truncate ${selectedMember?.id === m.id ? "font-semibold text-primary" : "text-gray-700"}`}>
                          {m.isMe ? "Bạn" : m.name.slice(0, 10) + "..."}
                        </span>
                        <span className={`text-[10px] ${sl.color}`}>{sl.text}</span>
                      </div>
                    </button>
                  );
                })}
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
                      <p className="text-xs font-semibold text-gray-700 truncate">
                        {routeInfo.memberName === currentUid ? "Bạn" : routeInfo.memberName.slice(0, 12) + "..."}
                      </p>
                      <p className="text-xs text-gray-500">📍 {routeInfo.distKm} km</p>
                      <p className="text-xs text-gray-500">⏱ ~{routeInfo.timeMin} phút</p>
                      {!routeInfo.hasRealGps && (
                        <p className="text-[10px] text-yellow-500">⚠ Vị trí ước tính</p>
                      )}
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
