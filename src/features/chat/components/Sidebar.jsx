import Avatar from "./Avatar";

// ─── Sidebar ──────────────────────────────────────────────────────────────────
// Panel trái liệt kê danh sách nhóm chat.
// Mỗi item hiển thị avatar, tên nhóm, tin nhắn cuối, thời gian và badge số tin chưa đọc. Có nút + để mở modal tạo nhóm mới.
function Sidebar({ activeGroup, setActiveGroup, groups, onOpenCreate }) {
  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">Nhóm của tôi</h2>
          <p className="text-xs text-gray-400 mt-0.5">{groups.length} nhóm</p>
        </div>
        <button
          onClick={onOpenCreate}
          title="Tạo nhóm mới"
          className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-container transition-colors text-lg font-bold"
        >
          +
        </button>
      </div>

      {/* Group list */}
      <nav className="flex-1 overflow-y-auto py-2">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => setActiveGroup(group.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
              activeGroup === group.id ? "bg-primary/10" : "hover:bg-gray-50"
            }`}
          >
            {group.thumbnail_url ? (
              <img
                src={group.thumbnail_url}
                alt={group.name}
                className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-white shadow-sm"
              />
            ) : (
              <Avatar initials={group.name.slice(0, 2).toUpperCase()} size="md" color="#255dad" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p
                  className={`text-sm font-semibold truncate ${
                    activeGroup === group.id ? "text-primary" : "text-gray-800"
                  }`}
                >
                  {group.name}
                </p>
                <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">{group.time}</span>
              </div>
              <div className="flex items-center justify-between gap-1 mt-0.5">
                <p className="text-xs text-gray-500 truncate">{group.description || group.lastMsg}</p>
                {group.unread > 0 && (
                  <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-semibold">
                    {group.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;