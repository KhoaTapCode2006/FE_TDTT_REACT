import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CollectionPage from './CollectionPage';
import { collectionService } from '../../services/backend/collection.service';

// Mock Firebase
vi.mock('../../config/firebase', () => ({
  auth: {},
  db: {},
}));

// Mock auth service
vi.mock('../../services/authentication/auth.service', () => ({
  authService: {
    getCurrentUser: vi.fn(() => null),
    onAuthStateChange: vi.fn(),
  },
}));

// Mock services
vi.mock('../../services/backend/collection.service');
vi.mock('../../services/backend/views.service');

// Mock useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-owner-uid' },
    loading: false,
  }),
}));

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ collectionId: 'test-collection-id' }),
    useLocation: () => ({ state: null }),
    useNavigate: () => vi.fn(),
  };
});

const mockCollection = {
  id: 'test-collection-id',
  name: 'Test Collection',
  description: 'Test Description',
  visibility: 'public',
  thumbnail_url: '',
  owner_uid: 'test-owner-uid',
  tags: ['tag1', 'tag2'],
  places: [
    { place_id: 'place1', added_by: 'user1', added_at: '2024-01-01' },
  ],
  collaborators: [
    { uid: 'collab1', contributed_count: 5, joined_at: '2024-01-01' },
  ],
  saved_count: 10,
  savers: [],
  views: {
    total_views: 100,
    weekly_views: 20,
  },
  created_at: '2024-01-01',
  updated_at: '2024-01-02',
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('CollectionPage - Responsive Design (Task 7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    collectionService.getCollection.mockResolvedValue(mockCollection);
  });

  describe('REQ-7: Responsive Tab Navigation', () => {
    it('should render tab navigation with horizontal scroll support', async () => {
      renderWithProviders(<CollectionPage />);

      // Wait for collection to load
      await screen.findByText('Test Collection');

      // Find tab navigation container
      const tablist = screen.getByRole('tablist', { name: /collection navigation/i });
      
      // Verify tablist has overflow-x-auto class for horizontal scrolling
      expect(tablist.className).toContain('overflow-x-auto');
      
      // Verify scrollbar-hide class is applied
      expect(tablist.className).toContain('scrollbar-hide');
    });

    it('should have minimum 44x44px touch targets for all tabs', async () => {
      renderWithProviders(<CollectionPage />);

      await screen.findByText('Test Collection');

      // Get all tab buttons
      const tabs = screen.getAllByRole('tab');
      
      // Verify each tab has minimum touch target size
      tabs.forEach((tab) => {
        const styles = window.getComputedStyle(tab);
        const minHeight = tab.style.minHeight;
        const minWidth = tab.style.minWidth;
        
        // Check inline styles (which override computed styles)
        expect(minHeight).toBe('44px');
        expect(minWidth).toBe('44px');
      });
    });

    it('should render all three tabs with icons and labels', async () => {
      renderWithProviders(<CollectionPage />);

      await screen.findByText('Test Collection');

      // Verify all three tabs are present
      const infoTab = screen.getByRole('tab', { name: /thông tin collection/i });
      const placesTab = screen.getByRole('tab', { name: /địa điểm trong collection/i });
      const contributorsTab = screen.getByRole('tab', { name: /cộng tác viên của collection/i });

      expect(infoTab).toBeInTheDocument();
      expect(placesTab).toBeInTheDocument();
      expect(contributorsTab).toBeInTheDocument();

      // Verify tabs have text labels
      expect(within(infoTab).getByText('Thông tin')).toBeInTheDocument();
      expect(within(placesTab).getByText('Địa điểm')).toBeInTheDocument();
      expect(within(contributorsTab).getByText('Cộng tác viên')).toBeInTheDocument();
    });

    it('should maintain readable text on all screen sizes', async () => {
      renderWithProviders(<CollectionPage />);

      await screen.findByText('Test Collection');

      const tabs = screen.getAllByRole('tab');
      
      // Verify tabs have appropriate text sizing
      tabs.forEach((tab) => {
        // Check that text-sm class is applied for consistent sizing
        expect(tab.className).toContain('text-sm');
        
        // Verify whitespace-nowrap to prevent text wrapping
        expect(tab.className).toContain('whitespace-nowrap');
      });
    });

    it('should have touch-manipulation for better mobile interaction', async () => {
      renderWithProviders(<CollectionPage />);

      await screen.findByText('Test Collection');

      const tabs = screen.getAllByRole('tab');
      
      tabs.forEach((tab) => {
        // Verify touch-manipulation class
        expect(tab.className).toContain('touch-manipulation');
        
        // Verify inline style for touchAction
        expect(tab.style.touchAction).toBe('manipulation');
      });
    });

    it('should prevent tabs from shrinking with flex-shrink-0', async () => {
      renderWithProviders(<CollectionPage />);

      await screen.findByText('Test Collection');

      const tabs = screen.getAllByRole('tab');
      
      tabs.forEach((tab) => {
        // Verify flex-shrink-0 to maintain tab size
        expect(tab.className).toContain('flex-shrink-0');
      });
    });

    it('should have consistent minimum width for tabs', async () => {
      renderWithProviders(<CollectionPage />);

      await screen.findByText('Test Collection');

      const tabs = screen.getAllByRole('tab');
      
      tabs.forEach((tab) => {
        // Verify minimum width class
        expect(tab.className).toContain('min-w-[120px]');
      });
    });
  });

  describe('REQ-9: UI Consistency', () => {
    it('should use consistent spacing and padding', async () => {
      renderWithProviders(<CollectionPage />);

      await screen.findByText('Test Collection');

      const tabs = screen.getAllByRole('tab');
      
      tabs.forEach((tab) => {
        // Verify consistent padding
        expect(tab.className).toContain('px-4');
        expect(tab.className).toContain('py-3');
      });
    });

    it('should have smooth transitions', async () => {
      renderWithProviders(<CollectionPage />);

      await screen.findByText('Test Collection');

      const tabs = screen.getAllByRole('tab');
      
      tabs.forEach((tab) => {
        // Verify transition classes
        expect(tab.className).toContain('transition-all');
        expect(tab.className).toContain('duration-200');
      });
    });

    it('should maintain visual hierarchy with border-bottom indicator', async () => {
      renderWithProviders(<CollectionPage />);

      await screen.findByText('Test Collection');

      const tabs = screen.getAllByRole('tab');
      
      tabs.forEach((tab) => {
        // Verify border-bottom styling
        expect(tab.className).toContain('border-b-2');
      });
    });
  });

  describe('Tab Content Responsiveness', () => {
    it('should render tab content that adapts to screen size', async () => {
      renderWithProviders(<CollectionPage />);

      await screen.findByText('Test Collection');

      // Find the tab panel
      const tabPanel = screen.getByRole('tabpanel');
      
      expect(tabPanel).toBeInTheDocument();
      
      // Verify tab panel has proper ARIA attributes
      expect(tabPanel).toHaveAttribute('id', 'info-panel');
      expect(tabPanel).toHaveAttribute('aria-labelledby', 'info-tab');
    });

    it('should not have horizontal overflow issues', async () => {
      renderWithProviders(<CollectionPage />);

      await screen.findByText('Test Collection');

      const tablist = screen.getByRole('tablist');
      
      // Verify overflow-x-auto allows horizontal scrolling
      expect(tablist.className).toContain('overflow-x-auto');
      
      // Verify scrollbar is hidden
      expect(tablist.className).toContain('scrollbar-hide');
    });
  });

  describe('Mobile-specific behavior', () => {
    it('should have iOS smooth scrolling support', async () => {
      renderWithProviders(<CollectionPage />);

      await screen.findByText('Test Collection');

      const tablist = screen.getByRole('tablist');
      
      // Verify WebkitOverflowScrolling is set in inline styles
      expect(tablist.style.WebkitOverflowScrolling).toBe('touch');
    });

    it('should hide scrollbar on all browsers', async () => {
      renderWithProviders(<CollectionPage />);

      await screen.findByText('Test Collection');

      const tablist = screen.getByRole('tablist');
      
      // Verify scrollbar hiding styles
      expect(tablist.style.scrollbarWidth).toBe('none'); // Firefox
      expect(tablist.style.msOverflowStyle).toBe('none'); // IE/Edge
      expect(tablist.className).toContain('scrollbar-hide'); // Webkit browsers
    });
  });
});
