import {
  useTrip,
  NAV_ITEMS,
  useGpsTracking,
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

// ─── Empty state dùng chung khi chưa có trip ─────────────────────────────────
function NoTripState({ onCreateNew }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
      <p className="text-lg font-medium text-gray-500">Bạn chưa có chuyến đi nào</p>
      <button
        onClick={onCreateNew}
        className="flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-700 transition-colors"
      >
        <span className="text-lg leading-none">+</span>
        Tạo chuyến đi mới
      </button>
    </div>
  );
}

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
    <div className="flex flex-col flex-1 min-h-0 bg-gray-50 font-body overflow-hidden">

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
                {item.label}
              </button>
            ))}
          </nav>
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

        {/* ── Tab: Info ── */}
        {activeNav === "info" && (
          <div className="flex flex-col h-full min-h-0 px-0 pb-4 pt-0 gap-2 overflow-hidden">
            {!selectedTrip ? <NoTripState onCreateNew={() => setShowCreate(true)} /> : (
              <>
                <div className="shrink-0">
                  <TripInfoPanel
                    trip={selectedTrip}
                    onRemoveMember={handleRemoveMember}
                    onEdit={setEditingTrip}
                    onDelete={handleDelete}
                    onLeave={handleLeaveTrip}
                    onUpdateStatus={handleUpdateStatus}
                    currentUid={currentUid}
                  />
                </div>
                <div className="flex-1 min-h-0 px-4 pb-0">
                  <TripMapPanel trip={selectedTrip} />
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Tab: Member ── */}
        {activeNav === "member" && (
          <div className="overflow-y-auto h-full">
            {!selectedTrip ? <NoTripState onCreateNew={() => setShowCreate(true)} /> : (
              <TripMemberPanel
                trip={selectedTrip}
                onRemoveMember={handleRemoveMember}
                onAddMember={setAddMemberTrip}
              />
            )}
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
