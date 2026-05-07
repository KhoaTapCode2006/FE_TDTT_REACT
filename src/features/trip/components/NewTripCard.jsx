// ─── NewTripCard ──────────────────────────────────────────────────────────────
// Card placeholder dạng dashed border để tạo chuyến đi mới.
function NewTripCard({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-blue-50/60 border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center gap-3 h-full min-h-[340px] hover:bg-blue-50 hover:border-blue-300 transition-colors group"
    >
      <div className="w-12 h-12 rounded-full border-2 border-blue-300 flex items-center justify-center text-blue-400 text-2xl group-hover:border-blue-400 group-hover:text-blue-500 transition-colors">
        +
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700">Start a new journey</p>
        <p className="text-xs text-gray-400 mt-0.5">Collaborate with your group today</p>
      </div>
    </button>
  );
}

export default NewTripCard;
