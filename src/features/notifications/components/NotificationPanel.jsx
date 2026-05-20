// ─── NotificationPanel ────────────────────────────────────────────────────────
// Dropdown hiển thị danh sách notifications, hỗ trợ accept/decline invitation.

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { invitationService } from "../../../services/backend/invitation.service";

function timeAgo(val) {
  if (!val) return "";
  const date = typeof val?.toDate === "function" ? val.toDate() : new Date(val);
  if (isNaN(date.getTime())) return "";
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

// ─── Dropdown menu 3 chấm dùng chung ─────────────────────────────────────────
function NotifMenu({ notif, onMarkAsRead, onDelete }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="text-gray-400 hover:text-gray-600 mt-0.5 p-1 rounded-md hover:bg-gray-100 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-7 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-10 py-1 overflow-hidden">
          {!notif.read && (
            <button
              onClick={(e) => { e.stopPropagation(); onMarkAsRead(notif.id); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Đánh dấu đã đọc
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(notif.id); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Xóa thông báo
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Invitation item ──────────────────────────────────────────────────────────
function InvitationItem({ notif, onMarkAsRead, onDelete }) {
  const [status, setStatus] = useState(null); // null | "accepting" | "declining" | "accepted" | "declined" | "error"
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  // Phân biệt invitation trip vs chat dựa trên ref_type (nếu có) hoặc content
  const isChatInvitation =
    notif.ref_type === "conversation" ||
    (typeof notif.content === "string" &&
      (notif.content.includes("nhóm chat") || notif.content.includes("group chat")));

  const handleAccept = async () => {
    setStatus("accepting");
    setErrorMsg("");
    try {
      await invitationService.accept(notif.ref_id);
      setStatus("accepted");
      onMarkAsRead(notif.id);
      setTimeout(() => navigate(isChatInvitation ? "/chat" : "/trips"), 1500);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Có lỗi xảy ra");
    }
  };

  const handleDecline = async () => {
    setStatus("declining");
    setErrorMsg("");
    try {
      await invitationService.decline(notif.ref_id);
      setStatus("declined");
      onMarkAsRead(notif.id);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Có lỗi xảy ra");
    }
  };

  const isLoading = status === "accepting" || status === "declining";
  const senderName = notif.sender_name || notif.senderName || "";
  const avatarUrl = notif.sender_avatar || notif.senderAvatar || "";

  return (
    <div className={`px-4 py-3 border-b border-gray-100 last:border-0 ${!notif.read ? "bg-green-50/30" : "bg-white"}`}>
      <div className="flex items-start gap-3">
        {/* Unread dot */}
        <div className="flex items-center justify-center w-3 shrink-0 mt-2">
          {!notif.read && <div className="w-2.5 h-2.5 rounded-full bg-[#1a3a2a]" />}
        </div>

        {/* Avatar + badge */}
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={senderName} className="w-11 h-11 rounded-full object-cover border border-gray-200" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
              {getInitials(senderName) || "?"}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1a3a2a] flex items-center justify-center border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {/* Nội dung */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-snug">{notif.content}</p>
          <p className="text-xs text-gray-400 mt-0.5">{timeAgo(notif.send_at)}</p>

          {status === null && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleDecline}
                disabled={isLoading}
                className="flex-1 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Từ chối
              </button>
              <button
                onClick={handleAccept}
                disabled={isLoading}
                className="flex-1 py-2 rounded-xl bg-[#1a3a2a] text-white text-sm font-semibold hover:bg-[#2d5a40] transition-colors disabled:opacity-50"
              >
                Chấp nhận
              </button>
            </div>
          )}
          {status === "accepting" && <p className="text-xs text-green-600 mt-2">Đang chấp nhận...</p>}
          {status === "declining" && <p className="text-xs text-gray-400 mt-2">Đang từ chối...</p>}
          {status === "accepted" && <p className="text-xs text-green-600 font-medium mt-2">✓ Đã chấp nhận lời mời</p>}
          {status === "declined" && <p className="text-xs text-gray-400 mt-2">✗ Đã từ chối lời mời</p>}
          {status === "error" && <p className="text-xs text-red-500 mt-2">{errorMsg}</p>}
        </div>

        {/* Menu 3 chấm */}
        <NotifMenu notif={notif} onMarkAsRead={onMarkAsRead} onDelete={onDelete} />
      </div>
    </div>
  );
}

// ─── Generic item ─────────────────────────────────────────────────────────────
function GenericItem({ notif, onMarkAsRead, onDelete }) {
  const senderName = notif.sender_name || notif.senderName || "";
  const avatarUrl = notif.sender_avatar || notif.senderAvatar || "";

  return (
    <div className={`px-4 py-3 border-b border-gray-100 last:border-0 ${!notif.read ? "bg-green-50/30" : "bg-white"}`}>
      <div className="flex items-start gap-3">
        {/* Unread dot */}
        <div className="flex items-center justify-center w-3 shrink-0 mt-2">
          {!notif.read && <div className="w-2.5 h-2.5 rounded-full bg-[#1a3a2a]" />}
        </div>

        {/* Avatar */}
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={senderName} className="w-11 h-11 rounded-full object-cover border border-gray-200" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-snug">{notif.content}</p>
          <p className="text-xs text-gray-400 mt-0.5">{timeAgo(notif.send_at)}</p>
        </div>

        {/* Menu 3 chấm */}
        <NotifMenu notif={notif} onMarkAsRead={onMarkAsRead} onDelete={onDelete} />
      </div>
    </div>
  );
}

// ─── NotificationPanel ────────────────────────────────────────────────────────
export default function NotificationPanel({ notifications, onMarkAsRead, onDeleteNotification }) {
  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-900">Thông báo</h3>
        {/* Icon cài đặt */}
        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* List */}
      <div className="max-h-[480px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm font-medium">Không có thông báo nào</p>
          </div>
        ) : (
          notifications.map((notif) =>
            notif.type === "invitation" ? (
              <InvitationItem
                key={notif.id}
                notif={notif}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDeleteNotification}
              />
            ) : (
              <GenericItem
                key={notif.id}
                notif={notif}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDeleteNotification}
              />
            )
          )
        )}
      </div>
    </div>
  );
}
