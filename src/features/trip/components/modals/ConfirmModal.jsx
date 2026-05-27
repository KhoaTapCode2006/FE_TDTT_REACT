// ─── ConfirmModal (Trip) ──────────────────────────────────────────────────────
// Modal xác nhận dùng chung cho các hành động nguy hiểm trong Trip feature.

function ConfirmModal({ title, message, confirmLabel = "Xác nhận", confirmClassName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        {message && <p className="text-sm text-gray-500 leading-relaxed">{message}</p>}

        <div className="flex gap-3 justify-end mt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className={confirmClassName ?? "px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
