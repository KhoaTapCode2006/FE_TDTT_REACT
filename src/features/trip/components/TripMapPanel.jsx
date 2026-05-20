import { useState, useRef, useEffect, useCallback } from "react";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import { useTripMembers } from "../hooks/useTripMembers";
import { useAccidentAlert } from "../hooks/useAccidentAlert";
import { MEMBER_COLORS } from "./modals/TripMapModal";
import FakeGpsControl from "./FakeGpsControl";
import { trackingState } from "../../../services/trip/trackingState";

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
  offline:         { text: "Offline",          color: "text-gray-400" },};

export default function TripMapPanel({ trip, onFakeStart, onFakeStop, onStopSharing }) {
  const mapRef     = useRef(null);
  const mapObjRef  = useRef(null);
  const markersRef = useRef({});
  const watchIdRef = useRef(null);

  const [mapReady, setMapReady]             = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [routeInfoMap, setRouteInfoMap]     = useState({});
  const [loadingRoutes, setLoadingRoutes]   = useState(false);
  const [distToDestM, setDistToDestM]       = useState(null);
  const [fakeActive, setFakeActive]         = useState(false);
  const [myRealPos, setMyRealPos]           = useState(null); // { lat, lng }

  const hasInitialFitRef = useRef(false);
  const currentUid  = auth.currentUser?.uid;
  const tripId      = trip?.id;
  const isActive    = trip?.status === "active";

  const { members: firestoreMembers } = useTripMembers(tripId ?? null);

  // Chỉ alert accident khi trip đang active
  useAccidentAlert(isActive ? firestoreMembers : [], currentUid);

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

  const stoppedSharingRef = useRef(false); // true khi user chủ động ngưng chia sẻ

  // ── Push GPS ──────────────────────────────────────────────────────────────
  const pushTracking = useCallback(async (lat, lng) => {
    if (!currentUid || !tripId) return;
    if (stoppedSharingRef.current || trackingState.isLoggedOut()) {
      console.log("[TripMapPanel] pushTracking BLOCKED");
      return;
    }
    console.log("[TripMapPanel] pushTracking lat:", lat, "lng:", lng);
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
    if (!navigator.geolocation) return;

    // Nếu đang fake GPS thì không watch GPS thực
    if (fakeActive) return;

    // Nếu user đã chủ động ngưng chia sẻ thì không restart GPS
    if (stoppedSharingRef.current) {
      console.log("[TripMapPanel] GPS effect SKIPPED — stoppedSharingRef=true");
      return;
    }

    console.log("[TripMapPanel] GPS effect STARTING — fakeActive:", fakeActive);

    const ref = doc(db, "trips", tripId, "members", currentUid);
    setDoc(ref, { tracking: { status: "active", updated_at: serverTimestamp() } }, { merge: true }).catch(() => {});

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log("[TripMapPanel] getCurrentPosition callback — stopped:", stoppedSharingRef.current);
        setMyRealPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        pushTrackingRef.current?.(pos.coords.latitude, pos.coords.longitude);
      },
      () => {}, { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        console.log("[TripMapPanel] watchPosition callback — stopped:", stoppedSharingRef.current);
        setMyRealPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        pushTrackingRef.current?.(pos.coords.latitude, pos.coords.longitude);
      },
      () => {}, { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    return () => {
      console.log("[TripMapPanel] GPS effect cleanup — fakeActive:", fakeActive, "stopped:", stoppedSharingRef.current);
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      // Chỉ set no_share khi rời trang thật (không phải khi chuyển sang fake/stop)
      // stoppedSharingRef và fakeActive sẽ tự xử lý các trường hợp đó
      if (!stoppedSharingRef.current && !fakeActive) {
        updateDoc(ref, {
          // Không xóa lat/lng vì Firestore rules yêu cầu chúng là number
          "tracking.status":     "no_share",
          "tracking.updated_at": serverTimestamp(),
        }).catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUid, tripId, fakeActive]);

  // ── Build members ─────────────────────────────────────────────────────────
  // Khi trip chưa active: chỉ hiển thị bản thân
  // Khi active: hiển thị tất cả members
  const visibleFirestoreMembers = isActive
    ? firestoreMembers
    : firestoreMembers.filter((m) => m.uid === currentUid);

  // allMembers: dùng cho sidebar — hiện tất cả member đã từng có tracking (kể cả no_share)
  const allMembers = visibleFirestoreMembers
    .map((m, i) => {
      const t = memberTracking[m.uid];
      const hasRealGps = !!(t?.lat != null && t?.lng != null);
      const displayName = m.display_name ?? m.username ?? m.uid;
      return {
        id:     m.uid,
        name:   displayName,
        avatar: displayName.slice(0, 2).toUpperCase(),
        avatar_url: m.avatar_url ?? null,
        color:  MEMBER_COLORS[i % MEMBER_COLORS.length],
        lat:    hasRealGps ? t.lat : null,
        lng:    hasRealGps ? t.lng : null,
        hasRealGps,
        status:   t?.status || "no_share",
        accident: t?.accident === true,
        isMe:     m.uid === currentUid,
      };
    })
    .filter((m) => m.status !== "no_share" || m.isMe); // sidebar: luôn hiện bản thân, ẩn người khác nếu no_share

  // members: dùng cho map markers — chỉ member đang active có GPS
  const members = allMembers.filter((m) => m.hasRealGps && m.status !== "no_share");

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
      hasInitialFitRef.current = false;
      if (mapObjRef.current) { mapObjRef.current.remove(); mapObjRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  // ── Helper: build marker DOM element ─────────────────────────────────────
  const buildMarkerEl = useCallback((m, onClickFn) => {
    // Wrapper bao ngoài để chứa cả ping rings + avatar circle
    const wrapper = document.createElement("div");
    wrapper.className = "accident-marker-wrapper";
    wrapper.title = m.isMe ? `${m.name} (bạn)` : m.name;

    // Avatar circle (inner)
    const inner = document.createElement("div");
    const bg    = m.accident ? "#dc2626" : m.color;
    const pulse = m.isMe
      ? `box-shadow:0 0 0 4px ${m.color}44,0 2px 8px rgba(0,0,0,0.3);`
      : `box-shadow:0 2px 8px rgba(0,0,0,0.3);`;
    inner.style.cssText = `position:relative;z-index:1;width:36px;height:36px;border-radius:50%;background:${bg};border:3px solid white;${pulse}display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;cursor:pointer;transition:transform 0.2s,background 0.3s;`;
    inner.innerHTML = m.avatar;

    // Ping rings — chỉ khi accident
    if (m.accident) {
      const ring1 = document.createElement("div");
      ring1.className = "accident-ping-ring";
      const ring2 = document.createElement("div");
      ring2.className = "accident-ping-ring";
      wrapper.appendChild(ring1);
      wrapper.appendChild(ring2);
    }

    wrapper.appendChild(inner);

    inner.addEventListener("mouseenter", () => { inner.style.transform = "scale(1.2)"; });
    inner.addEventListener("mouseleave", () => { inner.style.transform = "scale(1)"; });
    wrapper.addEventListener("click", onClickFn);

    return wrapper;
  }, []);

  // ── Helper: sync existing marker element to current accident state ────────
  const syncMarkerEl = useCallback((el, m) => {
    // el là wrapper; inner là child cuối (avatar circle)
    const inner = el.querySelector("div[style]") ?? el.lastElementChild;
    if (!inner) return;

    const bg = m.accident ? "#dc2626" : m.color;
    inner.style.background = bg;
    inner.innerHTML = m.avatar;

    // Thêm / xóa ping rings
    const existingRings = el.querySelectorAll(".accident-ping-ring");
    if (m.accident && existingRings.length === 0) {
      const ring1 = document.createElement("div");
      ring1.className = "accident-ping-ring";
      const ring2 = document.createElement("div");
      ring2.className = "accident-ping-ring";
      el.insertBefore(ring2, inner);
      el.insertBefore(ring1, ring2);
    } else if (!m.accident) {
      existingRings.forEach((r) => r.remove());
    }
  }, []);

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

    // Xóa marker của member không còn trong danh sách (ngưng chia sẻ / rời trip)
    const activeMemberIds = new Set(members.filter((m) => m.status !== "no_share").map((m) => m.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (id === "__dest__") return;
      if (!activeMemberIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
        // Xóa route line tương ứng
        const layerId  = `route-line-${id}`;
        const sourceId = `route-${id}`;
        if (map.getLayer(layerId))   map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      }
    });

    members.forEach((m) => {
      // Không render marker cho member đang no_share
      if (m.status === "no_share") return;
      if (markersRef.current[m.id]) {
        markersRef.current[m.id].setLngLat([m.lng, m.lat]);
        const el = markersRef.current[m.id].getElement();
        if (el) syncMarkerEl(el, m);
      } else {
        const el = buildMarkerEl(m, () => handleMemberClick(m));
        markersRef.current[m.id] = new window.vietmapgl.Marker({ element: el, anchor: "center" })
          .setLngLat([m.lng, m.lat]).addTo(map);
      }
    });

    // fitBounds chỉ chạy một lần khi map load xong lần đầu
    // Sau đó user tự zoom/pan, không reset nữa
    if (!hasInitialFitRef.current) {
      hasInitialFitRef.current = true;
      const all  = [[DEST.lng, DEST.lat], ...members.map((m) => [m.lng, m.lat])];
      const lngs = all.map((p) => p[0]);
      const lats  = all.map((p) => p[1]);
      map.fitBounds(
        [[Math.min(...lngs) - 0.005, Math.min(...lats) - 0.005], [Math.max(...lngs) + 0.005, Math.max(...lats) + 0.005]],
        { padding: 60, duration: 800, maxZoom: 16 }
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, memberTracking]);

  // Dọn routeInfoMap khi member ngưng chia sẻ (không còn trong members)
  useEffect(() => {
    const activeMemberIds = new Set(members.filter((m) => m.status !== "no_share").map((m) => m.id));
    setRouteInfoMap((prev) => {
      const next = { ...prev };
      let changed = false;
      Object.keys(next).forEach((id) => {
        if (!activeMemberIds.has(id)) { delete next[id]; changed = true; }
      });
      return changed ? next : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberTracking]);

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

  // Key bao gồm cả tọa độ để trigger lại khi GPS cập nhật lần đầu
  const memberGpsKey = members.map((m) => `${m.id}:${m.lat?.toFixed(5)},${m.lng?.toFixed(5)}`).join("|");
  useEffect(() => {
    if (!mapReady || members.length === 0) return;
    loadAllRoutes(members);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, memberGpsKey]);

  // Khi fake GPS active: redraw route mỗi khi memberTracking thay đổi
  // (vị trí fake được push lên Firestore → useTripMembers cập nhật → memberTracking thay đổi)
  const memberTrackingKey = Object.entries(memberTracking)
    .map(([uid, t]) => `${uid}:${t.lat?.toFixed(6)},${t.lng?.toFixed(6)}`)
    .join("|");
  useEffect(() => {
    if (!mapReady || !fakeActive || members.length === 0) return;
    loadAllRoutes(members);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, fakeActive, memberTrackingKey]);

  // ── Accident / Arrive ─────────────────────────────────────────────────────
  const meAccident = allMembers.find((m) => m.isMe)?.accident === true;
  const meArrived  = allMembers.find((m) => m.isMe)?.status === "arrived";
  const canArrive  = distToDestM !== null && distToDestM < 500;

  const handleAccident = useCallback(async () => {
    if (!currentUid || !tripId) return;
    try {
      await setDoc(doc(db, "trips", tripId, "members", currentUid), { tracking: { accident: !meAccident, updated_at: serverTimestamp() } }, { merge: true });
    } catch (err) { console.warn("[TripMapPanel] handleAccident failed:", err); }
  }, [currentUid, tripId, meAccident]);

  const handleArrive = useCallback(async () => {
    if (!currentUid || !tripId) return;
    try {
      await setDoc(doc(db, "trips", tripId, "members", currentUid), { tracking: { status: "arrived", updated_at: serverTimestamp() } }, { merge: true });
    } catch (err) { console.warn("[TripMapPanel] handleArrive failed:", err); }
  }, [currentUid, tripId]);

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
      <div className="w-64 shrink-0 border-r border-gray-100 flex flex-col">
        {/* Trip status + actions */}
        <div className="px-4 pt-3 pb-3 border-b border-gray-100">

          {/* Badge trạng thái trip */}
          {!isActive && (
            <div className="mt-2 flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-lg px-2.5 py-1.5">
              <span className="text-xs text-yellow-700 font-medium">
                {trip.status === "ended" ? "Chuyến đi đã kết thúc" : "Chờ chủ chuyến đi bắt đầu"}
              </span>
            </div>
          )}

          {/* Nút Accident + Arrive — chỉ khi active */}
          {isActive && allMembers.some((m) => m.isMe) && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAccident}
                className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-colors ${meAccident ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-red-500 hover:bg-red-600 text-white"}`}
              >
                {meAccident ? "🚨 Hủy báo" : "🚨 Báo tai nạn"}
              </button>
              <button
                onClick={handleArrive}
                disabled={!canArrive || meArrived}
                title={!canArrive ? `Cần đến gần hơn (${distToDestM != null ? Math.round(distToDestM) + "m" : "?"})` : ""}
                className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-colors ${meArrived ? "bg-blue-100 text-blue-400 cursor-not-allowed" : canArrive ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
              >
                🏁 Đã đến
              </button>
            </div>
          )}
        </div>

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 pt-3 pb-2">
          {isActive ? `Thành viên (${allMembers.length})` : "Vị trí của bạn"}
        </p>
        <div className="flex-1 overflow-y-auto">
          {allMembers.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-gray-400">
              <span className="block text-2xl mb-2">📡</span>
              {isActive ? "Chưa có thành viên nào chia sẻ vị trí" : "Đang chờ GPS của bạn..."}
            </div>
          )}
          {allMembers.map((m) => {
            const sl   = statusLabel[m.status] || statusLabel.no_share;
            const info = routeInfoMap[m.id];
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
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`text-sm truncate ${selectedMember?.id === m.id ? "font-semibold text-primary" : m.accident ? "font-semibold text-red-600" : "text-gray-700"}`}>
                    {m.isMe ? "Bạn" : m.name}
                  </span>
                  <span className={`text-[10px] ${m.accident ? "text-red-500" : sl.color}`}>
                    {m.accident ? "Tai nạn" : sl.text}
                  </span>
                </div>
                {/* Route info — bên phải */}
                <div className="shrink-0 flex flex-col items-end gap-0.5">
                  {loadingRoutes ? (
                    <span className="text-[10px] text-gray-300">...</span>
                  ) : info ? (
                    <>
                      <span className="text-[10px] text-gray-500 font-medium">{info.distKm} km</span>
                      <span className="text-[10px] text-gray-400">⏱ ~{info.timeMin} ph</span>
                      {!info.hasRealGps && <span className="text-[9px] text-yellow-500">⚠</span>}
                    </>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

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
        {/* Fake GPS control — chỉ hiện khi trip active */}
        {isActive && (
          <FakeGpsControl
            tripId={tripId}
            initialLat={myRealPos?.lat ?? members.find((m) => m.isMe)?.lat}
            initialLng={myRealPos?.lng ?? members.find((m) => m.isMe)?.lng}
            onActivate={() => {
              stoppedSharingRef.current = false;
              setFakeActive(true);
              onFakeStart?.();
            }}
            onStop={() => { setFakeActive(false); onFakeStop?.(); }}
            onStopSharing={async (tid) => {
              // Clear watch GPS của TripMapPanel ngay lập tức
              stoppedSharingRef.current = true;
              if (watchIdRef.current != null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
              }
              await onStopSharing?.(tid);
            }}
          />
        )}
      </div>
    </div>
  );
}
