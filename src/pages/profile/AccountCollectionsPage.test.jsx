import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect } from 'vitest';
import AccountCollectionsPage from './AccountCollectionsPage';

// Test wrapper component to provide router context
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('AccountCollectionsPage - Checkpoint Tests', () => {
  test('renders page header correctly', async () => {
    render(
      <TestWrapper>
        <AccountCollectionsPage />
      </TestWrapper>
    );

    // Check page header
    expect(screen.getByText('Collections')).toBeInTheDocument();
    expect(screen.getByText('Discover and organize your favorite hotel collections')).toBeInTheDocument();
  });

  test('shows loading state initially', () => {
    render(
      <TestWrapper>
        <AccountCollectionsPage />
      </TestWrapper>
    );

    // Check loading state
    expect(screen.getByText('Loading collections...')).toBeInTheDocument();
  });

  test('renders My Collections section after loading', async () => {
    render(
      <TestWrapper>
        <AccountCollectionsPage />
      </TestWrapper>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading collections...')).not.toBeInTheDocument();
    }, { timeout: 1000 });

    // Check My Collections section
    expect(screen.getByText('My Collections')).toBeInTheDocument();
  });

  test('renders Community Collections section after loading', async () => {
    render(
      <TestWrapper>
        <AccountCollectionsPage />
      </TestWrapper>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading collections...')).not.toBeInTheDocument();
    }, { timeout: 1000 });

    // Check Community Collections section
    expect(screen.getByText('Community Collections')).toBeInTheDocument();
  });

  test('displays mock collection data', async () => {
    render(
      <TestWrapper>
        <AccountCollectionsPage />
      </TestWrapper>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading collections...')).not.toBeInTheDocument();
    }, { timeout: 1000 });

    // Check for some mock collection names
    expect(screen.getByText('Weekend Getaways')).toBeInTheDocument();
    expect(screen.getByText('Business Travel')).toBeInTheDocument();
    expect(screen.getByText('Tokyo Hidden Gems')).toBeInTheDocument();
  });

  test('displays popular tags for filtering', async () => {
    render(
      <TestWrapper>
        <AccountCollectionsPage />
      </TestWrapper>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading collections...')).not.toBeInTheDocument();
    }, { timeout: 1000 });

    // Check for some popular tags (using getAllByText to handle duplicates)
    expect(screen.getAllByText('beach').length).toBeGreaterThan(0);
    expect(screen.getAllByText('luxury').length).toBeGreaterThan(0);
    expect(screen.getAllByText('family').length).toBeGreaterThan(0);
  });

  test('collection cards display required information', async () => {
    render(
      <TestWrapper>
        <AccountCollectionsPage />
      </TestWrapper>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading collections...')).not.toBeInTheDocument();
    }, { timeout: 1000 });

    // Check for visibility badges
    expect(screen.getAllByText('Public').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Private').length).toBeGreaterThan(0);

    // Check for item counts
    expect(screen.getByText('12 items')).toBeInTheDocument();
    expect(screen.getByText('8 items')).toBeInTheDocument();
  });
});