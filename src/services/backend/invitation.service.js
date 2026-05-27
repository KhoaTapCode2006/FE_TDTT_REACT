// ─── invitation.service.js ────────────────────────────────────────────────────
// PATCH /invitations/{invitation_id} — accept hoặc decline lời mời trip

import axios from "axios";
import { auth } from "@/config/firebase";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_LOCAL_API ||
  "http://localhost:8000";

const invitationClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

invitationClient.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated");
  const token = await currentUser.getIdToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

invitationClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const appError = new Error(
      err.response?.data?.message || err.message || "Request failed"
    );
    appError.statusCode = err.response?.status;
    return Promise.reject(appError);
  }
);

export const invitationService = {
  /**
   * Accept hoặc decline lời mời
   * PATCH /invitations/{invitationId}
   * Body: { status: "accepted" | "declined" }
   */
  async respond(invitationId, status) {
    const response = await invitationClient.patch(
      `/invitations/${invitationId}`,
      { status }
    );
    return response.data;
  },

  accept(invitationId) {
    return this.respond(invitationId, "accepted");
  },

  decline(invitationId) {
    return this.respond(invitationId, "declined");
  },
};

export default invitationService;
