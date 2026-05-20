// ─── NotificationPanel ────────────────────────────────────────────────────────
// Dropdown hiển thị danh sách notifications, hỗ trợ accept/decline invitation.

import { useState } from "react";
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

function InvitationItem({ notif, onMarkAsRead }) {
  const [status, setStatus] = useState(null); // null | "accepting" | "declining" | "accepted" | "declined" | "error"
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleAccept = async () => {
    setStatus("accepting");
    setErrorMsg("");
    try {
      await invitationService.accept(notif.ref_id);
      setStatus("accepted");
      onMarkAsRead(notif.id);
      // Chờ backend xử lý xong rồi mới navigate
      setTimeout(() => navigate("/trips"), 1500);
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

  return (
    <div className={`px-4 py-3 border-b border-gray-100 last:border-0 ${!notif.read ? "bg-blue-50/40" : ""}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-snug">{notif.content}</p>
          <p className="text-xs text-gray-400 mt-0.5">{timeAgo(notif.send_at)}</p>

          {/* Buttons */}
          {status === null && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAccept}
                disabled={isLoading}
                className="px-3 py-1 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Chấp nhận
              </button>
              <button
                onClick={handleDecline}
                disabled={isLoading}
                className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Từ chối
              </button>
            </div>
          )}

          {status === "accepting" && (
            <p className="text-xs text-blue-500 mt-2">Đang chấp nhận...</p>
          )}
          {status === "declining" && (
            <p className="text-xs text-gray-400 mt-2">Đang từ chối...</p>
          )}
          {status === "accepted" && (
            <p className="text-xs text-green-600 font-medium mt-2">✓ Đã chấp nhận</p>
          )}
          {status === "declined" && (
            <p className="text-xs text-gray-400 mt-2">✗ Đã từ chối</p>
          )}
          {status === "error" && (
            <p className="text-xs text-red-500 mt-2">{errorMsg}</p>
          )}
        </div>

        {/* Unread dot */}
        {!notif.read && (
          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
        )}
      </div>
    </div>
  );
}

function GenericItem({ notif, onMarkAsRead }) {
  return (
    <div
      className={`px-4 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.read ? "bg-blue-50/40" : ""}`}
      onClick={() => !notif.read && onMarkAsRead(notif.id)}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-snug">{notif.content}</p>
          <p className="text-xs text-gray-400 mt-0.5">{timeAgo(notif.send_at)}</p>
        </div>
        {!notif.read && (
          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
        )}
      </div>
    </div>
  );
}

export default function NotificationPanel({ notifications, onMarkAsRead, onMarkAllAsRead, onClose }) {
  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900">Thông báo</h3>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={onMarkAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm">Không có thông báo</p>
          </div>
        ) : (
          notifications.map((notif) =>
            notif.type === "invitation" ? (
              <InvitationItem key={notif.id} notif={notif} onMarkAsRead={onMarkAsRead} />
            ) : (
              <GenericItem key={notif.id} notif={notif} onMarkAsRead={onMarkAsRead} />
            )
          )
        )}
      </div>
    </div>
  );
}
