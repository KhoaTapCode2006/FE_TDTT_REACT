import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
});

function unwrapResponse(response) {
  if (!response?.data) {
    return null;
  }

  const payload = response.data;
  if (payload?.data !== undefined) {
    return payload.data;
  }
  return payload;
}

function getCollectionPayload(response) {
  const data = unwrapResponse(response);
  return data?.collection ?? data;
}

export const collectionService = {
  getCollection,
  updateCollection,
  addPlacesToCollection,
  removePlaceFromCollection,
  addCollaboratorsToCollection,
  removeCollaboratorFromCollection,
  addTagsToCollection,
  removeTagFromCollection,
};

async function getCollection(collectionId) {
  const response = await apiClient.get(`/collections/${encodeURIComponent(collectionId)}`);
  return getCollectionPayload(response);
}

async function updateCollection(collectionId, payload) {
  const response = await apiClient.patch(
    `/collections/${encodeURIComponent(collectionId)}`,
    payload
  );
  return getCollectionPayload(response);
}

async function addPlacesToCollection(collectionId, placeIds) {
  const response = await apiClient.post(
    `/collections/${encodeURIComponent(collectionId)}/places`,
    {
      place_ids: Array.isArray(placeIds) ? placeIds : [placeIds],
    }
  );
  return getCollectionPayload(response);
}

async function removePlaceFromCollection(collectionId, placeId) {
  const response = await apiClient.delete(
    `/collections/${encodeURIComponent(collectionId)}/places`,
    {
      data: {
        place_ids: [placeId],
      },
    }
  );
  return getCollectionPayload(response);
}

async function addCollaboratorsToCollection(collectionId, collaboratorUids) {
  const response = await apiClient.post(
    `/collections/${encodeURIComponent(collectionId)}/collaborators`,
    {
      collaborator_uids: Array.isArray(collaboratorUids)
        ? collaboratorUids
        : [collaboratorUids],
    }
  );
  return getCollectionPayload(response);
}

async function removeCollaboratorFromCollection(collectionId, collaboratorUid) {
  const response = await apiClient.delete(
    `/collections/${encodeURIComponent(collectionId)}/collaborators`,
    {
      data: {
        collaborator_uids: [collaboratorUid],
      },
    }
  );
  return getCollectionPayload(response);
}

async function addTagsToCollection(collectionId, tags) {
  const response = await apiClient.post(
    `/collections/${encodeURIComponent(collectionId)}/tags`,
    {
      tags: Array.isArray(tags) ? tags : [tags],
    }
  );
  return getCollectionPayload(response);
}

async function removeTagFromCollection(collectionId, tag) {
  const response = await apiClient.delete(
    `/collections/${encodeURIComponent(collectionId)}/tags`,
    {
      data: {
        tags: [tag],
      },
    }
  );
  return getCollectionPayload(response);
}
