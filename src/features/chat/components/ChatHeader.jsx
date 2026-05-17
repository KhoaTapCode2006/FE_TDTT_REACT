import { useState } from "react";
import { auth } from "../../../config/firebase";
import UpdateGroupModal from "./modals/UpdateGroupModal";
import AddMemberModal from "./modals/AddMemberModal";
import ConfirmModal from "./modals/ConfirmModal";

// ─── Chat Header ──────────────────────────────────────────────────────────────
function ChatHeader({
  groupName,
  groupDescription,
  groupThumbnailUrl,
  groupId,
  groupOwnerUid,
  groupMembers,
  showRightPanel,
  onToggleRightPanel,
  onDeleteGroup,
  onUpdateGroup,
  onAddMember,
  onLeaveGroup,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'delete' | 'leave' | null

  const currentUid = auth.currentUser?.uid;
  const isOwner = currentUid && groupOwnerUid && currentUid === groupOwnerUid;

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white">
        <div className="flex flex-col">
          <h2 className="font-bold text-gray-900 text-sm">{groupName}</h2>
          {groupDescription && (
            <p className="text-xs text-gray-400 truncate max-w-xs">{groupDescription}</p>
          )}
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
                    Cập nhật nhóm
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setShowAddMemberModal(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Thêm thành viên
                  </button>
                  {isOwner ? (
                    <button
                      onClick={() => { setMenuOpen(false); setConfirmAction('delete'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Xóa nhóm chat
                    </button>
                  ) : (
                    <button
                      onClick={() => { setMenuOpen(false); setConfirmAction('leave'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Rời nhóm chat
                    </button>
                  )}
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
          groupThumbnailUrl={groupThumbnailUrl}
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

      {confirmAction === 'delete' && (
        <ConfirmModal
          title="Xóa nhóm chat"
          message={`Bạn có chắc muốn xóa nhóm "${groupName}"?`}
          confirmLabel="Xóa nhóm"
          onConfirm={() => { setConfirmAction(null); onDeleteGroup(); }}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {confirmAction === 'leave' && (
        <ConfirmModal
          title="Rời nhóm chat"
          message={`Bạn có chắc muốn rời khỏi nhóm "${groupName}"?`}
          confirmLabel="Rời nhóm"
          onConfirm={() => { setConfirmAction(null); onLeaveGroup?.(); }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </>
  );
}

export default ChatHeader;