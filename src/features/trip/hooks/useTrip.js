// ─── useTrip ───────────────────────────────────────────────────────────────────
// Quản lý toàn bộ state và business logic của Trip feature:
// danh sách trips, filter theo nav/search, tạo/sửa/xóa trip, thêm/xóa member,
// và trạng thái mở/đóng các modal.

import { useState, useEffect, useCallback, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { tripService, normalizeTripData } from "../../../services/backend/trip.service";
import { useAuth } from "../../../contexts/AuthContext";

export const NAV_ITEMS = [
  { id: "info",    label: "Thông tin" },
  { id: "member",  label: "Thành viên" },
];

export function useTrip() {
  const { loading: authLoading, isAuthenticated, user } = useAuth();

  const [activeNav, setActiveNav]         = useState("info");
  const [trips, setTrips]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [search, setSearch]               = useState("");
  const [showCreate, setShowCreate]       = useState(false);
  const [editingTrip, setEditingTrip]     = useState(null);
  const [viewingTrip, setViewingTrip]     = useState(null);
  const [infoTripId, setInfoTripId]       = useState(null);
  const [addMemberTrip, setAddMemberTrip] = useState(null);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [memberRefreshKey, setMemberRefreshKey] = useState(0);
  // Lưu current_trip ID đã biết để detect thay đổi từ Firestore
  const knownTripIdRef = useRef(null);
  // Lưu trip IDs dạng string để dùng làm dependency cho onSnapshot effect
  const [tripIds, setTripIds] = useState("");

  // ── Fetch trips từ API ───────────────────────────────────────────────────────
  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tripService.getMyTrips();
      setTrips(data);
      // Auto-select trip đầu tiên nếu chưa có selection
      if (data.length > 0) {
        setSelectedTripId((prev) => prev ?? data[0].id);
      }
      // Cập nhật ref để Firestore listener biết giá trị hiện tại
      knownTripIdRef.current = data[0]?.id ?? null;
      // Cập nhật tripIds để trigger onSnapshot effect
      setTripIds(data.map((t) => t.id).join(","));
    } catch (err) {
      console.error("Failed to fetch trips:", err);
      setError(err.message || "Không thể tải danh sách chuyến đi");
    } finally {
      setLoading(false);
    }
  }, []);

  // Đợi Firebase xác nhận auth xong mới fetch — tránh lỗi "not authenticated" khi F5
  useEffect(() => {
    if (authLoading) return;          // Firebase chưa restore session
    if (!isAuthenticated) {
      setTrips([]);
      setLoading(false);
      return;
    }
    fetchTrips();
  }, [authLoading, isAuthenticated, fetchTrips]);

  // Polling đã tắt — gây 429 Too Many Requests
  // useEffect(() => {
  //   if (authLoading || !isAuthenticated) return;
  //   const interval = setInterval(() => {
  //     fetchTrips();
  //   }, 10000);
  //   return () => clearInterval(interval);
  // }, [authLoading, isAuthenticated, fetchTrips]);

  // ── Lắng nghe current_trip thay đổi trên Firestore ──────────────────────────
  // Khi user được add vào trip, backend cập nhật users/{uid}.current_trip trên Firestore.
  // onSnapshot phát hiện thay đổi → gọi fetchTrips() để load trip mới ngay lập tức,
  // không cần user F5.
  useEffect(() => {
    if (authLoading || !isAuthenticated || !user?.uid) return;

    const userRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(
      userRef,
      (snap) => {
        if (!snap.exists()) return;
        const newTripId = snap.data()?.current_trip ?? null;
        // Chỉ re-fetch khi current_trip thực sự thay đổi (tránh fetch thừa khi mount)
        if (knownTripIdRef.current !== null && knownTripIdRef.current !== newTripId) {
          fetchTrips();
        }
        knownTripIdRef.current = newTripId;
      },
      (err) => {
        console.error("[useTrip] Firestore user snapshot error:", err);
      }
    );

    return () => unsub();
  }, [authLoading, isAuthenticated, user?.uid, fetchTrips]);

  // ── Lắng nghe từng trip document trên Firestore ─────────────────────────────
  // Firestore chỉ sync các trường real-time (status, name, etc.)
  // KHÔNG có start_at, end_at, created_at, updated_at → preserve từ API data
  useEffect(() => {
    if (!tripIds || !isAuthenticated) return;

    const ids = tripIds.split(",").filter(Boolean);
    const unsubs = ids.map((id) => {
      const tripRef = doc(db, "trips", id);
      return onSnapshot(
        tripRef,
        (snap) => {
          if (!snap.exists()) return;
          const firestoreData = snap.data();
          console.log("[useTrip] Firestore raw data:", firestoreData);
          
          setTrips((prev) => {
            const existing = prev.find((t) => t.id === snap.id);
            if (!existing) return prev;
            
            // Chỉ update các trường có trong Firestore, preserve các trường date từ API
            const updated = {
              ...existing,
              // Update các trường từ Firestore (status, name, etc.)
              status: firestoreData.status ?? existing.status,
              title: firestoreData.name ?? existing.title,
              // Preserve các trường date từ API (Firestore không có)
              dateFrom: existing.dateFrom,
              dateTo: existing.dateTo,
              created_at: existing.created_at,
              updated_at: existing.updated_at,
            };
            
            console.log("[useTrip] Firestore trip updated:", updated.id, "status:", updated.status);
            return prev.map((t) => (t.id === updated.id ? updated : t));
          });
        },
        (err) => {
          console.error(`[useTrip] Firestore trip snapshot error (${id}):`, err);
        }
      );
    });

    return () => unsubs.forEach((unsub) => unsub());
  }, [tripIds, isAuthenticated]); // re-subscribe khi trip IDs hoặc auth thay đổi

  // ── Derived ─────────────────────────────────────────────────────────────────
  const infoTrip = infoTripId ? trips.find((t) => t.id === infoTripId) ?? null : null;

  const filteredTrips = trips.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleCreate = async ({ title, place_id, dateFrom, dateTo }) => {
    try {
      const toISO = (dateStr) => dateStr ? new Date(dateStr).toISOString() : undefined;
      const payload = {
        name:     title,
        place_id: place_id || undefined,
        start_at: toISO(dateFrom),
        end_at:   toISO(dateTo),
      };
      const newTrip = await tripService.createTrip(payload);
      setTrips((prev) => [newTrip, ...prev]);
      setSelectedTripId(newTrip.id);
    } catch (err) {
      console.error("Failed to create trip:", err);
      setError(err.message || "Không thể tạo chuyến đi");
    }
  };

  const handleDelete = async (id) => {
    try {
      await tripService.deleteTrip(id);
      setTrips((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete trip:", err);
      setError(err.message || "Không thể xóa chuyến đi");
    }
  };

  const handleSaveEdit = async (updated) => {
    try {
      const toISO = (dateStr) => dateStr ? new Date(dateStr).toISOString() : undefined;
      const payload = {
        name:     updated.title,
        place_id: updated.place_id || undefined,
        status:   updated.status,
        start_at: toISO(updated.dateFrom),
        end_at:   toISO(updated.dateTo),
      };
      const savedTrip = await tripService.updateTrip(updated.id, payload);
      setTrips((prev) => prev.map((t) => (t.id === savedTrip.id ? savedTrip : t)));
    } catch (err) {
      console.error("Failed to update trip:", err);
      setError(err.message || "Không thể cập nhật chuyến đi");
    }
  };

  const handleAddMember = async (tripId, uid) => {
    try {
      const updatedTrip = await tripService.addMembersToTrip(tripId, [uid]);
      setTrips((prev) => prev.map((t) => (t.id === updatedTrip.id ? updatedTrip : t)));
      setMemberRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to add member:", err);
      setError(err.message || "Không thể thêm thành viên");
    }
  };

  const handleRemoveMember = async (tripId, uid) => {
    try {
      const updatedTrip = await tripService.removeMembersFromTrip(tripId, [uid]);
      setTrips((prev) => prev.map((t) => (t.id === updatedTrip.id ? updatedTrip : t)));
      setMemberRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to remove member:", err);
      setError(err.message || "Không thể xóa thành viên");
    }
  };

  const handleUpdateStatus = async (tripId, newStatus) => {
    try {
      const savedTrip = await tripService.updateTrip(tripId, { status: newStatus });
      setTrips((prev) => prev.map((t) => (t.id === savedTrip.id ? savedTrip : t)));
    } catch (err) {
      console.error("Failed to update trip status:", err);
      setError(err.message || "Không thể cập nhật trạng thái chuyến đi");
    }
  };

  // Lên lịch đổi status: scheduledAt=null → thực hiện ngay, scheduledAt=Date → setTimeout
  const handleScheduleStatus = (tripId, newStatus, scheduledAt) => {
    if (!scheduledAt) {
      handleUpdateStatus(tripId, newStatus);
      return;
    }
    const delay = scheduledAt.getTime() - Date.now();
    if (delay <= 0) {
      handleUpdateStatus(tripId, newStatus);
      return;
    }
    setTimeout(() => handleUpdateStatus(tripId, newStatus), delay);
  };

  const handleLeaveTrip = async (tripId) => {
    try {
      const currentUid = (await import("../../../config/firebase")).auth.currentUser?.uid;
      if (!currentUid) return;
      const updatedTrip = await tripService.removeMembersFromTrip(tripId, [currentUid]);
      setTrips((prev) => prev.map((t) => (t.id === updatedTrip.id ? updatedTrip : t)));
    } catch (err) {
      console.error("Failed to leave trip:", err);
      setError(err.message || "Không thể rời chuyến đi");
    }
  };

  return {
    // State
    activeNav,
    setActiveNav,
    trips,
    filteredTrips,
    loading,
    error,
    search,
    setSearch,
    showCreate,
    setShowCreate,
    editingTrip,
    setEditingTrip,
    viewingTrip,
    setViewingTrip,
    infoTrip,
    setInfoTripId,
    addMemberTrip,
    setAddMemberTrip,
    selectedTripId,
    setSelectedTripId,
    selectedTrip: trips.find((t) => t.id === selectedTripId) ?? null,
    memberRefreshKey,
    // Handlers
    handleCreate,
    handleDelete,
    handleSaveEdit,
    handleAddMember,
    handleRemoveMember,
    handleLeaveTrip,
    handleUpdateStatus,
    handleScheduleStatus,
    // Refresh
    refetch: fetchTrips,
  };
}
