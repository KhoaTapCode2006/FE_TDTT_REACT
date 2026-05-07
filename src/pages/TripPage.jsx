import {
  useTrip,
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
    filteredTrips,
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
          </div>
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
