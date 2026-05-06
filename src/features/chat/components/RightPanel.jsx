import { useState, useEffect } from "react";
import Avatar from "./Avatar";

// ─── Right Panel ──────────────────────────────────────────────────────────────
// Panel thông tin nhóm bên phải. 
// Hiển thị avatar lớn, tên và mô tả nhóm, danh sách thành viên với khả năng thu gọn/mở rộng và xóa từng member. 
// Reset về trạng thái ban đầu mỗi khi người dùng chuyển sang nhóm khác.
function RightPanel({ group, initialMembers, onRemoveMember }) {
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [members, setMembers] = useState(initialMembers);

  // Reset khi đổi group
  useEffect(() => {
    setMembers(initialMembers);
    setShowAllMembers(false);
  }, [group.id, initialMembers]);

  const visibleMembers = showAllMembers ? members : members.slice(0, 2);

  const handleRemove = (uid) => {
    setMembers((prev) => prev.filter((m) => (m.uid || m.id) !== uid));
    if (onRemoveMember) onRemoveMember(uid);
  };

  return (
    <aside className="w-64 bg-white border-l border-gray-100 flex flex-col h-full overflow-y-auto">
      {/* Group avatar & name */}
      <div className="flex flex-col items-center py-6 px-4 border-b border-gray-100">
        <div className="relative mb-3">
          {group.thumbnail_url ? (
            <img
              src={group.thumbnail_url}
              alt={group.name}
              className="w-20 h-20 rounded-full object-cover shadow-card border-2 border-white"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold shadow-card select-none">
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
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-800">Members ({members.length})</span>
          <button
            onClick={() => setShowAllMembers((v) => !v)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {showAllMembers ? "THU GỌN" : "SEE ALL"}
          </button>
        </div>
        <div className="space-y-3">
          {visibleMembers.map((m) => (
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
                onClick={() => handleRemove(m.uid || m.id)}
                title="Xóa khỏi nhóm"
                className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors whitespace-nowrap"
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default RightPanel;