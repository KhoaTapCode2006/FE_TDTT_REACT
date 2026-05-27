import { useState, useEffect, useRef } from "react";
import { searchUsers } from "../../../../services/backend/chat.service";

// ─── Add Member Modal ─────────────────────────────────────────────────────────
// Modal mời thành viên vào nhóm chat.
// Gõ để tìm kiếm user → chọn → nhấn "Gửi lời mời".
// Backend sẽ tạo invitation và gửi notification cho user được mời.
// User được mời cần accept/decline qua NotificationPanel.
function AddMemberModal({ onClose, onAdd }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null); // { uid, display_name, username, avatar_url }
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  // Debounce search 300ms
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const users = await searchUsers(query);
        setResults(users);
      } catch (err) {
        console.error("[AddMemberModal] searchUsers error:", err);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelect = (user) => {
    setSelected(user);
    setQuery(user.display_name || user.username || user.uid);
    setResults([]);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const uid = selected?.uid || query.trim();
    if (!uid) return;

    setSending(true);
    setError("");
    try {
      await onAdd(uid);
      setSent(true);
      // Tự đóng modal sau 1.5s
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err?.message || "Không thể gửi lời mời. Thử lại sau.");
      setSending(false);
    }
  };

  const canSubmit = !sending && !sent && (selected?.uid || query.trim());

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={!sending ? onClose : undefined} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Mời thành viên</h3>
            <button
              onClick={onClose}
              disabled={sending}
              className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors text-lg disabled:opacity-40"
            >
              ✕
            </button>
          </div>

          {/* Trạng thái đã gửi */}
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-800">Đã gửi lời mời</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selected?.display_name || selected?.username || "Người dùng"} sẽ nhận được thông báo để chấp nhận.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Tìm kiếm người dùng
                </label>
                <div className="relative">
                  <input
                    autoFocus
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setSelected(null); setError(""); }}
                    placeholder="Nhập tên hoặc username..."
                    disabled={sending}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition pr-8 disabled:opacity-60"
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Dropdown kết quả */}
                {results.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                    {results.map((user) => (
                      <button
                        key={user.uid}
                        type="button"
                        onClick={() => handleSelect(user)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                      >
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.display_name}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(user.display_name || user.username || "?").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {user.display_name || user.username}
                          </p>
                          {user.username && user.display_name && (
                            <p className="text-xs text-gray-400 truncate">@{user.username}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Không tìm thấy */}
                {!searching && query.trim() && results.length === 0 && !selected && (
                  <p className="text-xs text-gray-400 mt-1">Không tìm thấy người dùng nào</p>
                )}
              </div>

              {/* User đã chọn */}
              {selected && (
                <div className="flex items-center gap-3 px-3 py-2 bg-primary/5 rounded-xl border border-primary/20">
                  {selected.avatar_url ? (
                    <img src={selected.avatar_url} alt={selected.display_name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                      {(selected.display_name || selected.username || "?").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{selected.display_name || selected.username}</p>
                    {selected.username && <p className="text-xs text-gray-400">@{selected.username}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelected(null); setQuery(""); setError(""); }}
                    disabled={sending}
                    className="text-gray-400 hover:text-gray-600 text-sm disabled:opacity-40"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={sending}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    "Gửi lời mời"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

export default AddMemberModal;
