import { useGroupChat } from "../features/chat/hooks/useGroupChat";
import Sidebar from "../features/chat/components/Sidebar";
import ChatArea from "../features/chat/components/ChatArea";
import RightPanel from "../features/chat/components/RightPanel";
import CreateGroupModal from "../features/chat/components/modals/CreateGroupModal";

// ─── GroupChatPage ─────────────────────────────────────────────────────────────

export default function GroupChatPage() {
  const {
    groups,
    activeGroup,
    messages,
    currentGroup,
    currentMembers,
    input,
    setInput,
    showRightPanel,
    setShowRightPanel,
    showCreateModal,
    setShowCreateModal,
    showAttach,
    setShowAttach,
    setActiveGroup,
    handleCreateGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleSend,
    handleDeleteMessage,
    handleAddMember,
    handleRemoveMember,
    loading,
    error,
  } = useGroupChat();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Đang tải cuộc trò chuyện...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <p className="text-red-500 font-semibold">Không thể tải chat</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="flex flex-col h-screen bg-background font-body">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            activeGroup={null}
            setActiveGroup={setActiveGroup}
            groups={[]}
            onOpenCreate={() => setShowCreateModal(true)}
          />

          {/* Empty state */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-50">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
              💬
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700">Chưa có nhóm chat nào</p>
              <p className="text-sm text-gray-400 mt-1">Tạo nhóm mới để bắt đầu trò chuyện</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              + Tạo nhóm mới
            </button>
          </div>
        </div>

        {showCreateModal && (
          <CreateGroupModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateGroup}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background font-body">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeGroup={activeGroup}
          setActiveGroup={setActiveGroup}
          groups={groups}
          onOpenCreate={() => setShowCreateModal(true)}
        />

        <ChatArea
          group={currentGroup}
          groupMembers={currentMembers}
          messages={messages}
          input={input}
          setInput={setInput}
          onSend={handleSend}
          onDeleteMessage={handleDeleteMessage}
          showRightPanel={showRightPanel}
          onToggleRightPanel={() => setShowRightPanel((v) => !v)}
          onDeleteGroup={handleDeleteGroup}
          onUpdateGroup={handleUpdateGroup}
          onAddMember={handleAddMember}
          showAttach={showAttach}
          setShowAttach={setShowAttach}
        />

        {showRightPanel && (
          <RightPanel group={currentGroup} initialMembers={currentMembers} onRemoveMember={handleRemoveMember} />
        )}
      </div>

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGroup}
        />
      )}
    </div>
  );
}