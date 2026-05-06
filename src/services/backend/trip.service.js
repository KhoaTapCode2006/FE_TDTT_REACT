// ─── Mock Data (API schema format) ───────────────────────────────────────────

const MOCK_API_TRIP = {
  id: "trip_001",
  owner_uid: "nGUVEXtQgqhvxmaxHplZ93sPomm2",
  name: "Đà Lạt mùa hoa",
  place_id: "ChIJN1t_tDeuEmsRUsoyG83frY4",
  start_at: "2026-06-10T00:00:00.000Z",
  end_at: "2026-06-15T00:00:00.000Z",
  status: "waiting",
  member_uids: ["uid_kaka_007", "uid_sarah_001", "uid_alex_001"],
  created_at: "2026-05-05T04:55:31.315Z",
  updated_at: "2026-05-05T04:55:31.315Z",
};

const MOCK_API_TRIP_ACTIVE = {
  id: "trip_002",
  owner_uid: "uid_sophie_001",
  name: "Hội An phố cổ",
  place_id: "ChIJoRgWd1dZRjERh7a0ynfNjvM",
  start_at: "2026-05-01T00:00:00.000Z",
  end_at: "2026-05-08T00:00:00.000Z",
  status: "active",
  member_uids: ["uid_sophie_001", "uid_pierre_001", "uid_claire_001"],
  created_at: "2026-04-20T09:00:00.000Z",
  updated_at: "2026-05-01T08:30:00.000Z",
};

const MOCK_API_TRIP_ENDED = {
  id: "trip_003",
  owner_uid: "uid_kenji_001",
  name: "Hà Nội mùa thu",
  place_id: "ChIJ85bPwnNrNTERSBnRFcgQ6Ys",
  start_at: "2026-03-15T00:00:00.000Z",
  end_at: "2026-03-20T00:00:00.000Z",
  status: "ended",
  member_uids: ["uid_kenji_001", "uid_yuki_001", "uid_hana_001"],
  created_at: "2026-03-01T10:00:00.000Z",
  updated_at: "2026-03-20T18:00:00.000Z",
};

// ─── Normalize ────────────────────────────────────────────────────────────────

/**
 * Normalize a raw API trip object into the UI format used by TripPage.
 * @param {object} t - Raw trip from API / mock
 * @returns {object} Normalized trip for UI
 */
export function normalizeMockTrip(t) {
  const fmt = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const uids = Array.isArray(t.member_uids) ? t.member_uids : [];
  const avatars = uids.slice(0, 2).map((uid) => uid.slice(0, 2).toUpperCase());
  const s = fmt(t.start_at);
  const e = fmt(t.end_at);

  return {
    id: t.id,
    owner_uid: t.owner_uid,
    title: t.name || "Untitled Trip",
    place_id: t.place_id || "",
    status: t.status || "waiting",
    dateRange: s && e ? `${s} - ${e}` : "TBD",
    dateFrom: t.start_at || "",
    dateTo: t.end_at || "",
    members: uids.length,
    member_uids: uids,
    avatars,
    extra: Math.max(0, uids.length - 2),
    created_at: t.created_at || "",
    updated_at: t.updated_at || "",
  };
}

// ─── Mock Trip List ───────────────────────────────────────────────────────────

export const MOCK_TRIPS = [
  normalizeMockTrip(MOCK_API_TRIP),
  normalizeMockTrip(MOCK_API_TRIP_ACTIVE),
  normalizeMockTrip(MOCK_API_TRIP_ENDED),
];

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Fetch all trips for the current user.
 * Currently returns mock data; replace with real API call when ready.
 * @returns {Promise<object[]>} List of normalized trips
 */
export async function getTrips() {
  return Promise.resolve([...MOCK_TRIPS]);
}

/**
 * Fetch a single trip by ID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getTripById(id) {
  const trip = MOCK_TRIPS.find((t) => t.id === id) ?? null;
  return Promise.resolve(trip);
}
