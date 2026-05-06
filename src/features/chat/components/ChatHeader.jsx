import { useState } from "react";
import UpdateGroupModal from "./modals/UpdateGroupModal";
import AddMemberModal from "./modals/AddMemberModal";

// ─── Chat Header ──────────────────────────────────────────────────────────────
// Thanh tiêu đề phía trên vùng chat. 
// Hiển thị tên nhóm, nút toggle RightPanel và menu 3 chấm (⋮) chứa các action: cập nhật nhóm, thêm thành viên, xóa nhóm. 
// Tự quản lý việc mở/đóng UpdateGroupModal và AddMemberModal.
function ChatHeader({
  groupName,
  groupDescription,
  groupId,
  groupMembers,
  showRightPanel,
  onToggleRightPanel,
  onDeleteGroup,
  onUpdateGroup,
  onAddMember,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-gray-900 text-base">{groupName}</h2>
        </div>
        <div className="flex items-center gap-3 text-gray-500">
          {/* Toggle right panel button */}
          <button
            onClick={onToggleRightPanel}
            title={showRightPanel ? "Ẩn thông tin nhóm" : "Hiện thông tin nhóm"}
            className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-colors ${
              showRightPanel
                ? "border-primary bg-primary/10 text-primary"
                : "border-gray-300 text-gray-400 hover:border-primary hover:text-primary"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </button>

          {/* 3-dot menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="hover:text-primary transition-colors text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
            >
              ⋮
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-10 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-48">
                  <button
                    onClick={() => { setMenuOpen(false); setShowUpdateModal(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-base">✏️</span>
                    Cập nhật nhóm
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setShowAddMemberModal(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-base">👤</span>
                    Thêm thành viên
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onDeleteGroup(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <span className="text-base">🗑️</span>
                    Xóa nhóm chat
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showUpdateModal && (
        <UpdateGroupModal
          groupName={groupName}
          groupDescription={groupDescription}
          groupId={groupId}
          onClose={() => setShowUpdateModal(false)}
          onUpdate={onUpdateGroup}
        />
      )}
      {showAddMemberModal && (
        <AddMemberModal
          onClose={() => setShowAddMemberModal(false)}
          onAdd={onAddMember}
        />
      )}
    </>
  );
}

export default ChatHeader;