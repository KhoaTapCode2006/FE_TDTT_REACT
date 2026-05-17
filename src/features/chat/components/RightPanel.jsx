import { useState, useEffect } from "react";
import Avatar from "./Avatar";
import ConfirmModal from "./modals/ConfirmModal";

// ─── Right Panel ──────────────────────────────────────────────────────────────
function RightPanel({ group, initialMembers, onRemoveMember }) {
  const [members, setMembers] = useState(initialMembers);
  const [toast, setToast] = useState(null); // { message: string }
  const [confirmRemove, setConfirmRemove] = useState(null); // uid | null

  // Reset khi đổi group
  useEffect(() => {
    setMembers(initialMembers);
  }, [group.id, initialMembers]);

  const showToast = (message) => {
    setToast({ message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRemove = (uid) => {
    const member = members.find((m) => (m.uid || m.id) === uid);
    const displayName = member?.display_name || member?.name || uid;
    setMembers((prev) => prev.filter((m) => (m.uid || m.id) !== uid));
    if (onRemoveMember) onRemoveMember(uid);
    showToast(`Đã xóa ${displayName} khỏi nhóm`);
  };

  const confirmingMember = confirmRemove
    ? members.find((m) => (m.uid || m.id) === confirmRemove)
    : null;
  return (
    <aside className="w-80 bg-white border-l border-gray-100 flex flex-col h-full overflow-y-auto relative">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-1/2 left-1/2 z-50 bg-gray-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg"
          style={{ transform: 'translate(-50%, -50%)', animation: 'fadeIn 0.2s ease' }}
        >
          {toast.message}
        </div>
      )}

      {/* Group avatar & name */}
      <div className="flex flex-col items-center py-4 px-4 border-b border-gray-100">
        <div className="relative mb-2">
          {group.thumbnail_url ? (
            <img
              src={group.thumbnail_url}
              alt={group.name}
              className="w-14 h-14 rounded-full object-cover shadow-card border-2 border-white"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold shadow-card select-none">
              {group.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs">
            🔔
          </div>
        </div>
        <h3 className="font-bold text-gray-900 text-base text-center">{group.name}</h3>
        {group.description && (
          <p className="text-xs text-gray-500 mt-0.5 text-center line-clamp-2 w-full px-2">
            {group.description}
          </p>
        )}
      </div>

      {/* Members */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-800">Members ({members.length})</span>
        </div>
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.uid || m.id} className="flex items-center gap-3">
              <Avatar
                initials={(m.display_name || m.name || m.uid || "?").slice(0, 2).toUpperCase()}
                size="sm"
                color="#255dad"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {m.display_name || m.name || m.uid}
                </p>
                <p className="text-xs text-gray-400">
                  <span className={m.role === "owner" ? "text-primary font-semibold" : ""}>
                    {m.role}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setConfirmRemove(m.uid || m.id)}
                title="Xóa khỏi nhóm"
                className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors whitespace-nowrap"
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      </div>

      {confirmRemove && (
        <ConfirmModal
          title="Xóa thành viên"
          message={`Bạn có chắc muốn xóa ${confirmingMember?.display_name || confirmingMember?.name || confirmRemove} khỏi nhóm?`}
          confirmLabel="Xóa"
          onConfirm={() => { handleRemove(confirmRemove); setConfirmRemove(null); }}
          onCancel={() => setConfirmRemove(null)}
        />
      )}
    </aside>
  );
}

export default RightPanel;