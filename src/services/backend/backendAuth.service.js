import axios from 'axios';
import { auth } from '@/config/firebase';

const API_BASE_URL = import.meta.env.VITE_LOCAL_API || 'http://localhost:8000';

/**
 * Authenticate with backend using Firebase ID token.
 * Must be called after Firebase login to register/sync user in backend DB.
 * Endpoint: POST /auth
 */
export async function authenticateWithBackend() {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  const token = await currentUser.getIdToken();
  const response = await axios.post(
    `${API_BASE_URL}/auth`,
    { token },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
}
