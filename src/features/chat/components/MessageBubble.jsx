import { useState, useEffect } from "react";
import Avatar from "./Avatar";
import { getHotelById } from "@/services/backend/discover.service";

// ─── Message Bubble ───────────────────────────────────────────────────────────
// Render một tin nhắn trong cuộc trò chuyện. 
// Xử lý 5 loại nội dung khác nhau: text, image, video, file, place.
// Tự điều chỉnh layout tùy thuộc tin nhắn là của mình (isMine) hay của người khác
function DeleteBtn({ onDelete, msgId }) {
  return (
    <button
      onClick={() => onDelete(msgId)}
      className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors opacity-0 group-hover:opacity-100 self-center shrink-0"
      title="Xóa tin nhắn"
    >
      Xóa
    </button>
  );
}

// ─── Place Card (fetch hotel details khi có placeId) ─────────────────────────
function PlaceCard({ attachment, isMine, fallbackText }) {
  const [hotel, setHotel] = useState(null);

  // attachment.value là property_token
  const placeId = attachment?.value ?? null;

  useEffect(() => {
    if (!placeId) return;
    let cancelled = false;
    getHotelById(placeId).then((data) => {
      if (!cancelled && data) setHotel(data);
    });
    return () => { cancelled = true; };
  }, [placeId]);

  const thumbnail = hotel?.images?.[0]?.thumbnail ?? null;
  const name      = hotel?.name ?? attachment?.metadata?.name ?? fallbackText ?? "Địa điểm";
  const address   = hotel?.address ?? attachment?.metadata?.address ?? null;
  const price     = hotel?.price ?? null;
  const deal      = hotel?.deal ?? null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-card w-56 overflow-hidden">
      {/* Thumbnail */}
      {thumbnail ? (
        <img src={thumbnail} alt={name} className="w-full h-28 object-cover" />
      ) : (
        <div className="w-full h-28 bg-green-50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        </div>
      )}
      {/* Info */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center text-green-500 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-800 truncate">{name}</p>
          {address && <p className="text-xs text-gray-400 truncate">{address}</p>}
          {(price != null || deal) && (
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              {price != null && (
                <span className="text-xs font-medium text-blue-500">
                  {price.toLocaleString("vi-VN")}₫
                </span>
              )}
              {deal && (
                <span className="text-xs text-green-500 truncate">{deal}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function MessageContent({ msg }) {
  const attachments = msg.attachments ?? [];

  // Nếu có attachments array (multi-attachment), render tất cả theo thứ tự
  if (attachments.length > 0) {
    return (
      <div className={`flex flex-col gap-2 ${msg.isMine ? "items-end" : "items-start"}`}>
        {attachments.map((att, idx) => {
          if (att.type === "image") {
            return att.value ? (
              <img
                key={idx}
                src={att.value}
                alt="ảnh"
                className="w-56 rounded-2xl object-cover shadow-card block"
              />
            ) : (
              <div key={idx} className="rounded-2xl overflow-hidden w-56 shadow-card">
                <div
                  className="w-full h-36"
                  style={{ background: "linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%)" }}
                />
              </div>
            );
          }
          if (att.type === "place") {
            return (
              <PlaceCard
                key={idx}
                attachment={att}
                isMine={msg.isMine}
                fallbackText={msg.placeName ?? msg.text}
              />
            );
          }
          return null;
        })}
        {/* Text caption bên dưới nếu có */}
        {msg.text && (
          <div
            className={`px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-card inline-block max-w-xs ${
              msg.isMine
                ? "bg-primary text-white rounded-tr-sm"
                : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
            }`}
          >
            {msg.text}
          </div>
        )}
      </div>
    );
  }

  // Fallback: legacy single-attachment hoặc text thuần
  switch (msg.type) {
    case "image":
      return (
        <div className={`flex flex-col gap-1 ${msg.isMine ? "items-end" : "items-start"}`}>
          {msg.url ? (
            <img src={msg.url} alt="ảnh" className="w-56 rounded-2xl object-cover shadow-card block" />
          ) : (
            <div className="rounded-2xl overflow-hidden w-56 shadow-card">
              <div
                className="w-full h-36"
                style={{ background: "linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%)" }}
              />
            </div>
          )}
          {msg.text && (
            <div
              className={`px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-card inline-block max-w-xs ${
                msg.isMine
                  ? "bg-primary text-white rounded-tr-sm"
                  : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
              }`}
            >
              {msg.text}
            </div>
          )}
        </div>
      );

    case "video":
      return msg.url ? (
        <video src={msg.url} controls className="w-56 rounded-2xl shadow-card" />
      ) : (
        <div className="w-56 h-32 rounded-2xl bg-gray-800 flex items-center justify-center shadow-card">
          <span className="text-white text-3xl">▶</span>
        </div>
      );

    case "file":
      return (
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-card w-56">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{msg.fileName ?? "file"}</p>
            <p className="text-xs text-gray-400">File đính kèm</p>
          </div>
        </div>
      );

    case "place":
      return (
        <div className={`flex flex-col gap-1 ${msg.isMine ? "items-end" : "items-start"}`}>
          <PlaceCard
            attachment={{ value: msg.placeId, metadata: { name: msg.placeName, address: msg.placeId } }}
            isMine={msg.isMine}
            fallbackText={msg.placeName ?? msg.text}
          />
          {msg.text && msg.placeName && (
            <div
              className={`px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-card inline-block max-w-xs ${
                msg.isMine
                  ? "bg-primary text-white rounded-tr-sm"
                  : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
              }`}
            >
              {msg.text}
            </div>
          )}
        </div>
      );

    default:
      return (
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-card inline-block max-w-xs ${
            msg.isMine
              ? "bg-primary text-white rounded-tr-sm"
              : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
          }`}
        >
          {msg.text}
        </div>
      );
  }
}

function MessageBubble({ msg, onDelete }) {
  if (msg.isMine) {
    return (
      <div className="flex flex-col items-end gap-1 mb-4">
        <div className="flex items-end gap-2 group">
          <DeleteBtn onDelete={onDelete} msgId={msg.id} />
          <div className="max-w-xs flex flex-col items-end">
            <MessageContent msg={msg} />
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-xs text-gray-400">{msg.time}</span>
              {msg.seen && <span className="text-primary text-xs">✓✓</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 mb-4">
      <Avatar initials={msg.avatar} size="md" color="#255dad" />
      <div className="max-w-xs">
        <p className="text-xs font-semibold text-gray-500 mb-1">{msg.sender}</p>
        <MessageContent msg={msg} />
        <p className="text-xs text-gray-400 mt-1">{msg.time}</p>
      </div>
    </div>
  );
}

export default MessageBubble;