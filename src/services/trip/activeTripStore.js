// ─── activeTripStore ──────────────────────────────────────────────────────────
// Module-level store lưu trip IDs hiện tại của user.
// useTrip cập nhật khi trips thay đổi.
// AuthContext đọc khi logout để clear tracking.

let _tripIds = [];

export const activeTripStore = {
  set(ids) { _tripIds = ids ?? []; },
  get()    { return _tripIds; },
  clear()  { _tripIds = []; },
};
