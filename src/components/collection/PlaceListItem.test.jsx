import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PlaceListItem from './PlaceListItem';

vi.mock('@/components/ui/Icon', () => ({
  default: ({ name, size, className }) => (
    <span data-testid={`icon-${name}`} className={className} style={{ fontSize: size }}>
      {name}
    </span>
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
    const onViewDetails = vi.fn();
    render(
      <PlaceListItem
        place={mockPlace}
        onViewDetails={onViewDetails}
        isEditMode={false}
      />
    );

    expect(screen.getByText('Test Hotel')).toBeInTheDocument();
    expect(screen.getByText(/Thêm bởi: Test User/)).toBeInTheDocument();
    expect(screen.getByText(/15 Jan 2024/)).toBeInTheDocument();
  });

  it('renders added-by avatar when avatar_url is valid', () => {
    const onViewDetails = vi.fn();
    const placeWithAvatar = {
      ...mockPlace,
      added_by: {
        ...mockPlace.added_by,
        avatar_url: 'https://example.com/avatar.jpg',
      },
    };

    render(
      <PlaceListItem
        place={placeWithAvatar}
        onViewDetails={onViewDetails}
        isEditMode={false}
      />
    );

    const avatar = screen.getByAltText('Test User avatar');
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('ignores invalid avatar_url placeholder from API', () => {
    const onViewDetails = vi.fn();
    const placeWithInvalidAvatar = {
      ...mockPlace,
      added_by: {
        ...mockPlace.added_by,
        avatar_url: 'string',
      },
    };

    render(
      <PlaceListItem
        place={placeWithInvalidAvatar}
        onViewDetails={onViewDetails}
        isEditMode={false}
      />
    );

    expect(screen.queryByAltText('Test User avatar')).not.toBeInTheDocument();
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('displays placeholder image when images array is empty', () => {
    const placeWithoutImages = { ...mockPlace, images: [] };
    const onViewDetails = vi.fn();

    render(
      <PlaceListItem
        place={placeWithoutImages}
        onViewDetails={onViewDetails}
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
    const onViewDetails = vi.fn();

    render(
      <PlaceListItem
        place={placeWithMissingData}
        onViewDetails={onViewDetails}
        isEditMode={false}
      />
    );

    expect(screen.getByText('Unknown Place')).toBeInTheDocument();
    expect(screen.getByText(/Unknown User/)).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('calls onViewDetails when row is clicked', () => {
    const onViewDetails = vi.fn();
    render(
      <PlaceListItem
        place={mockPlace}
        onViewDetails={onViewDetails}
        isEditMode={false}
      />
    );

    const row = screen.getByRole('button', { name: /Xem chi tiết Test Hotel/ });
    fireEvent.click(row);

    expect(onViewDetails).toHaveBeenCalledWith(mockPlace);
  });

  it('shows remove button in edit mode', () => {
    const onViewDetails = vi.fn();
    const onRemove = vi.fn();

    render(
      <PlaceListItem
        place={mockPlace}
        onViewDetails={onViewDetails}
        isEditMode={true}
        onRemove={onRemove}
      />
    );

    expect(screen.getByTitle('Xóa khỏi collection')).toBeInTheDocument();
  });

  it('does not show remove button in view mode', () => {
    const onViewDetails = vi.fn();

    render(
      <PlaceListItem
        place={mockPlace}
        onViewDetails={onViewDetails}
        isEditMode={false}
      />
    );

    expect(screen.queryByTitle('Xóa khỏi collection')).not.toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', () => {
    const onViewDetails = vi.fn();
    const onRemove = vi.fn();

    render(
      <PlaceListItem
        place={mockPlace}
        onViewDetails={onViewDetails}
        isEditMode={true}
        onRemove={onRemove}
      />
    );

    fireEvent.click(screen.getByTitle('Xóa khỏi collection'));

    expect(onRemove).toHaveBeenCalledWith('place-123');
    expect(onViewDetails).not.toHaveBeenCalled();
  });

  it('handles keyboard navigation with Enter key', () => {
    const onViewDetails = vi.fn();
    render(
      <PlaceListItem
        place={mockPlace}
        onViewDetails={onViewDetails}
        isEditMode={false}
      />
    );

    const row = screen.getByRole('button', { name: /Xem chi tiết Test Hotel/ });
    fireEvent.keyDown(row, { key: 'Enter' });

    expect(onViewDetails).toHaveBeenCalledWith(mockPlace);
  });

  it('handles image load error by showing placeholder', () => {
    const onViewDetails = vi.fn();
    render(
      <PlaceListItem
        place={mockPlace}
        onViewDetails={onViewDetails}
        isEditMode={false}
      />
    );

    fireEvent.error(screen.getByAltText('Test Hotel'));
    expect(screen.getByAltText('Test Hotel').src).toContain('unsplash.com');
  });
});
