import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { addDoc } from 'firebase/firestore';
import userEvent from '@testing-library/user-event';
import SavedListsPage from './SavedListsPage';
import * as savedListsService from '@/services/profile/savedLists.service';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-123' },
  }),
}));

// Mock the app context
vi.mock('@/app/AppContext', () => ({
  useApp: () => ({
    setClusterHotels: vi.fn(),
    setActiveHotel: vi.fn(),
  }),
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to render with router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('SavedListsPage - Task 7.2: Collection Creation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should create a new collection with correct Firestore data structure', async () => {
    // Mock personal lists
    vi.spyOn(savedListsService, 'fetchSavedLists').mockResolvedValue([]);

    // Mock global collections fetch
    const { getDocs } = await import('firebase/firestore');
    vi.mocked(getDocs).mockResolvedValue({
      forEach: () => {},
    });

    // Mock addDoc to capture the data being saved
    const mockDocRef = { id: 'new-collection-123' };
    vi.mocked(addDoc).mockResolvedValue(mockDocRef);

    const user = userEvent.setup();
    renderWithRouter(<SavedListsPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(savedListsService.fetchSavedLists).toHaveBeenCalled();
    });

    // Click "Create First Collection" button in empty state
    const createButton = screen.getByRole('button', { name: /create first collection/i });
    await user.click(createButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g., Beach Resorts/i)).toBeInTheDocument();
    });

    // Fill in the form
    const nameInput = screen.getByPlaceholderText(/e.g., Beach Resorts/i);
    const descriptionInput = screen.getByPlaceholderText(/Add a description/i);

    await user.type(nameInput, 'Beach Resorts Collection');
    await user.type(descriptionInput, 'Best beach resorts in Vietnam');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create collection/i });
    await user.click(submitButton);

    // Verify addDoc was called with correct data structure
    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled();
    });

    const addDocCall = vi.mocked(addDoc).mock.calls[0];
    const collectionData = addDocCall[1];

    // Verify all required fields are present
    expect(collectionData).toHaveProperty('owner_uid', 'test-user-123');
    expect(collectionData).toHaveProperty('name', 'Beach Resorts Collection');
    expect(collectionData).toHaveProperty('description', 'Best beach resorts in Vietnam');
    expect(collectionData).toHaveProperty('created_at');
    expect(collectionData).toHaveProperty('updated_at');
    expect(collectionData).toHaveProperty('places', []);
    expect(collectionData).toHaveProperty('count', 0);

    // Verify created_at and updated_at are Date objects
    expect(collectionData.created_at).toBeInstanceOf(Date);
    expect(collectionData.updated_at).toBeInstanceOf(Date);
  });

  it('should navigate to collection edit page after successful creation', async () => {
    // Mock personal lists
    vi.spyOn(savedListsService, 'fetchSavedLists').mockResolvedValue([]);

    // Mock global collections fetch
    const { getDocs } = await import('firebase/firestore');
    vi.mocked(getDocs).mockResolvedValue({
      forEach: () => {},
    });

    // Mock addDoc
    const mockDocRef = { id: 'new-collection-456' };
    vi.mocked(addDoc).mockResolvedValue(mockDocRef);

    const user = userEvent.setup();
    renderWithRouter(<SavedListsPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(savedListsService.fetchSavedLists).toHaveBeenCalled();
    });

    // Click "Create First Collection" button
    const createButton = screen.getByRole('button', { name: /create first collection/i });
    await user.click(createButton);

    // Wait for modal and fill form
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g., Beach Resorts/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/e.g., Beach Resorts/i);
    await user.type(nameInput, 'Test Collection');

    // Submit
    const submitButton = screen.getByRole('button', { name: /create collection/i });
    await user.click(submitButton);

    // Verify navigation to edit page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/collections/new-collection-456');
    });
  });

  it('should display success notification after creating collection', async () => {
    // Mock personal lists
    vi.spyOn(savedListsService, 'fetchSavedLists').mockResolvedValue([]);

    // Mock global collections fetch
    const { getDocs } = await import('firebase/firestore');
    vi.mocked(getDocs).mockResolvedValue({
      forEach: () => {},
    });

    // Mock addDoc
    const mockDocRef = { id: 'new-collection-789' };
    vi.mocked(addDoc).mockResolvedValue(mockDocRef);

    const user = userEvent.setup();
    renderWithRouter(<SavedListsPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(savedListsService.fetchSavedLists).toHaveBeenCalled();
    });

    // Create collection
    const createButton = screen.getByRole('button', { name: /create first collection/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g., Beach Resorts/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/e.g., Beach Resorts/i);
    await user.type(nameInput, 'My New Collection');

    const submitButton = screen.getByRole('button', { name: /create collection/i });
    await user.click(submitButton);

    // Verify success notification is displayed
    await waitFor(() => {
      expect(screen.getByText(/Collection "My New Collection" created successfully!/i)).toBeInTheDocument();
    });
  });

  it('should handle collection creation errors gracefully', async () => {
    // Mock personal lists
    vi.spyOn(savedListsService, 'fetchSavedLists').mockResolvedValue([]);

    // Mock global collections fetch
    const { getDocs } = await import('firebase/firestore');
    vi.mocked(getDocs).mockResolvedValue({
      forEach: () => {},
    });

    // Mock addDoc to fail
    vi.mocked(addDoc).mockRejectedValue(new Error('Firestore error: Permission denied'));

    const user = userEvent.setup();
    renderWithRouter(<SavedListsPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(savedListsService.fetchSavedLists).toHaveBeenCalled();
    });

    // Create collection
    const createButton = screen.getByRole('button', { name: /create first collection/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g., Beach Resorts/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/e.g., Beach Resorts/i);
    await user.type(nameInput, 'Test Collection');

    const submitButton = screen.getByRole('button', { name: /create collection/i });
    await user.click(submitButton);

    // Verify error message is displayed in modal
    await waitFor(() => {
      expect(screen.getByText(/Firestore error: Permission denied/i)).toBeInTheDocument();
    });

    // Verify navigation did NOT occur
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should close modal on successful creation', async () => {
    // Mock personal lists
    vi.spyOn(savedListsService, 'fetchSavedLists').mockResolvedValue([]);

    // Mock global collections fetch
    const { getDocs } = await import('firebase/firestore');
    vi.mocked(getDocs).mockResolvedValue({
      forEach: () => {},
    });

    // Mock addDoc
    const mockDocRef = { id: 'new-collection-999' };
    vi.mocked(addDoc).mockResolvedValue(mockDocRef);

    const user = userEvent.setup();
    renderWithRouter(<SavedListsPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(savedListsService.fetchSavedLists).toHaveBeenCalled();
    });

    // Create collection
    const createButton = screen.getByRole('button', { name: /create first collection/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g., Beach Resorts/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/e.g., Beach Resorts/i);
    await user.type(nameInput, 'Test Collection');

    const submitButton = screen.getByRole('button', { name: /create collection/i });
    await user.click(submitButton);

    // Verify modal is closed (form inputs are no longer in document)
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/e.g., Beach Resorts/i)).not.toBeInTheDocument();
    });
  });
});
