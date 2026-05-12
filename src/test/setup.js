import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase auth
vi.mock('@/config/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-123',
      getIdToken: vi.fn().mockResolvedValue('mock-token'),
    },
  },
}));
