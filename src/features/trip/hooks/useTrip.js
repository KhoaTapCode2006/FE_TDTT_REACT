// ─── useTrip ───────────────────────────────────────────────────────────────────
// Quản lý toàn bộ state và business logic của Trip feature:
// danh sách trips, filter theo nav/search, tạo/sửa/xóa trip, thêm/xóa member,
// và trạng thái mở/đóng các modal.

import { useState, useEffect, useCallback } from "react";
import { tripService } from "../../../services/backend/trip.service";

export const NAV_ITEMS = [
  { id: "all",     label: "All Trips", icon: "🗺️" },
  { id: "waiting", label: "Waiting",   icon: "⏳" },
  { id: "active",  label: "Active",    icon: "🟢" },
  { id: "ended",   label: "Ended",     icon: "🏁" },
];

export function useTrip() {
  const [activeNav, setActiveNav]         = useState("all");
  const [trips, setTrips]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [search, setSearch]               = useState("");
  const [showCreate, setShowCreate]       = useState(false);
  const [editingTrip, setEditingTrip]     = useState(null);
  const [viewingTrip, setViewingTrip]     = useState(null);
  const [infoTripId, setInfoTripId]       = useState(null);
  const [addMemberTrip, setAddMemberTrip] = useState(null);

  // ── Fetch trips từ API ───────────────────────────────────────────────────────
  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tripService.getMyTrips();
      setTrips(data);
    } catch (err) {
      console.error("Failed to fetch trips:", err);
      setError(err.message || "Không thể tải danh sách chuyến đi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const infoTrip = infoTripId ? trips.find((t) => t.id === infoTripId) ?? null : null;

  const filteredTrips = trips.filter((t) => {
    const matchNav    = activeNav === "all" || t.status === activeNav;
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    return matchNav && matchSearch;
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleCreate = async ({ title, description, dateFrom, dateTo }) => {
    try {
      const toISO = (dateStr) => dateStr ? new Date(dateStr).toISOString() : undefined;
      const payload = {
        name:     title,
        place_id: description || undefined,
        start_at: toISO(dateFrom),
        end_at:   toISO(dateTo),
      };
      const newTrip = await tripService.createTrip(payload);
      setTrips((prev) => [newTrip, ...prev]);
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
        place_id: updated.description || undefined,
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
    } catch (err) {
      console.error("Failed to add member:", err);
      setError(err.message || "Không thể thêm thành viên");
    }
  };

  const handleRemoveMember = async (tripId, uid) => {
    try {
      const updatedTrip = await tripService.removeMembersFromTrip(tripId, [uid]);
      setTrips((prev) => prev.map((t) => (t.id === updatedTrip.id ? updatedTrip : t)));
    } catch (err) {
      console.error("Failed to remove member:", err);
      setError(err.message || "Không thể xóa thành viên");
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
    // Handlers
    handleCreate,
    handleDelete,
    handleSaveEdit,
    handleAddMember,
    handleRemoveMember,
    // Refresh
    refetch: fetchTrips,
  };
}
