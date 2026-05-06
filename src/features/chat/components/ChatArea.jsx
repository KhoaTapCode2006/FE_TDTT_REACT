import { useRef, useEffect } from "react";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";

// ─── Attachment Menu ──────────────────────────────────────────────────────────
// Vùng chat chính ở giữa màn hình.
// Gồm 3 phần: ChatHeader ở trên, danh sách MessageBubble ở giữa (có auto-scroll xuống cuối), 
// và input bar ở dưới kèm menu đính kèm file/ảnh/video/địa điểm.
function AttachmentMenu({ onAttach, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="relative z-20 mb-2 flex items-center gap-2 px-1">
        {/* Ảnh */}
        <label className="flex flex-col items-center gap-1 cursor-pointer group">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <span className="text-xs text-gray-500">Ảnh</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { onAttach("image", e.target.files[0]); onClose(); }}
          />
        </label>

        {/* Video */}
        <label className="flex flex-col items-center gap-1 cursor-pointer group">
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-500 group-hover:bg-purple-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
          </div>
          <span className="text-xs text-gray-500">Video</span>
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => { onAttach("video", e.target.files[0]); onClose(); }}
          />
        </label>

        {/* File */}
        <label className="flex flex-col items-center gap-1 cursor-pointer group">
          <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 group-hover:bg-orange-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <span className="text-xs text-gray-500">File</span>
          <input
            type="file"
            className="hidden"
            onChange={(e) => { onAttach("file", e.target.files[0]); onClose(); }}
          />
        </label>

        {/* Địa điểm */}
        <button
          onClick={() => { onAttach("place", null); onClose(); }}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="w-11 h-11 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-500 group-hover:bg-green-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <span className="text-xs text-gray-500">Địa điểm</span>
        </button>
      </div>
    </>
  );
}

// ─── Chat Area ────────────────────────────────────────────────────────────────

function ChatArea({
  group,
  groupMembers,
  messages,
  input,
  setInput,
  onSend,
  onDeleteMessage,
  showRightPanel,
  onToggleRightPanel,
  onDeleteGroup,
  onUpdateGroup,
  onAddMember,
  showAttach,
  setShowAttach,
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAttach = (type, file) => {
    if (type === "place") {
      onSend({ type: "place", text: "📍 Vị trí hiện tại của tôi", placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4" });
      return;
    }
    if (!file) return;
    const url = URL.createObjectURL(file);
    onSend({ type, file, url, fileName: file.name });
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
      <ChatHeader
        groupName={group.name}
        groupDescription={group.description}
        groupId={group.id}
        groupMembers={groupMembers}
        showRightPanel={showRightPanel}
        onToggleRightPanel={onToggleRightPanel}
        onDeleteGroup={onDeleteGroup}
        onUpdateGroup={onUpdateGroup}
        onAddMember={onAddMember}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex items-center justify-center mb-6">
          <span className="bg-gray-200 text-gray-500 text-xs px-4 py-1 rounded-full font-medium">
            TODAY
          </span>
        </div>

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} onDelete={onDeleteMessage} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 bg-white border-t border-gray-100">
        {showAttach && (
          <AttachmentMenu
            onAttach={handleAttach}
            onClose={() => setShowAttach(false)}
          />
        )}

        <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-200">
          <button
            onClick={() => setShowAttach((v) => !v)}
            className={`transition-colors text-xl shrink-0 ${showAttach ? "text-primary" : "text-gray-400 hover:text-primary"}`}
          >
            +
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            placeholder={`Message ${group.name}...`}
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
          <button
            onClick={() => onSend()}
            className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white hover:bg-primary-container transition-colors shrink-0"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatArea;