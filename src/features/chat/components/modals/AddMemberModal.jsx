import { useState } from "react";

// ─── Add Member Modal ─────────────────────────────────────────────────────────
// Modal thêm thành viên vào nhóm. Form đơn giản chỉ có một input nhập UID của người dùng cần thêm.
function AddMemberModal({ onClose, onAdd }) {
  const [uid, setUid] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!uid.trim()) return;
    onAdd(uid.trim());
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Thêm thành viên</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors text-lg"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">UID</label>
              <input
                autoFocus
                type="text"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="Nhập UID của thành viên"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!uid.trim()}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Thêm
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default AddMemberModal;