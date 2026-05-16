import {
  useTrip,
  NAV_ITEMS,
  useGpsTracking,
  TripCard,
  TripInfoPanel,
  TripMemberPanel,
  TripMapPanel,
  CreateTripModal,
  EditTripModal,
  TripInfoModal,
  TripMapModal,
  AddMemberModal,
} from "../features/trip";
import { useAuth } from "../contexts/AuthContext";

// ─── TripPage ─────────────────────────────────────────────────────────────────

export default function TripPage() {
  const { user } = useAuth();
  const currentUid = user?.uid ?? null;

  const {
    activeNav,
    setActiveNav,
    trips,
    filteredTrips,
    loading,
    error,
    refetch,
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
    selectedTrip,
    handleCreate,
    handleDelete,
    handleSaveEdit,
    handleAddMember,
    handleRemoveMember,
    handleLeaveTrip,
    handleUpdateStatus,
    handleScheduleStatus,
  } = useTrip();

  useGpsTracking(trips.map((t) => t.id));

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-body overflow-hidden">

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 px-8">
        <div className="flex items-center justify-between">
          <nav className="flex gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeNav === item.id
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            Create New Trip
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 min-h-0 overflow-hidden">

        {/* Error banner */}
        {error && (
          <div className="mx-8 mt-4 flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            <span>{error}</span>
            <button onClick={refetch} className="shrink-0 text-xs font-semibold underline hover:no-underline">Thử lại</button>
          </div>
        )}

        {/* ── Tab: TripMap ── */}
        {activeNav === "tripmap" && (
          <div className="flex flex-col h-full min-h-0 p-4">
            {loading ? (
              <div className="bg-gray-100 rounded-2xl h-full animate-pulse" />
            ) : !selectedTrip ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <span className="text-3xl mb-2">🗺️</span>
                <p className="text-xs font-medium">Chưa có chuyến đi nào</p>
              </div>
            ) : (
              <TripCard
                trip={selectedTrip}
                currentUid={currentUid}
                onDelete={handleDelete}
                onLeave={handleLeaveTrip}
                onEdit={setEditingTrip}
                onView={setViewingTrip}
                onInfo={(t) => setInfoTripId(t.id)}
                onAddMember={setAddMemberTrip}
                onScheduleStatus={handleScheduleStatus}
                mapPanel={<TripMapPanel trip={selectedTrip} />}
              />
            )}
          </div>
        )}

        {/* ── Tab: Info ── */}
        {activeNav === "info" && (
          <div className="overflow-y-auto h-full px-8 py-6">
            <TripInfoPanel trip={selectedTrip} onRemoveMember={handleRemoveMember} />
          </div>
        )}

        {/* ── Tab: Member ── */}
        {activeNav === "member" && (
          <div className="overflow-y-auto h-full px-8 py-6">
            <TripMemberPanel
              trip={selectedTrip}
              onRemoveMember={handleRemoveMember}
              onAddMember={setAddMemberTrip}
            />
          </div>
        )}

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
        <EditTripModal trip={editingTrip} onClose={() => setEditingTrip(null)} onSave={handleSaveEdit} />
      )}
    </div>
  );
}
