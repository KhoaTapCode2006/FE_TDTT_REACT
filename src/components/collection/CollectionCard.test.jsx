import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CollectionCard from './CollectionCard';

// Mock the Icon component
vi.mock('@/components/ui/Icon', () => ({
  default: ({ name, size, className }) => (
    <span data-testid={`icon-${name}`} className={className}>
      {name}
    </span>
  ),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CollectionCard - Task 4.3: Save Handler', () => {
  const mockCollection = {
    id: 'test-collection-123',
    name: 'Test Collection',
    description: 'Test description',
    thumbnail_url: 'https://example.com/image.jpg',
    visibility: 'public',
    tags: ['tag1', 'tag2'],
    places: [{ id: '1' }, { id: '2' }],
    saved_count: 10,
    owner_uid: 'owner-123',
    collaborators: [],
    views: { total_views: 100, weekly_views: 20 },
  };

  const mockOnSave = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderCard = (props = {}) => {
    return render(
      <BrowserRouter>
        <CollectionCard
          collection={mockCollection}
          isOwner={false}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
          isSaved={false}
          showActions={true}
          currentUserId="current-user-123"
          {...props}
        />
      </BrowserRouter>
    );
  };

  describe('Requirement 2.1: Save handler calls onSave callback', () => {
    it('should call onSave with collection ID and new state (true) when unsaved collection is clicked', async () => {
      renderCard({ isSaved: false });

      const saveButton = screen.getByRole('button', { name: /save collection/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('test-collection-123', true);
      });
    });

    it('should call onSave with collection ID and new state (false) when saved collection is clicked', async () => {
      renderCard({ isSaved: true });

      const saveButton = screen.getByRole('button', { name: /unsave collection/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('test-collection-123', false);
      });
    });
  });

  describe('Requirement 6.4: Prevent multiple simultaneous clicks', () => {
    it('should disable button during save operation', async () => {
      // Mock onSave to return a promise that we can control
      let resolvePromise;
      const savePromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockOnSave.mockReturnValue(savePromise);

      renderCard({ isSaved: false });

      const saveButton = screen.getByRole('button', { name: /save collection/i });
      
      // Click the button
      fireEvent.click(saveButton);

      // Button should be disabled immediately
      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });

      // Resolve the promise
      resolvePromise();

      // Button should be enabled again
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });

    it('should show loading spinner during save operation', async () => {
      let resolvePromise;
      const savePromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockOnSave.mockReturnValue(savePromise);

      renderCard({ isSaved: false });

      const saveButton = screen.getByRole('button', { name: /save collection/i });
      
      // Click the button
      fireEvent.click(saveButton);

      // Should show loading spinner (refresh icon with spin animation)
      await waitFor(() => {
        expect(screen.getByTestId('icon-refresh')).toBeInTheDocument();
      });

      // Resolve the promise
      resolvePromise();

      // Loading spinner should disappear
      await waitFor(() => {
        expect(screen.queryByTestId('icon-refresh')).not.toBeInTheDocument();
      });
    });

    it('should prevent multiple simultaneous clicks', async () => {
      let resolvePromise;
      const savePromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockOnSave.mockReturnValue(savePromise);

      renderCard({ isSaved: false });

      const saveButton = screen.getByRole('button', { name: /save collection/i });
      
      // Click multiple times rapidly
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);

      // onSave should only be called once
      expect(mockOnSave).toHaveBeenCalledTimes(1);

      // Resolve the promise
      resolvePromise();

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe('Error handling with console logging', () => {
    it('should handle errors gracefully and log to console', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Save failed');
      mockOnSave.mockRejectedValue(testError);

      renderCard({ isSaved: false });

      const saveButton = screen.getByRole('button', { name: /save collection/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Save failed:', testError);
      });

      // Button should be re-enabled after error
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should re-enable button after error', async () => {
      mockOnSave.mockRejectedValue(new Error('Network error'));

      renderCard({ isSaved: false });

      const saveButton = screen.getByRole('button', { name: /save collection/i });
      fireEvent.click(saveButton);

      // Wait for error to be handled
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      // Button should be enabled again
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe('UI state management', () => {
    it('should display correct icon for unsaved state', () => {
      renderCard({ isSaved: false });
      
      const saveButton = screen.getByRole('button', { name: /save collection/i });
      expect(saveButton).toBeInTheDocument();
      expect(screen.getByTestId('icon-favorite_border')).toBeInTheDocument();
    });

    it('should display correct icon for saved state', () => {
      renderCard({ isSaved: true });
      
      const saveButton = screen.getByRole('button', { name: /unsave collection/i });
      expect(saveButton).toBeInTheDocument();
      // Check that the save button contains the favorite icon (not favorite_border)
      const favoriteIcon = saveButton.querySelector('[data-testid="icon-favorite"]');
      expect(favoriteIcon).toBeInTheDocument();
    });

    it('should not show save button for owned collections', () => {
      renderCard({ isOwner: true });
      
      const saveButton = screen.queryByRole('button', { name: /save collection/i });
      expect(saveButton).not.toBeInTheDocument();
    });

    it('should not show save button when showActions is false', () => {
      renderCard({ showActions: false });
      
      const saveButton = screen.queryByRole('button', { name: /save collection/i });
      expect(saveButton).not.toBeInTheDocument();
    });
  });

  describe('Accessibility attributes', () => {
    it('should have proper aria-label for unsaved state', () => {
      renderCard({ isSaved: false });
      
      const saveButton = screen.getByRole('button', { name: /save collection/i });
      expect(saveButton).toHaveAttribute('aria-label', 'Save collection');
    });

    it('should have proper aria-label for saved state', () => {
      renderCard({ isSaved: true });
      
      const saveButton = screen.getByRole('button', { name: /unsave collection/i });
      expect(saveButton).toHaveAttribute('aria-label', 'Unsave collection');
    });

    it('should have aria-pressed attribute reflecting saved state', () => {
      const { rerender } = renderCard({ isSaved: false });
      
      let saveButton = screen.getByRole('button', { name: /save collection/i });
      expect(saveButton).toHaveAttribute('aria-pressed', 'false');

      rerender(
        <BrowserRouter>
          <CollectionCard
            collection={mockCollection}
            isOwner={false}
            onSave={mockOnSave}
            isSaved={true}
            showActions={true}
            currentUserId="current-user-123"
          />
        </BrowserRouter>
      );

      saveButton = screen.getByRole('button', { name: /unsave collection/i });
      expect(saveButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should have aria-busy attribute during loading', async () => {
      let resolvePromise;
      const savePromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockOnSave.mockReturnValue(savePromise);

      renderCard({ isSaved: false });

      const saveButton = screen.getByRole('button', { name: /save collection/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(saveButton).toHaveAttribute('aria-busy', 'true');
      });

      resolvePromise();

      await waitFor(() => {
        expect(saveButton).toHaveAttribute('aria-busy', 'false');
      });
    });
  });

  describe('Task 4.4: Saved count display updates', () => {
    it('should display saved count with heart icon in stats section', () => {
      renderCard();
      
      // Check that saved count is displayed
      expect(screen.getByText('10 saves')).toBeInTheDocument();
      
      // Check that heart icon is present in stats section
      const statsSection = screen.getByText('10 saves').closest('div');
      expect(statsSection).toBeInTheDocument();
    });

    it('should update saved count when collection prop changes (Requirement 7.1, 7.4)', () => {
      const { rerender } = renderCard();
      
      // Initial saved count
      expect(screen.getByText('10 saves')).toBeInTheDocument();

      // Update collection with new saved_count
      const updatedCollection = {
        ...mockCollection,
        saved_count: 15,
      };

      rerender(
        <BrowserRouter>
          <CollectionCard
            collection={updatedCollection}
            isOwner={false}
            onSave={mockOnSave}
            isSaved={false}
            showActions={true}
            currentUserId="current-user-123"
          />
        </BrowserRouter>
      );

      // Verify saved count updated
      expect(screen.getByText('15 saves')).toBeInTheDocument();
      expect(screen.queryByText('10 saves')).not.toBeInTheDocument();
    });

    it('should display 0 saves when saved_count is null or undefined', () => {
      const collectionWithoutSavedCount = {
        ...mockCollection,
        saved_count: null,
      };

      render(
        <BrowserRouter>
          <CollectionCard
            collection={collectionWithoutSavedCount}
            isOwner={false}
            onSave={mockOnSave}
            isSaved={false}
            showActions={true}
            currentUserId="current-user-123"
          />
        </BrowserRouter>
      );

      expect(screen.getByText('0 saves')).toBeInTheDocument();
    });

    it('should update saved count after save action completes', async () => {
      const { rerender } = renderCard({ isSaved: false });
      
      // Initial saved count
      expect(screen.getByText('10 saves')).toBeInTheDocument();

      // Simulate parent component updating collection after save
      const updatedCollection = {
        ...mockCollection,
        saved_count: 11,
      };

      rerender(
        <BrowserRouter>
          <CollectionCard
            collection={updatedCollection}
            isOwner={false}
            onSave={mockOnSave}
            isSaved={true}
            showActions={true}
            currentUserId="current-user-123"
          />
        </BrowserRouter>
      );

      // Verify saved count incremented
      expect(screen.getByText('11 saves')).toBeInTheDocument();
    });

    it('should update saved count after unsave action completes', async () => {
      const { rerender } = renderCard({ isSaved: true });
      
      // Initial saved count
      expect(screen.getByText('10 saves')).toBeInTheDocument();

      // Simulate parent component updating collection after unsave
      const updatedCollection = {
        ...mockCollection,
        saved_count: 9,
      };

      rerender(
        <BrowserRouter>
          <CollectionCard
            collection={updatedCollection}
            isOwner={false}
            onSave={mockOnSave}
            isSaved={false}
            showActions={true}
            currentUserId="current-user-123"
          />
        </BrowserRouter>
      );

      // Verify saved count decremented
      expect(screen.getByText('9 saves')).toBeInTheDocument();
    });
  });
});
