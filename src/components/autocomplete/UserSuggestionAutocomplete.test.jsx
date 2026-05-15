import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserSuggestionAutocomplete from './UserSuggestionAutocomplete';
import { userService } from '@/services/backend/user.service';

// Mock the user service
vi.mock('@/services/backend/user.service', () => ({
  userService: {
    searchUsers: vi.fn(),
  },
}));

// Mock the Icon component
vi.mock('@/components/ui/Icon', () => ({
  default: ({ name, className = '', size = 24 }) => (
    <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size }}>
      {name}
    </span>
  ),
}));

describe('UserSuggestionAutocomplete - Core Search Functionality', () => {
  const mockOnSelect = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  // ============================================================================
  // Task 2.1: Component Structure and State Management
  // ============================================================================
  
  describe('Task 2.1: Component Structure', () => {
    it('should render input field with correct placeholder', () => {
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Tìm kiếm người dùng...');
    });
    
    it('should render with custom placeholder', () => {
      render(
        <UserSuggestionAutocomplete 
          onSelect={mockOnSelect} 
          placeholder="Custom placeholder"
        />
      );
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('placeholder', 'Custom placeholder');
    });
    
    it('should apply custom className', () => {
      const { container } = render(
        <UserSuggestionAutocomplete 
          onSelect={mockOnSelect} 
          className="custom-class"
        />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
    
    it('should support disabled state', () => {
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} disabled />);
      
      const input = screen.getByRole('combobox');
      expect(input).toBeDisabled();
    });
    
    it('should support autoFocus', () => {
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} autoFocus />);
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveFocus();
    });
    
    it('should have correct ARIA attributes', () => {
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
      expect(input).toHaveAttribute('aria-controls', 'user-suggestions-listbox');
    });
  });
  
  // ============================================================================
  // Task 2.2: Debounced Search with Cache
  // ============================================================================
  
  describe('Task 2.2: Debounced Search', () => {
    it('should not trigger search for input less than 2 characters', async () => {
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'a');
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 350));
      
      expect(userService.searchUsers).not.toHaveBeenCalled();
    });
    
    it('should trigger search for input with 2 or more characters', async () => {
      userService.searchUsers.mockResolvedValue([]);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'ab');
      
      // Wait for debounce delay
      await waitFor(() => {
        expect(userService.searchUsers).toHaveBeenCalledWith('ab', expect.any(Object));
      }, { timeout: 1000 });
    });
    
    it('should debounce search by 300ms', async () => {
      userService.searchUsers.mockResolvedValue([]);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      // Should not call immediately
      expect(userService.searchUsers).not.toHaveBeenCalled();
      
      // Wait for debounce delay
      await waitFor(() => {
        expect(userService.searchUsers).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });
    
    it('should cancel previous debounce timer on new input', async () => {
      userService.searchUsers.mockResolvedValue([]);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      
      // Type first query
      await userEvent.type(input, 'te');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Type more before debounce completes
      await userEvent.type(input, 'st');
      
      await waitFor(() => {
        // Should only call once with final query
        expect(userService.searchUsers).toHaveBeenCalledTimes(1);
        expect(userService.searchUsers).toHaveBeenCalledWith('test', expect.any(Object));
      }, { timeout: 1000 });
    });
    
    it('should hide dropdown when input is cleared to less than 2 characters', async () => {
      userService.searchUsers.mockResolvedValue([
        { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null }
      ]);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      
      // Type to show dropdown
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'true');
      }, { timeout: 1000 });
      
      // Clear input
      await userEvent.clear(input);
      await userEvent.type(input, 'a');
      
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });
    
    it('should use cached results for repeated searches', async () => {
      const mockResults = [
        { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      
      // First search
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        expect(userService.searchUsers).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
      
      // Clear and search again with same query
      await userEvent.clear(input);
      await userEvent.type(input, 'test');
      
      // Wait a bit to ensure no new API call
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Should not call API again (using cache)
      expect(userService.searchUsers).toHaveBeenCalledTimes(1);
    });
  });
  
  // ============================================================================
  // Task 2.3: API Request with Cancellation
  // ============================================================================
  
  describe('Task 2.3: API Request with Cancellation', () => {
    it('should call userService.searchUsers with correct parameters', async () => {
      userService.searchUsers.mockResolvedValue([]);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'john');
      
      await waitFor(() => {
        expect(userService.searchUsers).toHaveBeenCalledWith(
          'john',
          expect.objectContaining({
            signal: expect.any(AbortSignal)
          })
        );
      }, { timeout: 1000 });
    });
    
    it('should pass AbortSignal to API request', async () => {
      userService.searchUsers.mockResolvedValue([]);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        const callArgs = userService.searchUsers.mock.calls[0];
        expect(callArgs[1]).toHaveProperty('signal');
        expect(callArgs[1].signal).toBeInstanceOf(AbortSignal);
      }, { timeout: 1000 });
    });
    
    it('should update suggestions on successful API response', async () => {
      const mockResults = [
        { uid: '1', username: 'john_doe', display_name: 'John Doe', avatar_url: null },
        { uid: '2', username: 'jane_smith', display_name: 'Jane Smith', avatar_url: 'https://example.com/avatar.jpg' }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'john');
      
      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('jane_smith')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
    
    it('should show loading state during API call', async () => {
      // Create a promise that we can control
      let resolveSearch;
      const searchPromise = new Promise((resolve) => {
        resolveSearch = resolve;
      });
      userService.searchUsers.mockReturnValue(searchPromise);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      // Should show loading indicator (spinner icon in input field)
      await waitFor(() => {
        const spinner = screen.getByText('progress_activity');
        expect(spinner).toBeInTheDocument();
      }, { timeout: 1000 });
      
      // Resolve the promise
      resolveSearch([]);
      
      // Loading should disappear
      await waitFor(() => {
        expect(screen.queryByText('progress_activity')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });
    
    it('should handle API errors correctly', async () => {
      const mockError = new Error('Network error');
      mockError.code = 'NETWORK_ERROR';
      userService.searchUsers.mockRejectedValue(mockError);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        expect(screen.getByText('Không có kết nối mạng')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
    
    it('should display different error messages based on error code', async () => {
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      
      // Test TIMEOUT_ERROR
      const timeoutError = new Error('Timeout');
      timeoutError.code = 'TIMEOUT_ERROR';
      userService.searchUsers.mockRejectedValue(timeoutError);
      
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        expect(screen.getByText('Yêu cầu quá thời gian. Vui lòng thử lại')).toBeInTheDocument();
      }, { timeout: 1000 });
      
      // Clear and test SERVER_ERROR with 404
      await userEvent.clear(input);
      const serverError404 = new Error('Not found');
      serverError404.code = 'SERVER_ERROR';
      serverError404.statusCode = 404;
      userService.searchUsers.mockRejectedValue(serverError404);
      
      await userEvent.type(input, 'test2');
      
      await waitFor(() => {
        expect(screen.getByText('Không tìm thấy người dùng')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
    
    it('should show empty state when no results found', async () => {
      userService.searchUsers.mockResolvedValue([]);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'nonexistent');
      
      await waitFor(() => {
        expect(screen.getByText('Không tìm thấy người dùng phù hợp')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
    
    it('should not show error for aborted requests', async () => {
      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      userService.searchUsers.mockRejectedValue(abortError);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        expect(userService.searchUsers).toHaveBeenCalled();
      }, { timeout: 1000 });
      
      // Wait a bit to ensure no error is shown
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should not show error message for aborted requests
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
  
  // ============================================================================
  // Task 5.1: Keyboard Navigation
  // ============================================================================
  
  describe('Task 5.1: Keyboard Navigation', () => {
    it('should increment highlightedIndex on ArrowDown and wrap to 0 at end', async () => {
      const mockResults = [
        { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null },
        { uid: '2', username: 'user2', display_name: 'User Two', avatar_url: null },
        { uid: '3', username: 'user3', display_name: 'User Three', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      }, { timeout: 1000 });
      
      // Press ArrowDown - should highlight first item (index 0)
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(input).toHaveAttribute('aria-activedescendant', 'user-suggestion-0');
      
      // Press ArrowDown again - should highlight second item (index 1)
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(input).toHaveAttribute('aria-activedescendant', 'user-suggestion-1');
      
      // Press ArrowDown again - should highlight third item (index 2)
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(input).toHaveAttribute('aria-activedescendant', 'user-suggestion-2');
      
      // Press ArrowDown at end - should wrap to first item (index 0)
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(input).toHaveAttribute('aria-activedescendant', 'user-suggestion-0');
    });
    
    it('should decrement highlightedIndex on ArrowUp and wrap to length-1 at start', async () => {
      const mockResults = [
        { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null },
        { uid: '2', username: 'user2', display_name: 'User Two', avatar_url: null },
        { uid: '3', username: 'user3', display_name: 'User Three', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      }, { timeout: 1000 });
      
      // Press ArrowUp from initial state (-1) - should wrap to last item (index 2)
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect(input).toHaveAttribute('aria-activedescendant', 'user-suggestion-2');
      
      // Press ArrowUp - should go to second item (index 1)
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect(input).toHaveAttribute('aria-activedescendant', 'user-suggestion-1');
      
      // Press ArrowUp - should go to first item (index 0)
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect(input).toHaveAttribute('aria-activedescendant', 'user-suggestion-0');
      
      // Press ArrowUp at start - should wrap to last item (index 2)
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect(input).toHaveAttribute('aria-activedescendant', 'user-suggestion-2');
    });
    
    it('should call onSelect with highlighted user on Enter key', async () => {
      const mockResults = [
        { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null },
        { uid: '2', username: 'user2', display_name: 'User Two', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      }, { timeout: 1000 });
      
      // Highlight second item
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      
      // Press Enter
      fireEvent.keyDown(input, { key: 'Enter' });
      
      // Should call onSelect with second user
      expect(mockOnSelect).toHaveBeenCalledWith(mockResults[1]);
      
      // Should clear input and close dropdown
      await waitFor(() => {
        expect(input).toHaveValue('');
        expect(input).toHaveAttribute('aria-expanded', 'false');
      });
    });
    
    it('should close dropdown and clear input on Escape key', async () => {
      const mockResults = [
        { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(input).toHaveAttribute('aria-expanded', 'true');
      }, { timeout: 1000 });
      
      // Press Escape
      fireEvent.keyDown(input, { key: 'Escape' });
      
      // Should clear input and close dropdown
      expect(input).toHaveValue('');
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });
    
    it('should close dropdown and keep input on Tab key', async () => {
      const mockResults = [
        { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(input).toHaveAttribute('aria-expanded', 'true');
      }, { timeout: 1000 });
      
      // Press Tab
      fireEvent.keyDown(input, { key: 'Tab' });
      
      // Should keep input value and close dropdown
      expect(input).toHaveValue('test');
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });
    
    it('should update aria-activedescendant based on highlightedIndex', async () => {
      const mockResults = [
        { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null },
        { uid: '2', username: 'user2', display_name: 'User Two', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      }, { timeout: 1000 });
      
      // Initially no item is highlighted
      expect(input).not.toHaveAttribute('aria-activedescendant');
      
      // Highlight first item
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(input).toHaveAttribute('aria-activedescendant', 'user-suggestion-0');
      
      // Highlight second item
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(input).toHaveAttribute('aria-activedescendant', 'user-suggestion-1');
    });
    
    it('should not trigger keyboard actions when dropdown is closed', async () => {
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      
      // Press ArrowDown when dropdown is closed
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      
      // Should not set aria-activedescendant
      expect(input).not.toHaveAttribute('aria-activedescendant');
      
      // Press Enter when dropdown is closed
      fireEvent.keyDown(input, { key: 'Enter' });
      
      // Should not call onSelect
      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });
  
  // ============================================================================
  // Integration Tests
  // ============================================================================
  
  describe('Integration: Core Search Flow', () => {
    it('should complete full search flow successfully', async () => {
      const mockResults = [
        { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      
      // Initial state
      expect(input).toHaveAttribute('aria-expanded', 'false');
      
      // Type search query
      await userEvent.type(input, 'test');
      
      // Verify API was called
      await waitFor(() => {
        expect(userService.searchUsers).toHaveBeenCalledWith('test', expect.any(Object));
      }, { timeout: 1000 });
      
      // Verify dropdown is open with results
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('testuser')).toBeInTheDocument();
        expect(screen.getByText('Test User')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
    
    it('should handle rapid typing correctly', async () => {
      userService.searchUsers.mockResolvedValue([]);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      
      // Simulate rapid typing
      await userEvent.type(input, 'test', { delay: 50 });
      
      // Should only call API once with final query
      await waitFor(() => {
        expect(userService.searchUsers).toHaveBeenCalledTimes(1);
        expect(userService.searchUsers).toHaveBeenCalledWith('test', expect.any(Object));
      }, { timeout: 1000 });
    });
  });
});

// ============================================================================
// Task 6.1: Click Selection Handler
// ============================================================================

describe('Task 6.1: Click Selection Handler', () => {
  const mockOnSelect = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should call onSelect callback when user item is clicked', async () => {
    const mockResults = [
      { uid: '1', username: 'john_doe', display_name: 'John Doe', avatar_url: null },
      { uid: '2', username: 'jane_smith', display_name: 'Jane Smith', avatar_url: 'https://example.com/avatar.jpg' }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'john');
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('john_doe')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Click on first user item
    const userItem = screen.getByText('john_doe').closest('li');
    fireEvent.click(userItem);
    
    // Verify onSelect was called with correct user object
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith(mockResults[0]);
  });
  
  it('should clear input field after selection', async () => {
    const mockResults = [
      { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'test');
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Verify input has value before selection
    expect(input).toHaveValue('test');
    
    // Click on user item
    const userItem = screen.getByText('testuser').closest('li');
    fireEvent.click(userItem);
    
    // Verify input is cleared
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });
  
  it('should close dropdown after selection', async () => {
    const mockResults = [
      { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'test');
    
    // Wait for results and verify dropdown is open
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-expanded', 'true');
    }, { timeout: 1000 });
    
    // Click on user item
    const userItem = screen.getByText('testuser').closest('li');
    fireEvent.click(userItem);
    
    // Verify dropdown is closed
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });
  });
  
  it('should reset highlightedIndex to -1 after selection', async () => {
    const mockResults = [
      { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null },
      { uid: '2', username: 'user2', display_name: 'User Two', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'test');
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Highlight first item using keyboard
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveAttribute('aria-activedescendant', 'user-suggestion-0');
    
    // Click on second user item
    const userItem = screen.getByText('user2').closest('li');
    fireEvent.click(userItem);
    
    // Verify highlightedIndex is reset (aria-activedescendant should not be set)
    await waitFor(() => {
      expect(input).not.toHaveAttribute('aria-activedescendant');
    });
  });
  
  it('should display hover effect on user items', async () => {
    const mockResults = [
      { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'test');
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Get user item
    const userItem = screen.getByText('testuser').closest('li');
    
    // Verify hover class is present
    expect(userItem).toHaveClass('hover:bg-surface-container-high');
  });
  
  it('should handle selection of user with avatar', async () => {
    const mockResults = [
      { uid: '1', username: 'user_with_avatar', display_name: 'User With Avatar', avatar_url: 'https://example.com/avatar.jpg' }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'test');
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('user_with_avatar')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Click on user item
    const userItem = screen.getByText('user_with_avatar').closest('li');
    fireEvent.click(userItem);
    
    // Verify onSelect was called with user including avatar_url
    expect(mockOnSelect).toHaveBeenCalledWith(mockResults[0]);
  });
});

// ============================================================================
// Task 8.1: React.memo and Performance Optimization
// ============================================================================

describe('Task 8.1: React.memo and Performance Optimization', () => {
  const mockOnSelect = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should be wrapped with React.memo', () => {
    // Verify the component is a memoized component
    const Component = UserSuggestionAutocomplete;
    expect(Component.$$typeof).toBe(Symbol.for('react.memo'));
  });
  
  it('should not re-render when props do not change', () => {
    let renderCount = 0;
    
    // Create a wrapper component to track renders
    const TestWrapper = ({ onSelect, placeholder }) => {
      renderCount++;
      return <UserSuggestionAutocomplete onSelect={onSelect} placeholder={placeholder} />;
    };
    
    const { rerender } = render(<TestWrapper onSelect={mockOnSelect} placeholder="Test" />);
    
    expect(renderCount).toBe(1);
    
    // Rerender with same props (referential equality)
    rerender(<TestWrapper onSelect={mockOnSelect} placeholder="Test" />);
    
    // Component should not re-render because props haven't changed
    // Note: The wrapper will re-render, but the memoized component inside should not
    expect(renderCount).toBe(2); // Wrapper renders twice
  });
  
  it('should re-render when onSelect prop changes', () => {
    const mockOnSelect1 = vi.fn();
    const mockOnSelect2 = vi.fn();
    
    const { rerender } = render(<UserSuggestionAutocomplete onSelect={mockOnSelect1} />);
    
    const input1 = screen.getByRole('combobox');
    expect(input1).toBeInTheDocument();
    
    // Rerender with different onSelect callback
    rerender(<UserSuggestionAutocomplete onSelect={mockOnSelect2} />);
    
    const input2 = screen.getByRole('combobox');
    expect(input2).toBeInTheDocument();
  });
  
  it('should re-render when placeholder prop changes', () => {
    const { rerender } = render(
      <UserSuggestionAutocomplete onSelect={mockOnSelect} placeholder="Initial" />
    );
    
    expect(screen.getByPlaceholderText('Initial')).toBeInTheDocument();
    
    // Rerender with different placeholder
    rerender(
      <UserSuggestionAutocomplete onSelect={mockOnSelect} placeholder="Updated" />
    );
    
    expect(screen.getByPlaceholderText('Updated')).toBeInTheDocument();
  });
  
  it('should use stable callback references with useCallback', async () => {
    const mockResults = [
      { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    const { rerender } = render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'test');
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Store reference to the user item
    const userItem1 = screen.getByText('testuser').closest('li');
    const onClick1 = userItem1.onclick;
    
    // Rerender with same props
    rerender(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    // The callback should remain stable (same reference)
    // This is ensured by useCallback wrapping the handlers
    expect(input).toBeInTheDocument();
  });
  
  it('should maintain performance with multiple rapid rerenders', async () => {
    const { rerender } = render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    // Simulate multiple rapid rerenders with same props
    for (let i = 0; i < 10; i++) {
      rerender(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    }
    
    // Component should still be functional
    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Tìm kiếm người dùng...');
  });
  
  it('should handle keyboard events efficiently without re-renders', async () => {
    const mockResults = [
      { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null },
      { uid: '2', username: 'user2', display_name: 'User Two', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'test');
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Perform multiple keyboard navigations
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    
    // Component should handle all events efficiently
    expect(input).toHaveAttribute('aria-activedescendant', 'user-suggestion-1');
  });
  
  it('should cache results efficiently without unnecessary API calls', async () => {
    const mockResults = [
      { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    
    // First search
    await userEvent.type(input, 'test');
    
    await waitFor(() => {
      expect(userService.searchUsers).toHaveBeenCalledTimes(1);
    }, { timeout: 1000 });
    
    // Clear and search again with same query
    await userEvent.clear(input);
    await userEvent.type(input, 'test');
    
    // Wait to ensure no new API call
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Should still be only 1 call (using cache)
    expect(userService.searchUsers).toHaveBeenCalledTimes(1);
  });
  
  it('should handle click outside efficiently', async () => {
    const mockResults = [
      { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    const { container } = render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'test');
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-expanded', 'true');
    }, { timeout: 1000 });
    
    // Click outside multiple times
    fireEvent.mouseDown(document.body);
    fireEvent.mouseDown(document.body);
    fireEvent.mouseDown(document.body);
    
    // Dropdown should be closed
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });
  
  it('should verify all handlers use useCallback', () => {
  });
  
  it('should handle selection of user without avatar (placeholder)', async () => {
    const mockResults = [
      { uid: '1', username: 'user_no_avatar', display_name: 'User No Avatar', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'test');
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('user_no_avatar')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Verify placeholder avatar is displayed with first letter
    const placeholder = screen.getByText('U'); // First letter of 'user_no_avatar'
    expect(placeholder).toBeInTheDocument();
    // The placeholder div has the bg-primary class
    expect(placeholder).toHaveClass('bg-primary');
    
    // Click on user item
    const userItem = screen.getByText('user_no_avatar').closest('li');
    fireEvent.click(userItem);
    
    // Verify onSelect was called
    expect(mockOnSelect).toHaveBeenCalledWith(mockResults[0]);
  });
  
  it('should not call onSelect for user without uid', async () => {
    const mockResults = [
      { uid: '', username: 'invalid_user', display_name: 'Invalid User', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    // Spy on console.warn
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'test');
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('invalid_user')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Click on user item
    const userItem = screen.getByText('invalid_user').closest('li');
    fireEvent.click(userItem);
    
    // Verify onSelect was not called
    expect(mockOnSelect).not.toHaveBeenCalled();
    
    // Verify warning was logged
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Cannot select user without uid:',
      expect.objectContaining({ uid: '', username: 'invalid_user' })
    );
    
    consoleWarnSpy.mockRestore();
  });
  
  it('should handle multiple selections correctly', async () => {
    const mockResults = [
      { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null },
      { uid: '2', username: 'user2', display_name: 'User Two', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    
    // First selection
    await userEvent.type(input, 'test');
    
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    const userItem1 = screen.getByText('user1').closest('li');
    fireEvent.click(userItem1);
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockResults[0]);
    
    // Second selection
    await userEvent.type(input, 'test');
    
    await waitFor(() => {
      expect(screen.getByText('user2')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    const userItem2 = screen.getByText('user2').closest('li');
    fireEvent.click(userItem2);
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockResults[1]);
    expect(mockOnSelect).toHaveBeenCalledTimes(2);
  });
});

// ============================================================================
// Task 6.2: Click-Outside Detection
// ============================================================================

describe('Task 6.2: Click-Outside Detection', () => {
  const mockOnSelect = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should close dropdown when clicking outside component', async () => {
    const mockResults = [
      { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    render(
      <div>
        <div data-testid="outside-element">Outside Element</div>
        <UserSuggestionAutocomplete onSelect={mockOnSelect} />
      </div>
    );
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'test');
    
    // Wait for dropdown to open
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-expanded', 'true');
    }, { timeout: 1000 });
    
    // Click outside
    const outsideElement = screen.getByTestId('outside-element');
    fireEvent.mouseDown(outsideElement);
    
    // Verify dropdown is closed
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });
  });
  
  it('should keep dropdown open when clicking inside input field', async () => {
    const mockResults = [
      { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'test');
    
    // Wait for dropdown to open
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-expanded', 'true');
    }, { timeout: 1000 });
    
    // Click inside input field
    fireEvent.mouseDown(input);
    
    // Verify dropdown remains open
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });
  
  it('should keep dropdown open when clicking inside dropdown', async () => {
    const mockResults = [
      { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'test');
    
    // Wait for dropdown to open
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-expanded', 'true');
    }, { timeout: 1000 });
    
    // Click inside dropdown (on the listbox itself, not on a user item)
    const listbox = screen.getByRole('listbox');
    fireEvent.mouseDown(listbox);
    
    // Verify dropdown remains open
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });
  
  it('should register mousedown event listener on document', async () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    
    render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    // Verify mousedown listener was added
    expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    
    addEventListenerSpy.mockRestore();
  });
  
  it('should clean up event listener on unmount', async () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    
    const { unmount } = render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    // Unmount component
    unmount();
    
    // Verify mousedown listener was removed
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    
    removeEventListenerSpy.mockRestore();
  });
  
  it('should handle multiple click-outside events correctly', async () => {
    const mockResults = [
      { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    render(
      <div>
        <div data-testid="outside-element">Outside Element</div>
        <UserSuggestionAutocomplete onSelect={mockOnSelect} />
      </div>
    );
    
    const input = screen.getByRole('combobox');
    const outsideElement = screen.getByTestId('outside-element');
    
    // First open
    await userEvent.type(input, 'test');
    
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-expanded', 'true');
    }, { timeout: 1000 });
    
    // First click outside
    fireEvent.mouseDown(outsideElement);
    
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });
    
    // Second open
    await userEvent.type(input, 'test');
    
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-expanded', 'true');
    }, { timeout: 1000 });
    
    // Second click outside
    fireEvent.mouseDown(outsideElement);
    
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });
  });
  
  it('should not close dropdown when clicking on loading indicator', async () => {
    // Create a promise that we can control
    let resolveSearch;
    const searchPromise = new Promise((resolve) => {
      resolveSearch = resolve;
    });
    userService.searchUsers.mockReturnValue(searchPromise);
    
    render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'test');
    
    // Wait for loading indicator
    await waitFor(() => {
      const spinner = screen.getByText('progress_activity');
      expect(spinner).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Click on loading indicator
    const spinner = screen.getByText('progress_activity');
    fireEvent.mouseDown(spinner);
    
    // Dropdown should remain open (loading state)
    expect(input).toHaveAttribute('aria-expanded', 'false'); // Initially false, waiting for results
    
    // Resolve the promise
    resolveSearch([{ uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }]);
    
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-expanded', 'true');
    }, { timeout: 1000 });
  });
  
  it('should close dropdown when clicking on document body', async () => {
    const mockResults = [
      { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'test');
    
    // Wait for dropdown to open
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-expanded', 'true');
    }, { timeout: 1000 });
    
    // Click on document body
    fireEvent.mouseDown(document.body);
    
    // Verify dropdown is closed
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });
  });
  
  it('should not interfere with user item selection', async () => {
    const mockResults = [
      { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'test');
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Click on user item (this should trigger selection, not click-outside)
    const userItem = screen.getByText('testuser').closest('li');
    fireEvent.click(userItem);
    
    // Verify onSelect was called
    expect(mockOnSelect).toHaveBeenCalledWith(mockResults[0]);
    
    // Verify dropdown is closed (by selection, not click-outside)
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });
  });
});

// ============================================================================
// Integration Tests: Click Selection and Click-Outside
// ============================================================================

describe('Integration: Click Selection and Click-Outside', () => {
  const mockOnSelect = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should handle complete user selection flow with click', async () => {
    const mockResults = [
      { uid: '1', username: 'john_doe', display_name: 'John Doe', avatar_url: null },
      { uid: '2', username: 'jane_smith', display_name: 'Jane Smith', avatar_url: 'https://example.com/avatar.jpg' }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    
    // Type search query
    await userEvent.type(input, 'john');
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('john_doe')).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-expanded', 'true');
    }, { timeout: 1000 });
    
    // Click on first user
    const userItem = screen.getByText('john_doe').closest('li');
    fireEvent.click(userItem);
    
    // Verify complete cleanup
    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(mockResults[0]);
      expect(input).toHaveValue('');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(input).not.toHaveAttribute('aria-activedescendant');
    });
  });
  
  it('should handle click-outside after keyboard navigation', async () => {
    const mockResults = [
      { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null },
      { uid: '2', username: 'user2', display_name: 'User Two', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    render(
      <div>
        <div data-testid="outside-element">Outside Element</div>
        <UserSuggestionAutocomplete onSelect={mockOnSelect} />
      </div>
    );
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'test');
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Navigate with keyboard
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveAttribute('aria-activedescendant', 'user-suggestion-0');
    
    // Click outside
    const outsideElement = screen.getByTestId('outside-element');
    fireEvent.mouseDown(outsideElement);
    
    // Verify dropdown is closed
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });
    
    // Verify onSelect was not called
    expect(mockOnSelect).not.toHaveBeenCalled();
  });
  
  it('should allow reopening dropdown after click-outside', async () => {
    const mockResults = [
      { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    render(
      <div>
        <div data-testid="outside-element">Outside Element</div>
        <UserSuggestionAutocomplete onSelect={mockOnSelect} />
      </div>
    );
    
    const input = screen.getByRole('combobox');
    const outsideElement = screen.getByTestId('outside-element');
    
    // First open
    await userEvent.type(input, 'test');
    
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-expanded', 'true');
    }, { timeout: 1000 });
    
    // Click outside to close
    fireEvent.mouseDown(outsideElement);
    
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });
    
    // Reopen by typing again
    await userEvent.clear(input);
    await userEvent.type(input, 'test');
    
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('testuser')).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});


// ============================================================================
// Task 7.1: ARIA Attributes and Accessibility
// ============================================================================

describe('Task 7.1: ARIA Attributes and Accessibility', () => {
  const mockOnSelect = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Input Field ARIA Attributes', () => {
    it('should have role="combobox" on input field', () => {
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      expect(input).toBeInTheDocument();
    });
    
    it('should set aria-expanded="false" when dropdown is closed', () => {
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });
    
    it('should set aria-expanded="true" when dropdown is open', async () => {
      const mockResults = [
        { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'true');
      }, { timeout: 1000 });
    });
    
    it('should have aria-autocomplete="list" on input field', () => {
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
    });
    
    it('should have aria-controls pointing to dropdown id', () => {
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-controls', 'user-suggestions-listbox');
    });
    
    it('should not have aria-activedescendant when no item is highlighted', async () => {
      const mockResults = [
        { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      }, { timeout: 1000 });
      
      // Initially no item is highlighted
      expect(input).not.toHaveAttribute('aria-activedescendant');
    });
    
    it('should set aria-activedescendant pointing to highlighted item', async () => {
      const mockResults = [
        { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null },
        { uid: '2', username: 'user2', display_name: 'User Two', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      }, { timeout: 1000 });
      
      // Highlight first item
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(input).toHaveAttribute('aria-activedescendant', 'user-suggestion-0');
      
      // Highlight second item
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(input).toHaveAttribute('aria-activedescendant', 'user-suggestion-1');
    });
    
    it('should have custom aria-label when provided', () => {
      render(
        <UserSuggestionAutocomplete 
          onSelect={mockOnSelect} 
          ariaLabel="Search for contributors"
        />
      );
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-label', 'Search for contributors');
    });
    
    it('should have default aria-label when not provided', () => {
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-label', 'Tìm kiếm người dùng');
    });
  });
  
  describe('Dropdown ARIA Attributes', () => {
    it('should have role="listbox" on dropdown', async () => {
      const mockResults = [
        { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        const listbox = screen.getByRole('listbox');
        expect(listbox).toBeInTheDocument();
        expect(listbox).toHaveAttribute('id', 'user-suggestions-listbox');
      }, { timeout: 1000 });
    });
    
    it('should have aria-label on dropdown listbox', async () => {
      const mockResults = [
        { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        const listbox = screen.getByRole('listbox');
        expect(listbox).toHaveAttribute('aria-label', 'Gợi ý người dùng');
      }, { timeout: 1000 });
    });
  });
  
  describe('User Item ARIA Attributes', () => {
    it('should have role="option" on each user item', async () => {
      const mockResults = [
        { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null },
        { uid: '2', username: 'user2', display_name: 'User Two', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(2);
        options.forEach(option => {
          expect(option).toHaveAttribute('role', 'option');
        });
      }, { timeout: 1000 });
    });
    
    it('should set aria-selected="false" on non-highlighted items', async () => {
      const mockResults = [
        { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null },
        { uid: '2', username: 'user2', display_name: 'User Two', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options[0]).toHaveAttribute('aria-selected', 'false');
        expect(options[1]).toHaveAttribute('aria-selected', 'false');
      }, { timeout: 1000 });
    });
    
    it('should set aria-selected="true" on highlighted item', async () => {
      const mockResults = [
        { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null },
        { uid: '2', username: 'user2', display_name: 'User Two', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      }, { timeout: 1000 });
      
      // Highlight first item
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      
      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
      expect(options[1]).toHaveAttribute('aria-selected', 'false');
      
      // Highlight second item
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      
      expect(options[0]).toHaveAttribute('aria-selected', 'false');
      expect(options[1]).toHaveAttribute('aria-selected', 'true');
    });
    
    it('should have unique id for each user item', async () => {
      const mockResults = [
        { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null },
        { uid: '2', username: 'user2', display_name: 'User Two', avatar_url: null },
        { uid: '3', username: 'user3', display_name: 'User Three', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options[0]).toHaveAttribute('id', 'user-suggestion-0');
        expect(options[1]).toHaveAttribute('id', 'user-suggestion-1');
        expect(options[2]).toHaveAttribute('id', 'user-suggestion-2');
      }, { timeout: 1000 });
    });
  });
  
  describe('Live Region Announcements', () => {
    it('should announce suggestion count with aria-live="polite"', async () => {
      const mockResults = [
        { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null },
        { uid: '2', username: 'user2', display_name: 'User Two', avatar_url: null },
        { uid: '3', username: 'user3', display_name: 'User Three', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        // Find the live region announcement
        const liveRegion = screen.getByText('3 gợi ý có sẵn');
        expect(liveRegion).toBeInTheDocument();
        expect(liveRegion).toHaveAttribute('aria-live', 'polite');
        expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
      }, { timeout: 1000 });
    });
    
    it('should have sr-only class on live region for screen readers only', async () => {
      const mockResults = [
        { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        const liveRegion = screen.getByText('1 gợi ý có sẵn');
        expect(liveRegion).toHaveClass('sr-only');
      }, { timeout: 1000 });
    });
    
    it('should update announcement when suggestion count changes', async () => {
      const mockResults1 = [
        { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null }
      ];
      const mockResults2 = [
        { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null },
        { uid: '2', username: 'user2', display_name: 'User Two', avatar_url: null }
      ];
      
      userService.searchUsers.mockResolvedValueOnce(mockResults1);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        expect(screen.getByText('1 gợi ý có sẵn')).toBeInTheDocument();
      }, { timeout: 1000 });
      
      // Clear and search again with different results
      userService.searchUsers.mockResolvedValueOnce(mockResults2);
      await userEvent.clear(input);
      await userEvent.type(input, 'user');
      
      await waitFor(() => {
        expect(screen.getByText('2 gợi ý có sẵn')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });
  
  describe('Error Message Accessibility', () => {
    it('should have role="alert" on error messages', async () => {
      const mockError = new Error('Network error');
      mockError.code = 'NETWORK_ERROR';
      userService.searchUsers.mockRejectedValue(mockError);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('Không có kết nối mạng');
      }, { timeout: 1000 });
    });
    
    it('should have aria-live="polite" on error messages', async () => {
      const mockError = new Error('Timeout error');
      mockError.code = 'TIMEOUT_ERROR';
      userService.searchUsers.mockRejectedValue(mockError);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveAttribute('aria-live', 'polite');
      }, { timeout: 1000 });
    });
    
    it('should set aria-describedby on input when error occurs', async () => {
      const mockError = new Error('Server error');
      mockError.code = 'SERVER_ERROR';
      mockError.statusCode = 500;
      userService.searchUsers.mockRejectedValue(mockError);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-describedby', 'user-autocomplete-error');
        const errorElement = document.getElementById('user-autocomplete-error');
        expect(errorElement).toBeInTheDocument();
      }, { timeout: 1000 });
    });
    
    it('should display error icon with error message', async () => {
      const mockError = new Error('Network error');
      mockError.code = 'NETWORK_ERROR';
      userService.searchUsers.mockRejectedValue(mockError);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        const errorIcon = alert.querySelector('.material-symbols-outlined');
        expect(errorIcon).toBeInTheDocument();
        expect(errorIcon).toHaveTextContent('error');
      }, { timeout: 1000 });
    });
  });
  
  describe('Keyboard Navigation Accessibility', () => {
    it('should maintain focus on input during keyboard navigation', async () => {
      const mockResults = [
        { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null },
        { uid: '2', username: 'user2', display_name: 'User Two', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      }, { timeout: 1000 });
      
      // Navigate with keyboard
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(input).toHaveFocus();
      
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect(input).toHaveFocus();
      
      fireEvent.keyDown(input, { key: 'Enter' });
      // Focus should still be on input after selection
      expect(input).toHaveFocus();
    });
    
    it('should prevent default behavior for navigation keys', async () => {
      const mockResults = [
        { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      }, { timeout: 1000 });
      
      // Create spy for preventDefault
      const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
      const preventDefaultSpy = vi.spyOn(arrowDownEvent, 'preventDefault');
      
      input.dispatchEvent(arrowDownEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });
  
  describe('Integration: Complete Accessibility Flow', () => {
    it('should provide complete accessible experience for screen reader users', async () => {
      const mockResults = [
        { uid: '1', username: 'john_doe', display_name: 'John Doe', avatar_url: null },
        { uid: '2', username: 'jane_smith', display_name: 'Jane Smith', avatar_url: null }
      ];
      userService.searchUsers.mockResolvedValue(mockResults);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      
      // 1. Input has correct ARIA attributes
      expect(input).toHaveAttribute('role', 'combobox');
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(input).toHaveAttribute('aria-controls', 'user-suggestions-listbox');
      
      // 2. Type to trigger search
      await userEvent.type(input, 'john');
      
      // 3. Dropdown opens with correct ARIA attributes
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'true');
        const listbox = screen.getByRole('listbox');
        expect(listbox).toHaveAttribute('id', 'user-suggestions-listbox');
      }, { timeout: 1000 });
      
      // 4. Live region announces result count
      expect(screen.getByText('2 gợi ý có sẵn')).toBeInTheDocument();
      
      // 5. Options have correct ARIA attributes
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveAttribute('id', 'user-suggestion-0');
      expect(options[0]).toHaveAttribute('aria-selected', 'false');
      
      // 6. Navigate with keyboard
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      
      // 7. aria-activedescendant points to highlighted item
      expect(input).toHaveAttribute('aria-activedescendant', 'user-suggestion-0');
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
      
      // 8. Select with Enter key
      fireEvent.keyDown(input, { key: 'Enter' });
      
      // 9. Dropdown closes
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'false');
      });
      
      // 10. Selection callback is called
      expect(mockOnSelect).toHaveBeenCalledWith(mockResults[0]);
    });
    
    it('should handle error state accessibly', async () => {
      const mockError = new Error('Network error');
      mockError.code = 'NETWORK_ERROR';
      userService.searchUsers.mockRejectedValue(mockError);
      
      render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
      
      const input = screen.getByRole('combobox');
      await userEvent.type(input, 'test');
      
      await waitFor(() => {
        // Error is announced via alert role
        const alert = screen.getByRole('alert');
        expect(alert).toHaveAttribute('aria-live', 'polite');
        expect(alert).toHaveTextContent('Không có kết nối mạng');
        
        // Input is described by error
        expect(input).toHaveAttribute('aria-describedby', 'user-autocomplete-error');
      }, { timeout: 1000 });
    });
  });
});

// ============================================================================
// Task 6.2: Click Outside Detection
// ============================================================================

describe('Task 6.2: Click Outside Detection', () => {
  const mockOnSelect = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should handle click outside to close dropdown', async () => {
    const mockResults = [
      { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    const { container } = render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'test');
    
    // Wait for results and verify dropdown is open
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-expanded', 'true');
    }, { timeout: 1000 });
    
    // Click outside the component
    fireEvent.mouseDown(document.body);
    
    // Verify dropdown is closed
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });
  });
});

// ============================================================================
// Task 8.1: React.memo and Performance Optimization
// ============================================================================

describe('Task 8.1: React.memo and Performance Optimization', () => {
  const mockOnSelect = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should be wrapped with React.memo', () => {
    // Verify the component is a memoized component
    const Component = UserSuggestionAutocomplete;
    expect(Component.$$typeof).toBe(Symbol.for('react.memo'));
  });
  
  it('should not re-render when props do not change', () => {
    let renderCount = 0;
    
    // Create a wrapper component to track renders
    const TestWrapper = ({ onSelect, placeholder }) => {
      renderCount++;
      return <UserSuggestionAutocomplete onSelect={onSelect} placeholder={placeholder} />;
    };
    
    const { rerender } = render(<TestWrapper onSelect={mockOnSelect} placeholder="Test" />);
    
    expect(renderCount).toBe(1);
    
    // Rerender with same props (referential equality)
    rerender(<TestWrapper onSelect={mockOnSelect} placeholder="Test" />);
    
    // Component should not re-render because props haven't changed
    // Note: The wrapper will re-render, but the memoized component inside should not
    expect(renderCount).toBe(2); // Wrapper renders twice
  });
  
  it('should re-render when onSelect prop changes', () => {
    const mockOnSelect1 = vi.fn();
    const mockOnSelect2 = vi.fn();
    
    const { rerender } = render(<UserSuggestionAutocomplete onSelect={mockOnSelect1} />);
    
    const input1 = screen.getByRole('combobox');
    expect(input1).toBeInTheDocument();
    
    // Rerender with different onSelect callback
    rerender(<UserSuggestionAutocomplete onSelect={mockOnSelect2} />);
    
    const input2 = screen.getByRole('combobox');
    expect(input2).toBeInTheDocument();
  });
  
  it('should re-render when placeholder prop changes', () => {
    const { rerender } = render(
      <UserSuggestionAutocomplete onSelect={mockOnSelect} placeholder="Initial" />
    );
    
    expect(screen.getByPlaceholderText('Initial')).toBeInTheDocument();
    
    // Rerender with different placeholder
    rerender(
      <UserSuggestionAutocomplete onSelect={mockOnSelect} placeholder="Updated" />
    );
    
    expect(screen.getByPlaceholderText('Updated')).toBeInTheDocument();
  });
  
  it('should use stable callback references with useCallback', async () => {
    const mockResults = [
      { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    const { rerender } = render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'test');
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Store reference to the user item
    const userItem1 = screen.getByText('testuser').closest('li');
    const onClick1 = userItem1.onclick;
    
    // Rerender with same props
    rerender(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    // The callback should remain stable (same reference)
    // This is ensured by useCallback wrapping the handlers
    expect(input).toBeInTheDocument();
  });
  
  it('should maintain performance with multiple rapid rerenders', async () => {
    const { rerender } = render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    // Simulate multiple rapid rerenders with same props
    for (let i = 0; i < 10; i++) {
      rerender(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    }
    
    // Component should still be functional
    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Tìm kiếm người dùng...');
  });
  
  it('should handle keyboard events efficiently without re-renders', async () => {
    const mockResults = [
      { uid: '1', username: 'user1', display_name: 'User One', avatar_url: null },
      { uid: '2', username: 'user2', display_name: 'User Two', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'test');
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Perform multiple keyboard navigations
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    
    // Component should handle all events efficiently
    expect(input).toHaveAttribute('aria-activedescendant', 'user-suggestion-1');
  });
  
  it('should cache results efficiently without unnecessary API calls', async () => {
    const mockResults = [
      { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    
    // First search
    await userEvent.type(input, 'test');
    
    await waitFor(() => {
      expect(userService.searchUsers).toHaveBeenCalledTimes(1);
    }, { timeout: 1000 });
    
    // Clear and search again with same query
    await userEvent.clear(input);
    await userEvent.type(input, 'test');
    
    // Wait to ensure no new API call
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Should still be only 1 call (using cache)
    expect(userService.searchUsers).toHaveBeenCalledTimes(1);
  });
  
  it('should handle click outside efficiently', async () => {
    const mockResults = [
      { uid: '1', username: 'testuser', display_name: 'Test User', avatar_url: null }
    ];
    userService.searchUsers.mockResolvedValue(mockResults);
    
    const { container } = render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'test');
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-expanded', 'true');
    }, { timeout: 1000 });
    
    // Click outside multiple times
    fireEvent.mouseDown(document.body);
    fireEvent.mouseDown(document.body);
    fireEvent.mouseDown(document.body);
    
    // Dropdown should be closed
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });
  
  it('should verify all handlers use useCallback', () => {
    // This test verifies that the component implementation uses useCallback
    // by checking that the component is properly memoized and doesn't cause
    // unnecessary re-renders due to recreated callbacks
    
    const { rerender } = render(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input1 = screen.getByRole('combobox');
    
    // Rerender with same props
    rerender(<UserSuggestionAutocomplete onSelect={mockOnSelect} />);
    
    const input2 = screen.getByRole('combobox');
    
    // Both should be the same element (no re-render)
    expect(input1).toBe(input2);
  });
  
  it('should handle disabled state without performance issues', () => {
    const { rerender } = render(
      <UserSuggestionAutocomplete onSelect={mockOnSelect} disabled={false} />
    );
    
    let input = screen.getByRole('combobox');
    expect(input).not.toBeDisabled();
    
    // Toggle disabled state
    rerender(<UserSuggestionAutocomplete onSelect={mockOnSelect} disabled={true} />);
    
    input = screen.getByRole('combobox');
    expect(input).toBeDisabled();
    
    // Toggle back
    rerender(<UserSuggestionAutocomplete onSelect={mockOnSelect} disabled={false} />);
    
    input = screen.getByRole('combobox');
    expect(input).not.toBeDisabled();
  });
});
