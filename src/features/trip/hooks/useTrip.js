// ─── useTrip ───────────────────────────────────────────────────────────────────
// Quản lý toàn bộ state và business logic của Trip feature:
// danh sách trips, filter theo nav/search, tạo/sửa/xóa trip, thêm/xóa member,
// và trạng thái mở/đóng các modal.

import { useState } from "react";
import { MOCK_TRIPS } from "../../../services/backend/trip.service";

export const NAV_ITEMS = [
  { id: "all",     label: "All Trips", icon: "🗺️" },
  { id: "waiting", label: "Waiting",   icon: "⏳" },
  { id: "active",  label: "Active",    icon: "🟢" },
  { id: "ended",   label: "Ended",     icon: "🏁" },
];

export function useTrip() {
  const [activeNav, setActiveNav]         = useState("all");
  const [trips, setTrips]                 = useState(MOCK_TRIPS);
  const [search, setSearch]               = useState("");
  const [showCreate, setShowCreate]       = useState(false);
  const [editingTrip, setEditingTrip]     = useState(null);
  const [viewingTrip, setViewingTrip]     = useState(null);
  const [infoTripId, setInfoTripId]       = useState(null);
  const [addMemberTrip, setAddMemberTrip] = useState(null);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const infoTrip = infoTripId ? trips.find((t) => t.id === infoTripId) ?? null : null;

  const filteredTrips = trips.filter((t) => {
    const matchNav    = activeNav === "all" || t.status === activeNav;
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    return matchNav && matchSearch;
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleCreate = ({ title, description, dateFrom, dateTo }) => {
    const newTrip = {
      id:          Date.now(),
      title,
      description: description || "No description provided.",
      status:      "waiting",
      dateRange:   dateFrom && dateTo ? `${dateFrom} - ${dateTo}` : "TBD",
      dateFrom,
      dateTo,
      members:     1,
      member_uids: [],
      avatars:     [],
      extra:       0,
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
    setTrips((prev) =>
      prev.map((t) =>
        t.id === tripId
          ? { ...t, member_uids: [...(t.member_uids || []), uid] }
          : t
      )
    );
  };

  const handleRemoveMember = (tripId, uid) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === tripId
          ? { ...t, member_uids: (t.member_uids || []).filter((u) => u !== uid) }
          : t
      )
    );
  };

  return {
    // State
    activeNav,
    setActiveNav,
    trips,
    filteredTrips,
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
  };
}
