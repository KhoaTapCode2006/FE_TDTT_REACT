import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PlaceListItem from './PlaceListItem';

// Mock the dependencies
vi.mock('@/components/ui/Icon', () => ({
  default: ({ name, size, className }) => (
    <span data-testid={`icon-${name}`} className={className} style={{ fontSize: size }}>
      {name}
    </span>
  ),
}));

vi.mock('@/components/hotel/components/HotelCard', () => ({
  default: ({ hotel }) => (
    <div data-testid="hotel-card">
      <h3>{hotel.name}</h3>
    </div>
  ),
}));

vi.mock('@/utils/format', () => ({
  fmtDate: (date) => {
    if (!date) return '-';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  },
}));

describe('PlaceListItem', () => {
  const mockPlace = {
    place_id: 'place-123',
    name: 'Test Hotel',
    images: [
      {
        thumbnail: 'https://example.com/thumbnail.jpg',
        original_image: 'https://example.com/original.jpg',
      },
    ],
    added_by: {
      username: 'testuser',
      display_name: 'Test User',
    },
    added_at: new Date('2024-01-15'),
    rating: 4.5,
    address: '123 Test Street',
  };

  it('renders compact view with place information', () => {
    const onToggle = vi.fn();
    render(
      <PlaceListItem
        place={mockPlace}
        isExpanded={false}
        onToggle={onToggle}
        isEditMode={false}
      />
    );

    expect(screen.getByText('Test Hotel')).toBeInTheDocument();
    expect(screen.getByText(/Thêm bởi: Test User/)).toBeInTheDocument();
    expect(screen.getByText(/15 Jan 2024/)).toBeInTheDocument();
  });

  it('displays placeholder image when images array is empty', () => {
    const placeWithoutImages = { ...mockPlace, images: [] };
    const onToggle = vi.fn();
    
    render(
      <PlaceListItem
        place={placeWithoutImages}
        isExpanded={false}
        onToggle={onToggle}
        isEditMode={false}
      />
    );

    const img = screen.getByAltText('Test Hotel');
    expect(img.src).toContain('unsplash.com');
  });

  it('displays fallback text for missing data fields', () => {
    const placeWithMissingData = {
      place_id: 'place-456',
      name: null,
      images: [],
      added_by: null,
      added_at: null,
    };
    const onToggle = vi.fn();

    render(
      <PlaceListItem
        place={placeWithMissingData}
        isExpanded={false}
        onToggle={onToggle}
        isEditMode={false}
      />
    );

    expect(screen.getByText('Unknown Place')).toBeInTheDocument();
    expect(screen.getByText(/Unknown User/)).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('calls onToggle when compact view is clicked', () => {
    const onToggle = vi.fn();
    render(
      <PlaceListItem
        place={mockPlace}
        isExpanded={false}
        onToggle={onToggle}
        isEditMode={false}
      />
    );

    const compactView = screen.getByRole('button', { name: /Expand Test Hotel/ });
    fireEvent.click(compactView);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders HotelCard when expanded', () => {
    const onToggle = vi.fn();
    render(
      <PlaceListItem
        place={mockPlace}
        isExpanded={true}
        onToggle={onToggle}
        isEditMode={false}
      />
    );

    expect(screen.getByTestId('hotel-card')).toBeInTheDocument();
    expect(screen.getAllByText('Test Hotel')).toHaveLength(2); // One in compact view, one in HotelCard
  });

  it('does not render HotelCard when collapsed', () => {
    const onToggle = vi.fn();
    render(
      <PlaceListItem
        place={mockPlace}
        isExpanded={false}
        onToggle={onToggle}
        isEditMode={false}
      />
    );

    expect(screen.queryByTestId('hotel-card')).not.toBeInTheDocument();
  });

  it('shows remove button in edit mode', () => {
    const onToggle = vi.fn();
    const onRemove = vi.fn();
    
    render(
      <PlaceListItem
        place={mockPlace}
        isExpanded={false}
        onToggle={onToggle}
        isEditMode={true}
        onRemove={onRemove}
      />
    );

    const removeButton = screen.getByTitle('Xóa khỏi collection');
    expect(removeButton).toBeInTheDocument();
  });

  it('does not show remove button in view mode', () => {
    const onToggle = vi.fn();
    
    render(
      <PlaceListItem
        place={mockPlace}
        isExpanded={false}
        onToggle={onToggle}
        isEditMode={false}
      />
    );

    expect(screen.queryByTitle('Xóa khỏi collection')).not.toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', () => {
    const onToggle = vi.fn();
    const onRemove = vi.fn();
    
    render(
      <PlaceListItem
        place={mockPlace}
        isExpanded={false}
        onToggle={onToggle}
        isEditMode={true}
        onRemove={onRemove}
      />
    );

    const removeButton = screen.getByTitle('Xóa khỏi collection');
    fireEvent.click(removeButton);

    expect(onRemove).toHaveBeenCalledWith('place-123');
    expect(onToggle).not.toHaveBeenCalled(); // Should not trigger toggle
  });

  it('shows expand_more icon when collapsed', () => {
    const onToggle = vi.fn();
    render(
      <PlaceListItem
        place={mockPlace}
        isExpanded={false}
        onToggle={onToggle}
        isEditMode={false}
      />
    );

    expect(screen.getByTestId('icon-expand_more')).toBeInTheDocument();
  });

  it('shows expand_less icon when expanded', () => {
    const onToggle = vi.fn();
    render(
      <PlaceListItem
        place={mockPlace}
        isExpanded={true}
        onToggle={onToggle}
        isEditMode={false}
      />
    );

    expect(screen.getByTestId('icon-expand_less')).toBeInTheDocument();
  });

  it('handles keyboard navigation with Enter key', () => {
    const onToggle = vi.fn();
    render(
      <PlaceListItem
        place={mockPlace}
        isExpanded={false}
        onToggle={onToggle}
        isEditMode={false}
      />
    );

    const compactView = screen.getByRole('button', { name: /Expand Test Hotel/ });
    fireEvent.keyDown(compactView, { key: 'Enter' });

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('handles image load error by showing placeholder', () => {
    const onToggle = vi.fn();
    render(
      <PlaceListItem
        place={mockPlace}
        isExpanded={false}
        onToggle={onToggle}
        isEditMode={false}
      />
    );

    const img = screen.getByAltText('Test Hotel');
    fireEvent.error(img);

    // After error, the component should use placeholder
    expect(img.src).toContain('unsplash.com');
  });
});
