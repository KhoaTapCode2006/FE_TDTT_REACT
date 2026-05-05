import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateCollectionModal from './CreateCollectionModal';

describe('CreateCollectionModal - Task 7.2: Collection Creation Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call onCreate with collection data when form is submitted', async () => {
    const mockOnCreate = vi.fn().mockResolvedValue(undefined);
    const mockOnClose = vi.fn();
    const user = userEvent.setup();

    render(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    // Fill in the form
    const nameInput = screen.getByPlaceholderText(/e.g., Beach Resorts/i);
    const descriptionInput = screen.getByPlaceholderText(/Add a description/i);

    await user.type(nameInput, 'My Test Collection');
    await user.type(descriptionInput, 'A test collection description');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create collection/i });
    await user.click(submitButton);

    // Verify onCreate was called with correct data
    await waitFor(() => {
      expect(mockOnCreate).toHaveBeenCalledWith({
        name: 'My Test Collection',
        description: 'A test collection description',
      });
    });
  });

  it('should close modal on successful creation', async () => {
    const mockOnCreate = vi.fn().mockResolvedValue(undefined);
    const mockOnClose = vi.fn();
    const user = userEvent.setup();

    render(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    // Fill in the form
    const nameInput = screen.getByPlaceholderText(/e.g., Beach Resorts/i);
    await user.type(nameInput, 'My Test Collection');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create collection/i });
    await user.click(submitButton);

    // Verify modal closes after successful creation
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should handle creation errors and display error message', async () => {
    const mockOnCreate = vi.fn().mockRejectedValue(new Error('Failed to create collection'));
    const mockOnClose = vi.fn();
    const user = userEvent.setup();

    render(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    // Fill in the form
    const nameInput = screen.getByPlaceholderText(/e.g., Beach Resorts/i);
    await user.type(nameInput, 'My Test Collection');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create collection/i });
    await user.click(submitButton);

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to create collection/i)).toBeInTheDocument();
    });

    // Verify modal does NOT close on error
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should disable submit button while submitting', async () => {
    const mockOnCreate = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    const mockOnClose = vi.fn();
    const user = userEvent.setup();

    render(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    // Fill in the form
    const nameInput = screen.getByPlaceholderText(/e.g., Beach Resorts/i);
    await user.type(nameInput, 'My Test Collection');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create collection/i });
    await user.click(submitButton);

    // Verify button is disabled during submission
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/creating\.\.\./i)).toBeInTheDocument();

    // Wait for submission to complete
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should disable submit button when collection name is empty', async () => {
    const mockOnCreate = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    // Verify submit button is disabled when name is empty
    const submitButton = screen.getByRole('button', { name: /create collection/i });
    expect(submitButton).toBeDisabled();

    // Verify onCreate was NOT called
    expect(mockOnCreate).not.toHaveBeenCalled();
  });

  it('should trim whitespace from collection name and description', async () => {
    const mockOnCreate = vi.fn().mockResolvedValue(undefined);
    const mockOnClose = vi.fn();
    const user = userEvent.setup();

    render(
      <CreateCollectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreate={mockOnCreate}
      />
    );

    // Fill in the form with extra whitespace
    const nameInput = screen.getByPlaceholderText(/e.g., Beach Resorts/i);
    const descriptionInput = screen.getByPlaceholderText(/Add a description/i);

    await user.type(nameInput, '  My Test Collection  ');
    await user.type(descriptionInput, '  Test description  ');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create collection/i });
    await user.click(submitButton);

    // Verify onCreate was called with trimmed data
    await waitFor(() => {
      expect(mockOnCreate).toHaveBeenCalledWith({
        name: 'My Test Collection',
        description: 'Test description',
      });
    });
  });
});
