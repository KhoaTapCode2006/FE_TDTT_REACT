import {
  useTrip,
  NAV_ITEMS,
  useGpsTracking,
  TripCard,
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
    handleCreate,
    handleDelete,
    handleSaveEdit,
    handleAddMember,
    handleRemoveMember,
    handleLeaveTrip,
    handleUpdateStatus,
    handleScheduleStatus,
  } = useTrip();

  // Push GPS lên Firestore cho tất cả trips khi đang ở trang này
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 py-6">

          {/* Error banner */}
          {error && (
            <div className="mb-4 flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              <span>{error}</span>
              <button
                onClick={refetch}
                className="shrink-0 text-xs font-semibold underline hover:no-underline"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Loading skeleton */}
          {loading ? (
            <div className="grid grid-cols-2 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 items-stretch">
              {filteredTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  currentUid={currentUid}
                  onDelete={handleDelete}
                  onLeave={handleLeaveTrip}
                  onEdit={setEditingTrip}
                  onView={setViewingTrip}
                  onInfo={(t) => setInfoTripId(t.id)}
                  onAddMember={setAddMemberTrip}
                  onScheduleStatus={handleScheduleStatus}
                />
              ))}
              {filteredTrips.length === 0 && (
                <div className="col-span-2 flex flex-col items-center justify-center py-20 text-gray-400">
                  <span className="text-4xl mb-3">🗺️</span>
                  <p className="text-sm font-medium">Chưa có chuyến đi nào</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {addMemberTrip && (
        <AddMemberModal
          trip={addMemberTrip}
          onClose={() => setAddMemberTrip(null)}
          onAdd={handleAddMember}
        />
      )}

      {infoTrip && (
        <TripInfoModal
          trip={infoTrip}
          onClose={() => setInfoTripId(null)}
          onRemoveMember={handleRemoveMember}
        />
      )}

      {viewingTrip && (
        <TripMapModal
          trip={viewingTrip}
          onClose={() => setViewingTrip(null)}
        />
      )}

      {showCreate && (
        <CreateTripModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
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
