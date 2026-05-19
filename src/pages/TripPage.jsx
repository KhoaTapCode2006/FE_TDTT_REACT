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
    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-6">
      <p className="text-lg font-medium text-gray-500">Bạn chưa có chuyến đi nào</p>

      <div className="flex items-stretch gap-4">
        {/* Tạo chuyến đi mới — trái */}
        <div className="relative bg-gray-900 rounded-2xl px-5 py-4 w-64 overflow-hidden flex flex-col justify-between">
          <div>
            <p className="text-sm font-bold text-white mb-1">Tạo chuyến đi mới</p>
            <p className="text-xs text-gray-400 leading-snug">Lên kế hoạch và quản lý chuyến đi của bạn.</p>
          </div>
          <button
            onClick={onCreateNew}
            className="mt-4 flex items-center justify-center gap-2 bg-white text-gray-900 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Tạo chuyến đi mới
          </button>
        </div>

        {/* Tham gia chuyến đi — phải */}
        <div className="relative bg-green-50 border border-green-100 rounded-2xl px-5 py-4 w-64 overflow-hidden flex flex-col justify-between">
          {/* Decorative pins */}
          <svg className="absolute right-4 top-3 w-5 h-5 text-green-300 opacity-50" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
          </svg>
          <svg className="absolute right-10 bottom-4 w-3.5 h-3.5 text-green-400 opacity-30" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
          </svg>

          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4.13a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Tham gia chuyến đi</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">Nhập ID chuyến đi để tham gia cùng bạn bè.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2">
              <input
                type="text"
                placeholder="Nhập ID chuyến đi"
                className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent min-w-0"
              />
            </div>
            <button className="w-full bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
              Tham gia chuyến đi
            </button>
          </div>
        </div>
      </div>
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
    memberRefreshKey,
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
                refreshKey={memberRefreshKey}
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
