import { useState } from "react";
import UserSuggestionAutocomplete from "../../../../components/autocomplete/UserSuggestionAutocomplete";

// ─── AddMemberModal ───────────────────────────────────────────────────────────
// Modal thêm thành viên vào trip. Sử dụng UserSuggestionAutocomplete component
function AddMemberModal({ trip, onClose, onAdd }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (user) => {
    setSelected(user);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!selected?.uid) return;
    onAdd(trip.id, selected.uid);
    onClose();
  };

  const handleClearSelection = () => {
    setSelected(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4 pointer-events-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Thêm thành viên</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Tìm kiếm người dùng</label>
              
              {/* User Suggestion Autocomplete */}
              {!selected && (
                <UserSuggestionAutocomplete
                  onSelect={handleSelect}
                  placeholder="Nhập tên hoặc username..."
                  autoFocus
                  ariaLabel="Tìm kiếm người dùng để thêm vào trip"
                />
              )}
            </div>

            {/* User đã chọn */}
            {selected && (
              <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
                {selected.avatar_url ? (
                  <img 
                    src={selected.avatar_url} 
                    alt={selected.display_name || selected.username} 
                    className="w-10 h-10 rounded-full object-cover" 
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white text-xs font-bold">
                    {(selected.display_name || selected.username || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {selected.display_name || selected.username}
                  </p>
                  {selected.username && selected.display_name && (
                    <p className="text-xs text-gray-400 truncate">@{selected.username}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={!selected?.uid}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Thêm
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default AddMemberModal;
