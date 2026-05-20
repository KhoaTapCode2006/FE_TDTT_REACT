// ─── trackingState ────────────────────────────────────────────────────────────
// Module-level flag để stop tất cả GPS push khi user logout.
// useGpsTracking và TripMapPanel đều check flag này trước khi push.

let _loggedOut = false;

export const trackingState = {
  setLoggedOut() { _loggedOut = true; },
  reset()        { _loggedOut = false; },
  isLoggedOut()  { return _loggedOut; },
};
