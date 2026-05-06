import { useState, useRef, useEffect } from "react";
import { MOCK_TRIPS } from "../services/backend/trip.service";

const NAV_ITEMS = [
  { id: "all",     label: "All Trips", icon: "🗺️" },
  { id: "waiting", label: "Waiting",   icon: "⏳" },
  { id: "active",  label: "Active",    icon: "🟢" },
  { id: "ended",   label: "Ended",     icon: "🏁" },
];

// ─── Trip Card ────────────────────────────────────────────────────────────────

function TripCard({ trip, onDelete, onEdit, onView, onInfo, onAddMember }) {
  const isEnded = trip.status === "ended";

  // Lấy member_uids trực tiếp từ trip data
  const memberUids = Array.isArray(trip.member_uids) ? trip.member_uids : [];
  const memberCount = memberUids.length;
  const showMax = 3;
  const visibleUids = memberUids.slice(0, showMax);
  const extraCount = Math.max(0, memberCount - showMax);

  const badgeStyle = {
    waiting: "bg-yellow-100 text-yellow-800",
    active:  "bg-green-100 text-green-800",
    ended:   "bg-gray-800/70 text-white",
  };

  const badgeLabel = {
    waiting: "Waiting",
    active:  "Active",
    ended:   "Ended",
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col" style={{ minHeight: "200px" }}>
      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${badgeStyle[trip.status]}`}>
              {badgeLabel[trip.status]}
            </span>
            <h3 className={`font-semibold text-gray-900 text-base truncate ${isEnded ? "text-gray-500" : ""}`}>
              {trip.title}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => onInfo(trip)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors" title="Info">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </button>
            <button onClick={() => onView(trip)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors" title="View map">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button onClick={() => onEdit(trip)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(trip.id)}
              className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2 flex-1">{trip.description}</p>

        {/* Date */}
        <div className={`flex items-center gap-2 text-xs mb-2 ${isEnded ? "text-gray-400 line-through" : "text-gray-500"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {trip.dateRange}
        </div>

        {/* Members */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {memberCount} Members
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddMember(trip)}
              className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors text-base leading-none"
              title="Add member"
            >
              +
            </button>
            <div className="flex items-center">
              {visibleUids.map((uid, i) => (
                <div
                  key={uid}
                  className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length], marginLeft: i > 0 ? "-8px" : "0" }}
                  title={uid}
                >
                  {uid.slice(0, 2).toUpperCase()}
                </div>
              ))}
              {extraCount > 0 && (
                <div
                  className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600"
                  style={{ marginLeft: "-8px" }}
                >
                  +{extraCount}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Member Modal ────────────────────────────────────────────────────────

function AddMemberModal({ trip, onClose, onAdd }) {
  const [uid, setUid] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    if (!uid.trim()) return;
    onAdd(trip.id, uid.trim());
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Add Member</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors">✕</button>
          </div>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">User UID</label>
              <input
                autoFocus
                type="text"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="e.g. uid_john_001"
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
              />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={!uid.trim()}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── New Trip Card ────────────────────────────────────────────────────────────

function NewTripCard({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-blue-50/60 border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center gap-3 h-full min-h-[340px] hover:bg-blue-50 hover:border-blue-300 transition-colors group"
    >
      <div className="w-12 h-12 rounded-full border-2 border-blue-300 flex items-center justify-center text-blue-400 text-2xl group-hover:border-blue-400 group-hover:text-blue-500 transition-colors">
        +
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700">Start a new journey</p>
        <p className="text-xs text-gray-400 mt-0.5">Collaborate with your group today</p>
      </div>
    </button>
  );
}

// ─── Trip Map Modal ───────────────────────────────────────────────────────────

const MEMBER_COLORS = [
  "#e74c3c","#2ecc71","#f39c12","#9b59b6","#3498db",
  "#1abc9c","#e67e22","#e91e63","#00bcd4","#ff5722",
];


// Tọa độ điểm đến mặc định (HCMC)
const DEST = { lat: 10.7719, lng: 106.6983 };

function generateLocations(members) {
  return members.map((m, i) => {
    const angle = (i / members.length) * 2 * Math.PI;
    const r = 0.008 + (i % 3) * 0.005;
    return { ...m, lat: DEST.lat + Math.sin(angle) * r, lng: DEST.lng + Math.cos(angle) * r, color: MEMBER_COLORS[i % MEMBER_COLORS.length] };
  });
}

function TripMapModal({ trip, onClose }) {
  const mapRef = useRef(null);
  const mapObjRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const rawMembers = (trip.member_uids || []).map((uid, i) => ({
    id: i + 1,
    name: uid,
    avatar: uid.slice(0, 2).toUpperCase(),
  }));
  const members = generateLocations(rawMembers);

  useEffect(() => {
    if (!mapRef.current || mapObjRef.current) return;
    const init = () => {
      if (!window.vietmapgl) { setTimeout(init, 300); return; }
      const map = new window.vietmapgl.Map({
        container: mapRef.current,
        style: `https://maps.vietmap.vn/maps/styles/dm/style.json?apikey=6033c4efaa0e172ca5cb9ebc5c9d394da9a38466072ce84e`,
        center: [DEST.lng, DEST.lat], zoom: 13, antialias: true,
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
    markersRef.current.push(new window.vietmapgl.Marker({ element: destEl, anchor: "center" }).setLngLat([DEST.lng, DEST.lat]).addTo(map));

    // Thành viên
    members.forEach((m) => {
      const el = document.createElement("div");
      el.style.cssText = `width:36px;height:36px;border-radius:50%;background:${m.color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;cursor:pointer;transition:transform 0.2s;`;
      el.innerHTML = m.avatar;
      el.title = m.name;
      el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.2)"; });
      el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });
      el.addEventListener("click", () => handleMemberClick(m));
      markersRef.current.push(new window.vietmapgl.Marker({ element: el, anchor: "center" }).setLngLat([m.lng, m.lat]).addTo(map));
    });

    const all = [[DEST.lng, DEST.lat], ...members.map((m) => [m.lng, m.lat])];
    const lngs = all.map((p) => p[0]), lats = all.map((p) => p[1]);
    map.fitBounds([[Math.min(...lngs)-0.01, Math.min(...lats)-0.01],[Math.max(...lngs)+0.01, Math.max(...lats)+0.01]], { padding: 50, duration: 800 });
  }, [mapReady]);

  const handleMemberClick = async (member) => {
    if (!mapObjRef.current || !mapReady) return;
    setSelectedMember(member); setLoadingRoute(true); setRouteInfo(null);
    const map = mapObjRef.current;
    if (map.getLayer("route-line")) map.removeLayer("route-line");
    if (map.getSource("route")) map.removeSource("route");

    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${member.lng},${member.lat};${DEST.lng},${DEST.lat}?overview=full&geometries=geojson`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const route = data?.routes?.[0];
      const coords = route?.geometry?.coordinates;
      if (!coords?.length) throw new Error();

      map.addSource("route", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: coords } } });
      map.addLayer({ id: "route-line", type: "line", source: "route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": member.color, "line-width": 4, "line-opacity": 0.85 } });
      setRouteInfo({ distKm: (route.distance/1000).toFixed(1), timeMin: Math.round(route.duration/60), memberName: member.name });
      const lngs = coords.map((c)=>c[0]), lats = coords.map((c)=>c[1]);
      map.fitBounds([[Math.min(...lngs),Math.min(...lats)],[Math.max(...lngs),Math.max(...lats)]], { padding: 60, duration: 800 });
    } catch {
      if (!map.getSource("route")) {
        map.addSource("route", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: [[member.lng,member.lat],[DEST.lng,DEST.lat]] } } });
        map.addLayer({ id: "route-line", type: "line", source: "route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": member.color, "line-width": 3, "line-dasharray": [2,2] } });
      }
      const R=6371, dLat=(DEST.lat-member.lat)*Math.PI/180, dLng=(DEST.lng-member.lng)*Math.PI/180;
      const a=Math.sin(dLat/2)**2+Math.cos(member.lat*Math.PI/180)*Math.cos(DEST.lat*Math.PI/180)*Math.sin(dLng/2)**2;
      const distKm=(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(1);
      setRouteInfo({ distKm, timeMin: Math.round(distKm/0.5), memberName: member.name });
    } finally { setLoadingRoute(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col" style={{ height: "560px" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <div>
              <h3 className="text-base font-bold text-gray-900">Trip — Tuyến đường</h3>
              <p className="text-xs text-gray-500 mt-0.5">{trip.title} · Điểm đến: <span className="text-primary font-semibold">{trip.title}</span></p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors">✕</button>
          </div>
          <div className="flex flex-1 min-h-0">
            <div className="w-48 shrink-0 border-r border-gray-100 flex flex-col">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 pt-3 pb-2">Thành viên ({members.length})</p>
              <div className="flex-1 overflow-y-auto">
                {members.map((m) => (
                  <button key={m.id} onClick={() => handleMemberClick(m)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${selectedMember?.id === m.id ? "bg-primary/10" : "hover:bg-gray-50"}`}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: m.color }}>{m.avatar}</div>
                    <span className={`text-sm truncate ${selectedMember?.id === m.id ? "font-semibold text-primary" : "text-gray-700"}`}>{m.name.split(" ").slice(-1)[0]}</span>
                  </button>
                ))}
              </div>
              {(routeInfo || loadingRoute) && (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                  {loadingRoute ? (
                    <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /><span className="text-xs text-gray-500">Đang tính...</span></div>
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
            <div className="flex-1 relative">
              <div ref={mapRef} className="absolute inset-0 w-full h-full rounded-br-2xl" />
              {!mapReady && <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-br-2xl"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
              {mapReady && !selectedMember && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow text-xs text-gray-600 font-medium">Chọn thành viên để xem tuyến đường</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Trip Info Modal ──────────────────────────────────────────────────────────

function TripInfoModal({ trip, onClose, onRemoveMember }) {
  const badgeStyle = { waiting: "bg-yellow-100 text-yellow-800", active: "bg-green-100 text-green-800", ended: "bg-gray-200 text-gray-700" };
  const badgeLabel = { waiting: "Waiting", active: "Active", ended: "Ended" };

  const memberUids = Array.isArray(trip.member_uids) ? trip.member_uids : [];

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    const date = iso.slice(0, 10);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return `${date}  ${hh} : ${mm}`;
  };

  const rows = [
    { label: "id",          value: trip.id },
    { label: "owner_uid",   value: trip.owner_uid || "—" },
    { label: "name",        value: trip.title },
    { label: "place_id",    value: trip.place_id || "—" },
    { label: "start_at",    value: fmtDate(trip.dateFrom) },
    { label: "end_at",      value: fmtDate(trip.dateTo) },
    { label: "status",      value: <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeStyle[trip.status]}`}>{badgeLabel[trip.status]}</span> },
    {
      label: "member_uids",
      value: memberUids.length > 0 ? (
        <div className="flex flex-col gap-2">
          {memberUids.map((uid, i) => (
            <div key={uid} className="flex items-center gap-2.5 group">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length] }}
              >
                {uid.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm text-gray-700 font-mono flex-1">{uid}</span>
              <button
                onClick={() => onRemoveMember(trip.id, uid)}
                className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                title="Remove member"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : "—",
    },
    { label: "created_at",  value: fmtDate(trip.created_at) },
    { label: "updated_at",  value: fmtDate(trip.updated_at) },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Trip Info</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors">✕</button>
          </div>
          <div className="flex flex-col divide-y divide-gray-100">
            {rows.map((row) => (
              <div key={row.label} className="flex items-start gap-4 py-3">
                <span className="text-sm font-semibold text-gray-600 w-28 shrink-0 pt-0.5 capitalize">{row.label.replace(/_/g, " ")}</span>
                <span className="text-sm text-gray-800 break-all">{row.value}</span>
              </div>
            ))}
          </div>
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Edit Trip Modal ──────────────────────────────────────────────────────────

function EditTripModal({ trip, onClose, onSave }) {
  const [title, setTitle] = useState(trip.title);
  const [placeId, setPlaceId] = useState(trip.description ?? "");
  const [status, setStatus] = useState(trip.status);
  const [dateFrom, setDateFrom] = useState(trip.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(trip.dateTo ?? "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ ...trip, title: title.trim(), description: placeId.trim(), status, dateFrom, dateTo,
      dateRange: dateFrom && dateTo ? `${dateFrom} - ${dateTo}` : trip.dateRange,
    });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 flex flex-col gap-6">
          <h3 className="text-base font-bold text-gray-900">Edit Trip</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Trip Name */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-900">Trip Name</label>
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
              />
            </div>

            {/* Place ID */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-900">Place ID</label>
              <input
                type="text"
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value)}
                placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
                maxLength={300}
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-900">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
              >
                <option value="waiting">⏳ Waiting — Chưa bắt đầu</option>
                <option value="active">🟢 Active — Đang diễn ra</option>
                <option value="ended">🏁 Ended — Đã kết thúc</option>
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900">Start Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900">End Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6 pt-1">
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-8 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-semibold text-blue-500 hover:text-blue-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── Create Trip Modal ────────────────────────────────────────────────────────

function CreateTripModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({ title: title.trim(), description: description.trim(), dateFrom, dateTo });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Trip Name */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-900">Trip Name</label>
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Amalfi Coast Expedition"
                maxLength={60}
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
              />
            </div>

            {/* Place ID */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-900">Place ID</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
                maxLength={300}
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900">Start Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900">End Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6 pt-1">
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-8 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Create Trip
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-semibold text-blue-500 hover:text-blue-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TripPage() {
  const [activeNav, setActiveNav] = useState("all");
  const [trips, setTrips] = useState(MOCK_TRIPS);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [viewingTrip, setViewingTrip] = useState(null);
  const [infoTripId, setInfoTripId] = useState(null);
  const [addMemberTrip, setAddMemberTrip] = useState(null);

  const infoTrip = infoTripId ? trips.find((t) => t.id === infoTripId) ?? null : null;

  const filtered = trips.filter((t) => {
    const matchNav = activeNav === "all" || t.status === activeNav;
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    return matchNav && matchSearch;
  });

  const handleCreate = ({ title, description, dateFrom, dateTo }) => {
    const newTrip = {
      id: Date.now(),
      title,
      description: description || "No description provided.",
      status: "waiting",
      dateRange: dateFrom && dateTo ? `${dateFrom} - ${dateTo}` : "TBD",
      members: 1,
      avatars: ["https://i.pravatar.cc/32?img=10"],
      extra: 0,
    };
    setTrips((prev) => [newTrip, ...prev]);
  };

  const handleDelete = (id) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveEdit = (updated) => {
    setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleAddMember = (tripId, uid) => {
    setTrips((prev) => prev.map((t) =>
      t.id === tripId
        ? { ...t, member_uids: [...(t.member_uids || []), uid] }
        : t
    ));
  };

  const handleRemoveMember = (tripId, uid) => {
    setTrips((prev) => prev.map((t) =>
      t.id === tripId
        ? { ...t, member_uids: (t.member_uids || []).filter((u) => u !== uid) }
        : t
    ));
  };

  return (
    <div className="flex h-screen bg-gray-50 font-body overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 bg-white border-r border-gray-100 flex flex-col py-6 px-4 shrink-0">
        {/* Brand */}
        <div className="mb-8 px-2">
          <p className="text-base font-bold text-gray-900">Trip</p>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                activeNav === item.id
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Create button */}
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 bg-gray-900 text-white text-sm font-semibold py-3 rounded-xl hover:bg-gray-700 transition-colors mt-4"
        >
          <span className="text-lg leading-none">+</span>
          Create New Trip
        </button>

      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="grid grid-cols-2 gap-5 items-stretch">
            {filtered.map((trip) => (
              <TripCard key={trip.id} trip={trip} onDelete={handleDelete} onEdit={setEditingTrip} onView={setViewingTrip} onInfo={(t) => setInfoTripId(t.id)} onAddMember={setAddMemberTrip} />
            ))}
          </div>
        </div>
      </div>

      {addMemberTrip && (
        <AddMemberModal trip={addMemberTrip} onClose={() => setAddMemberTrip(null)} onAdd={handleAddMember} />
      )}

      {infoTrip && (
        <TripInfoModal trip={infoTrip} onClose={() => setInfoTripId(null)} onRemoveMember={handleRemoveMember} />
      )}

      {viewingTrip && (
        <TripMapModal trip={viewingTrip} onClose={() => setViewingTrip(null)} />
      )}

      {showCreate && (
        <CreateTripModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}

      {editingTrip && (
        <EditTripModal
          trip={editingTrip}
          onClose={() => setEditingTrip(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}