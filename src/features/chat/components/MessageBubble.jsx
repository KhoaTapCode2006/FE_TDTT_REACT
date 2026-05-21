import { useState, useEffect } from "react";
import Avatar from "./Avatar";
import { getHotelById } from "@/services/backend/discover.service";
import HotelPopup from "@/components/hotel/components/HotelPopup";
import { useTypewriter } from "@/hooks/useTypewriter";

// ─── Message Bubble ───────────────────────────────────────────────────────────
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

// ─── Place Card ───────────────────────────────────────────────────────────────
function PlaceCard({ attachment, isMine, fallbackText }) {
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const placeId = attachment?.value ?? null;

  useEffect(() => {
    if (!placeId) return;
    let cancelled = false;
    setLoading(true);
    getHotelById(placeId).then((data) => {
      if (!cancelled) {
        if (data) setHotel(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [placeId]);

  const thumbnail   = hotel?.images?.[0]?.thumbnail ?? null;
  const name        = hotel?.name ?? attachment?.metadata?.name ?? fallbackText ?? "Địa điểm";
  const price       = hotel?.price ?? null;
  const rawRating   = hotel?.raw_rating ?? null;
  const reviewCount = hotel?.user_reviews?.length ?? null;
  const amenities   = hotel?.amenities ?? [];

  const popupHotel = hotel ? {
    ...hotel,
    rating: hotel.raw_rating ?? 0,
    pricePerNight: hotel.price ?? 0,
    images: hotel.images?.map((img) => img.original_image ?? img.thumbnail).filter(Boolean) ?? [],
    reviews: hotel.user_reviews?.map((r) => ({
      author: "Khách",
      content: r.text,
      raw_star: r.raw_stars,
    })) ?? [],
    nearbyLandmarks: hotel.nearby_places ?? [],
  } : null;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-card w-full overflow-hidden flex flex-col h-full">
        {/* Thumbnail */}
        <div className="relative">
          {thumbnail ? (
            <img src={thumbnail} alt={name} className="w-full h-40 object-cover" />
          ) : (
            <div className="w-full h-40 bg-green-50 flex items-center justify-center">
              {loading ? (
                <svg className="w-6 h-6 text-green-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-3 pt-2.5 pb-3 flex flex-col gap-2 flex-1 justify-between">
          <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{name}</p>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <span className="text-yellow-400 text-sm">★</span>
              <span className="text-sm font-semibold text-gray-800">
                {rawRating > 0 ? rawRating.toFixed(2) : "—"}
              </span>
              {reviewCount != null && reviewCount > 0 && (
                <span className="text-xs text-gray-400">({reviewCount} đánh giá)</span>
              )}
            </div>
            {price != null && (
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-gray-900">{price.toLocaleString("vi-VN")} đ</p>
                <p className="text-xs text-gray-400">/ đêm</p>
              </div>
            )}
          </div>

          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {amenities.slice(0, 3).map((a, i) => (
                <span key={i} className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 truncate max-w-[90px]">
                  {a}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowPopup(true)}
            className="mt-0.5 w-full text-center text-sm font-semibold text-blue-500 border border-blue-300 rounded-xl py-1.5 hover:bg-blue-50 transition-colors"
          >
            Xem chi tiết
          </button>
        </div>
      </div>

      {showPopup && popupHotel && (
        <HotelPopup hotel={popupHotel} onClose={() => setShowPopup(false)} />
      )}
    </>
  );
}

// ─── Chatbot Message ──────────────────────────────────────────────────────────
const TYPEWRITER_SPEED_MS = 18; // ms mỗi ký tự
const RECS_PER_PAGE = 2;

function ChatbotMessage({ msg }) {
  const recommendations = msg.chatbotRecommendations ?? [];

  // Lấy answer từ Firestore (đã được parse bởi subscribeToMessages)
  // và truyền thẳng vào useTypewriter — luôn animate khi component mount lần đầu
  const answer = msg.chatbotAnswer ?? msg.text ?? '';
  const [frozenAnswer] = useState(() => answer);

  const displayed = useTypewriter(frozenAnswer, TYPEWRITER_SPEED_MS, 'char');
  const done = displayed.length >= frozenAnswer.length;

  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(recommendations.length / RECS_PER_PAGE);
  const visibleRecs = recommendations.slice(page * RECS_PER_PAGE, page * RECS_PER_PAGE + RECS_PER_PAGE);

  return (
    <div className="flex flex-col gap-2">
      {(displayed || !done) && (
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed bg-white text-gray-800 border border-gray-100 shadow-card max-w-[560px] w-fit">
          {displayed}
          {!done && (
            <span className="inline-block w-[2px] h-[1em] bg-gray-400 ml-0.5 align-middle animate-pulse" />
          )}
        </div>
      )}

      {done && recommendations.length > 0 && (
        <div className="flex flex-col gap-2">
          {/* Header: label + pagination dots */}
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold text-gray-400">Gợi ý cho bạn</p>
            {totalPages > 1 && (
              <span className="text-xs text-gray-400">
                {page + 1} / {totalPages}
              </span>
            )}
          </div>

          {/* Cards + nav buttons */}
          <div className="flex items-center gap-2">
            {/* Prev button */}
            {totalPages > 1 && (
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="shrink-0 w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center shadow hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2 flex-1 items-stretch">
              {visibleRecs.map((rec, i) => (
                <PlaceCard
                  key={rec.property_token ?? (page * RECS_PER_PAGE + i)}
                  attachment={{
                    type: 'place',
                    value: rec.property_token ?? rec.name ?? '',
                    metadata: { name: rec.name ?? '', address: '' },
                  }}
                  isMine={false}
                  fallbackText={rec.name ?? 'Khách sạn'}
                />
              ))}
            </div>

            {/* Next button */}
            {totalPages > 1 && (
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="shrink-0 w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center shadow hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MessageContent({ msg }) {
  const attachments = msg.attachments ?? [];

  if (msg.isChatbot) {
    return <ChatbotMessage msg={msg} />;
  }

  if (attachments.length > 0) {
    return (
      <div className={`flex flex-col gap-2 ${msg.isMine ? "items-end" : "items-start"}`}>
        {attachments.map((att, idx) => {
          if (att.type === "image") {
            return att.value ? (
              <img key={idx} src={att.value} alt="ảnh" className="w-64 rounded-2xl object-cover shadow-card block" />
            ) : (
              <div key={idx} className="rounded-2xl overflow-hidden w-64 shadow-card">
                <div className="w-full h-40" style={{ background: "linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%)" }} />
              </div>
            );
          }
          if (att.type === "place") {
            return (
              <PlaceCard key={idx} attachment={att} isMine={msg.isMine} fallbackText={msg.placeName ?? msg.text} />
            );
          }
          return null;
        })}
        {msg.text && (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-card inline-block max-w-[400px] ${
            msg.isMine ? "bg-primary text-white rounded-tr-sm" : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
          }`}>
            {msg.text}
          </div>
        )}
      </div>
    );
  }

  switch (msg.type) {
    case "image":
      return (
        <div className={`flex flex-col gap-1 ${msg.isMine ? "items-end" : "items-start"}`}>
          {msg.url ? (
            <img src={msg.url} alt="ảnh" className="w-64 rounded-2xl object-cover shadow-card block" />
          ) : (
            <div className="rounded-2xl overflow-hidden w-64 shadow-card">
              <div className="w-full h-40" style={{ background: "linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%)" }} />
            </div>
          )}
          {msg.text && (
            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-card inline-block max-w-[400px] ${
              msg.isMine ? "bg-primary text-white rounded-tr-sm" : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
            }`}>
              {msg.text}
            </div>
          )}
        </div>
      );

    case "video":
      return msg.url ? (
        <video src={msg.url} controls className="w-64 rounded-2xl shadow-card" />
      ) : (
        <div className="w-64 h-36 rounded-2xl bg-gray-800 flex items-center justify-center shadow-card">
          <span className="text-white text-3xl">▶</span>
        </div>
      );

    case "file":
      return (
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-card w-64">
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
            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-card inline-block max-w-[400px] ${
              msg.isMine ? "bg-primary text-white rounded-tr-sm" : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
            }`}>
              {msg.text}
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-card inline-block max-w-[400px] ${
          msg.isMine ? "bg-primary text-white rounded-tr-sm" : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
        }`}>
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
          <div className="max-w-[400px] flex flex-col items-end">
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
      <div className={msg.isChatbot ? "max-w-[640px]" : "max-w-[400px]"}>
        <p className="text-xs font-semibold text-gray-500 mb-1">{msg.sender}</p>
        <MessageContent msg={msg} />
        <p className="text-xs text-gray-400 mt-1">{msg.time}</p>
      </div>
    </div>
  );
}

export default MessageBubble;
