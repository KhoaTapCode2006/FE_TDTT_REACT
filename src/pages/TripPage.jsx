import {
  useTrip,
  useGpsTracking,
  TripSidebar,
  TripCard,
  CreateTripModal,
  EditTripModal,
  TripInfoModal,
  TripMapModal,
  AddMemberModal,
} from "../features/trip";

// ─── TripPage ─────────────────────────────────────────────────────────────────

export default function TripPage() {
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
  } = useTrip();

  // Push GPS lên Firestore cho tất cả trips khi đang ở trang này
  useGpsTracking(trips.map((t) => t.id));

  return (
    <div className="flex h-screen bg-gray-50 font-body overflow-hidden">
      <TripSidebar
        activeNav={activeNav}
        onNavChange={setActiveNav}
        onOpenCreate={() => setShowCreate(true)}
      />

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
                  onDelete={handleDelete}
                  onEdit={setEditingTrip}
                  onView={setViewingTrip}
                  onInfo={(t) => setInfoTripId(t.id)}
                  onAddMember={setAddMemberTrip}
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
