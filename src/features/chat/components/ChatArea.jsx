import { useRef, useEffect } from "react";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";

// ─── Attachment Menu ──────────────────────────────────────────────────────────
function AttachmentMenu({ onPickImage, onClose }) {
  const fileInputRef = useRef(null);

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
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) { onPickImage(file); onClose(); }
              e.target.value = "";
            }}
          />
        </label>

        {/* Địa điểm — giữ nguyên, gửi ngay */}
        <button
          onClick={onClose}
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

// ─── Image Preview trong input bar ───────────────────────────────────────────
function ImagePreview({ url, uploading, onRemove }) {
  return (
    <div className="relative inline-block mb-2 ml-1">
      {uploading ? (
        <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      ) : (
        <img
          src={url}
          alt="preview"
          className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm"
        />
      )}
      {!uploading && (
        <button
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center text-xs leading-none hover:bg-red-500 transition-colors"
        >
          ×
        </button>
      )}
    </div>
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
  onPickImage,
  onDeleteMessage,
  showRightPanel,
  onToggleRightPanel,
  onDeleteGroup,
  onUpdateGroup,
  onAddMember,
  showAttach,
  setShowAttach,
  pendingImage,
  onRemovePendingImage,
  imageUploading,
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const canSend = (input.trim().length > 0 || !!pendingImage) && !imageUploading;

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
        {/* Attachment menu */}
        {showAttach && (
          <AttachmentMenu
            onPickImage={onPickImage}
            onClose={() => setShowAttach(false)}
          />
        )}

        {/* Image preview */}
        {(pendingImage || imageUploading) && (
          <ImagePreview
            url={pendingImage?.url}
            uploading={imageUploading}
            onRemove={onRemovePendingImage}
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
            onKeyDown={(e) => e.key === "Enter" && canSend && onSend()}
            placeholder={`Message ${group.name}...`}
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
          <button
            onClick={() => canSend && onSend()}
            disabled={!canSend}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white transition-colors shrink-0 ${
              canSend ? "bg-primary hover:bg-primary-container" : "bg-gray-200 cursor-not-allowed"
            }`}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatArea;
