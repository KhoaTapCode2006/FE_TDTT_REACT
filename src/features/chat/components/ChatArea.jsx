import { useRef, useEffect, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import LocationPickerModal from "./modals/LocationPickerModal";

// ─── Attachment Menu ──────────────────────────────────────────────────────────
function AttachmentMenu({ onPickImage, onOpenLocation, onClose, disabled }) {
  const fileInputRef = useRef(null);

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="relative z-20 mb-2 flex items-center gap-2 px-1">
        {/* Ảnh */}
        <label className={`flex flex-col items-center gap-1 ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer group'}`}>
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
            disabled={disabled}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file && !disabled) { onPickImage(file); onClose(); }
              e.target.value = "";
            }}
          />
        </label>

        {/* Địa điểm — mở modal tìm kiếm */}
        <button
          onClick={() => { if (!disabled) { onClose(); onOpenLocation(); } }}
          disabled={disabled}
          className={`flex flex-col items-center gap-1 ${disabled ? 'opacity-40 cursor-not-allowed' : 'group'}`}
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
    <div className="relative inline-block">
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

// ─── Place Preview trong input bar ───────────────────────────────────────────
function PlacePreview({ place, onRemove }) {
  return (
    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 max-w-[180px]">
      <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center text-green-500 shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-800 truncate">{place.name}</p>
        {place.address && (
          <p className="text-xs text-gray-400 truncate">{place.address}</p>
        )}
      </div>
      <button
        onClick={onRemove}
        className="w-5 h-5 bg-gray-300 text-white rounded-full flex items-center justify-center text-xs leading-none hover:bg-red-400 transition-colors shrink-0"
      >
        ×
      </button>
    </div>
  );
}

// ─── Attachments Preview Bar ──────────────────────────────────────────────────
function AttachmentsPreviewBar({ attachments, onRemove, maxCount }) {
  if (attachments.length === 0) return null;
  return (
    <div className="flex items-end gap-2 mb-2 ml-1 flex-wrap">
      {attachments.map((a) =>
        a.type === 'image' ? (
          <ImagePreview
            key={a.id}
            url={a.url}
            uploading={a.uploading}
            onRemove={() => onRemove(a.id)}
          />
        ) : (
          <PlacePreview
            key={a.id}
            place={a}
            onRemove={() => onRemove(a.id)}
          />
        )
      )}
      {attachments.length >= maxCount && (
        <span className="text-xs text-gray-400 self-center">Tối đa {maxCount} mục</span>
      )}
    </div>
  );
}

function ChatArea({
  group,
  groupMembers,
  messages,
  input,
  setInput,
  onSend,
  onPickImage,
  onPickPlace,
  onDeleteMessage,
  showRightPanel,
  onToggleRightPanel,
  onDeleteGroup,
  onUpdateGroup,
  onAddMember,
  onLeaveGroup,
  showAttach,
  setShowAttach,
  pendingAttachments,
  onRemoveAttachment,
  imageUploading,
  maxAttachments,
}) {
  const messagesEndRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteGroup = () => {
    const name = group.name;
    onDeleteGroup();
    showToast(`Đã xóa nhóm chat ${name}`);
  };

  const canSend = (input.trim().length > 0 || pendingAttachments.length > 0) && !imageUploading;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-1/2 left-1/2 z-50 bg-gray-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg"
          style={{ transform: 'translate(-50%, -50%)', animation: 'fadeIn 0.2s ease' }}
        >
          {toast}
        </div>
      )}
      <ChatHeader
        groupName={group.name}
        groupDescription={group.description}
        groupThumbnailUrl={group.thumbnail_url}
        groupOwnerUid={group.owner_uid}
        groupId={group.id}
        groupMembers={groupMembers}
        showRightPanel={showRightPanel}
        onToggleRightPanel={onToggleRightPanel}
        onDeleteGroup={handleDeleteGroup}
        onUpdateGroup={onUpdateGroup}
        onAddMember={onAddMember}
        onLeaveGroup={onLeaveGroup}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.map((msg, idx) => {
          const prevMsg = messages[idx - 1];
          const showDateSep = msg.dateKey && msg.dateKey !== prevMsg?.dateKey;
          const dateLabel = showDateSep
            ? (() => {
                try {
                  const d = new Date(msg.dateKey);
                  return d.toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  });
                } catch {
                  return msg.dateKey;
                }
              })()
            : null;

          return (
            <div key={msg.id}>
              {showDateSep && (
                <div className="flex items-center justify-center my-4">
                  <span className="bg-gray-200 text-gray-500 text-xs px-4 py-1 rounded-full font-medium">
                    {dateLabel}
                  </span>
                </div>
              )}
              <MessageBubble msg={msg} onDelete={onDeleteMessage} />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 bg-white border-t border-gray-100">
        {/* Attachment menu */}
        {showAttach && (
          <AttachmentMenu
            onPickImage={onPickImage}
            onOpenLocation={() => setShowLocationModal(true)}
            onClose={() => setShowAttach(false)}
            disabled={pendingAttachments.length >= maxAttachments}
          />
        )}

        {/* Location picker modal */}
        {showLocationModal && (
          <LocationPickerModal
            onClose={() => setShowLocationModal(false)}
            onSelect={(place) => {
              setShowLocationModal(false);
              onPickPlace?.(place);
            }}
          />
        )}

        {/* Attachments preview (ảnh + địa điểm lộn xộn, tối đa maxAttachments) */}
        <AttachmentsPreviewBar
          attachments={pendingAttachments}
          onRemove={onRemoveAttachment}
          maxCount={maxAttachments}
        />

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
            placeholder={`Nhắn tin ${group.name}...`}
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
          <button
            onClick={() => canSend && onSend()}
            disabled={!canSend}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
              canSend ? "bg-primary text-white hover:bg-primary-container" : "bg-gray-400 text-white cursor-not-allowed"
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
