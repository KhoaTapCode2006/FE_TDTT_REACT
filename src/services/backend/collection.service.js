import axios from "axios";

const COLLECTION_BASE_URL = "/api/v1/collections";

const MOCK_COLLECTION_RESPONSE = {
  id: "col_889900",
  owner_uid: "uid_huy_001",
  name: "Danh sách phòng KHTN đi Đà Lạt",
  description: "Tuyển tập các homestay và khách sạn view đồi núi, có chỗ BBQ cho nhóm.",
  thumbnail_url: "https://placehold.co/800x400?text=Da+Lat+Trip",
  created_at: "2026-04-20T10:00:00Z",
  updated_at: "2026-04-28T17:00:00Z",
  liked_count: 2,
  liked: [
    {
      uid: "uid_khoa_002",
      liked_at: "2026-04-21T08:30:00Z",
    },
    {
      uid: "uid_hau_004",
      liked_at: "2026-04-22T09:15:00Z",
    },
  ],
  collaborators: [
    {
      uid: "uid_khoa_002",
      display_name: "Anh Khoa",
      username: "khoa.khtn",
      avatar_url: "https://placehold.co/100x100?text=K",
      contributed_count: 1,
      joined_at: "2026-04-20T11:00:00Z",
    },
    {
      uid: "uid_dang_003",
      display_name: "Đăng",
      username: "dang.dev",
      avatar_url: null,
      contributed_count: 0,
      joined_at: "2026-04-21T10:00:00Z",
    },
  ],
  places: [
    {
      place_id: "place_101",
      added_at: "2026-04-20T10:30:00Z",
      added_by: "uid_huy_001",
    },
    {
      place_id: "place_102",
      added_at: "2026-04-21T11:00:00Z",
      added_by: "uid_khoa_002",
    },
  ],
  tags: ["đà lạt", "homestay", "view núi", "nhóm 4 người"],
  visibility: "public",
};

function cloneCollection(collection) {
  return JSON.parse(JSON.stringify(collection));
}

function normalizeArray(value) {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

export const collectionService = {
  async getCollection(collectionId) {
    const url = `${COLLECTION_BASE_URL}/${collectionId}`;
    const payload = {};

    // Thực tế API call example:
    // const response = await axios.get(url);
    // return response.data;

    const mockCollection = cloneCollection(MOCK_COLLECTION_RESPONSE);
    mockCollection.id = collectionId;
    return Promise.resolve(mockCollection);
  },

  async addPlaces(collectionId, placeIds) {
    const ids = normalizeArray(placeIds);
    const payload = {
      places: ids,
    };

    // Thực tế API call example:
    // const response = await axios.post(`${COLLECTION_BASE_URL}/${collectionId}/places`, payload);
    // return response.data;

    const mockCollection = cloneCollection(MOCK_COLLECTION_RESPONSE);
    const newPlaces = ids.map((placeId) => ({
      place_id: placeId,
      added_at: new Date().toISOString(),
      added_by: "uid_huy_001",
    }));
    mockCollection.places = [...(mockCollection.places || []), ...newPlaces];
    return Promise.resolve(mockCollection);
  },

  async addTags(collectionId, tags) {
    const normalizedTags = normalizeArray(tags);
    const payload = {
      tags: normalizedTags,
    };

    // Thực tế API call example:
    // const response = await axios.post(`${COLLECTION_BASE_URL}/${collectionId}/tags`, payload);
    // return response.data;

    const mockCollection = cloneCollection(MOCK_COLLECTION_RESPONSE);
    mockCollection.tags = [...new Set([...(mockCollection.tags || []), ...normalizedTags])];
    return Promise.resolve(mockCollection);
  },

  async addCollaborators(collectionId, collaborators) {
    const ids = normalizeArray(collaborators);
    const payload = {
      collaborators: ids,
    };

    // Thực tế API call example:
    // const response = await axios.post(`${COLLECTION_BASE_URL}/${collectionId}/collaborators`, payload);
    // return response.data;

    const mockCollection = cloneCollection(MOCK_COLLECTION_RESPONSE);
    const newCollaborators = ids.map((uid) => ({
      uid,
      username: uid,
      display_name: "Thành viên mới",
      avatar_url: null,
      contributed_count: 0,
      joined_at: new Date().toISOString(),
    }));
    mockCollection.collaborators = [...(mockCollection.collaborators || []), ...newCollaborators];
    return Promise.resolve(mockCollection);
  },
};
