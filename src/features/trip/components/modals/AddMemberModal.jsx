import { useState } from "react";

// ─── AddMemberModal ───────────────────────────────────────────────────────────
// Modal thêm thành viên vào trip bằng UID.
function AddMemberModal({ trip, onClose, onAdd }) {
  const [uid, setUid] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    if (!uid.trim()) return;
    onAdd(trip.id, uid.trim());
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Add Member</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors">✕</button>
          </div>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">User UID</label>
              <input
                autoFocus
                type="text"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="e.g. uid_john_001"
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
              />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={!uid.trim()}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default AddMemberModal;
