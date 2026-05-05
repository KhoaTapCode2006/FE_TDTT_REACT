import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '@/components/profile/EmptyState';

/**
 * AccountCollectionsPage Component
 * Display user's personal collections and community collections
 */
const AccountCollectionsPage = () => {
  const navigate = useNavigate();
  
  // State management
  const [myCollections, setMyCollections] = useState([]);
  const [communityCollections, setCommunityCollections] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data constants
  const mockMyCollections = [
    {
      id: 'my-col-1',
      name: 'Weekend Getaways',
      description: 'Perfect spots for quick weekend trips',
      coverImage: '/assets/hero.png',
      tags: ['weekend', 'relaxation', 'nature'],
      collaborators: [
        { id: 'user-2', name: 'Sarah Chen', avatar: 'https://placehold.co/40x40?text=SC' },
        { id: 'user-3', name: 'Mike Johnson', avatar: 'https://placehold.co/40x40?text=MJ' }
      ],
      visibility: 'private',
      itemCount: 12,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z',
      ownerId: 'current-user'
    },
    {
      id: 'my-col-2',
      name: 'Business Travel',
      description: 'Hotels for work trips and conferences',
      coverImage: 'https://placehold.co/400x225?text=Business+Hotels',
      tags: ['business', 'city-center', 'wifi'],
      collaborators: [],
      visibility: 'public',
      itemCount: 8,
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-18T16:45:00Z',
      ownerId: 'current-user'
    },
    {
      id: 'my-col-3',
      name: 'Family Vacations',
      description: 'Kid-friendly resorts and family hotels',
      coverImage: 'https://placehold.co/400x225?text=Family+Resorts',
      tags: ['family', 'kids', 'pool', 'activities'],
      collaborators: [
        { id: 'user-4', name: 'Lisa Park', avatar: 'https://placehold.co/40x40?text=LP' }
      ],
      visibility: 'private',
      itemCount: 15,
      createdAt: '2024-01-05T11:30:00Z',
      updatedAt: '2024-01-22T13:15:00Z',
      ownerId: 'current-user'
    }
  ];

  const mockCommunityCollections = [
    {
      id: 'comm-col-1',
      name: 'Tokyo Hidden Gems',
      description: 'Unique boutique hotels in Tokyo neighborhoods',
      coverImage: 'https://placehold.co/400x225?text=Tokyo+Hotels',
      tags: ['tokyo', 'boutique', 'unique', 'japan'],
      collaborators: [
        { id: 'user-5', name: 'Yuki Tanaka', avatar: 'https://placehold.co/40x40?text=YT' },
        { id: 'user-6', name: 'Alex Kim', avatar: 'https://placehold.co/40x40?text=AK' }
      ],
      visibility: 'public',
      itemCount: 20,
      createdAt: '2024-01-12T08:00:00Z',
      updatedAt: '2024-01-25T10:20:00Z',
      ownerId: 'user-5'
    },
    {
      id: 'comm-col-2',
      name: 'European Castles & Palaces',
      description: 'Historic luxury accommodations across Europe',
      coverImage: 'https://placehold.co/400x225?text=Castle+Hotels',
      tags: ['europe', 'luxury', 'historic', 'castle'],
      collaborators: [
        { id: 'user-7', name: 'Emma Wilson', avatar: 'https://placehold.co/40x40?text=EW' }
      ],
      visibility: 'public',
      itemCount: 18,
      createdAt: '2024-01-08T15:30:00Z',
      updatedAt: '2024-01-23T12:45:00Z',
      ownerId: 'user-7'
    },
    {
      id: 'comm-col-3',
      name: 'Beach Paradise',
      description: 'Stunning beachfront resorts worldwide',
      coverImage: 'https://placehold.co/400x225?text=Beach+Resorts',
      tags: ['beach', 'resort', 'tropical', 'ocean'],
      collaborators: [],
      visibility: 'public',
      itemCount: 25,
      createdAt: '2024-01-03T12:00:00Z',
      updatedAt: '2024-01-21T09:30:00Z',
      ownerId: 'user-8'
    },
    {
      id: 'comm-col-4',
      name: 'Mountain Retreats',
      description: 'Cozy lodges and cabins in mountain settings',
      coverImage: 'https://placehold.co/400x225?text=Mountain+Lodges',
      tags: ['mountain', 'nature', 'retreat', 'cozy'],
      collaborators: [
        { id: 'user-9', name: 'David Brown', avatar: 'https://placehold.co/40x40?text=DB' },
        { id: 'user-10', name: 'Maria Garcia', avatar: 'https://placehold.co/40x40?text=MG' }
      ],
      visibility: 'public',
      itemCount: 14,
      createdAt: '2024-01-01T10:15:00Z',
      updatedAt: '2024-01-24T14:00:00Z',
      ownerId: 'user-9'
    }
  ];

  const popularTags = [
    'beach', 'luxury', 'boutique', 'family', 'business', 
    'mountain', 'city-center', 'resort', 'historic', 'unique'
  ];

  // Simulate data loading
  useEffect(() => {
    const loadCollections = () => {
      try {
        setLoading(true);
        // Simulate API call delay
        setTimeout(() => {
          setMyCollections(mockMyCollections);
          setCommunityCollections(mockCommunityCollections);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error loading collections:', error);
        setLoading(false);
      }
    };

    loadCollections();
  }, []); // Empty dependency array to run only once

  // Filter community collections by selected tag
  const filteredCommunityCollections = selectedTag
    ? communityCollections.filter(collection => 
        collection.tags.includes(selectedTag)
      )
    : communityCollections;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-headline font-bold text-3xl text-on-surface mb-2">
          Collections
        </h1>
        <p className="text-base text-on-surface-variant">
          Discover and organize your favorite hotel collections
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-on-surface-variant">Loading collections...</p>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <div className="space-y-12">
          {/* My Collections Section */}
          <section>
            <h2 className="font-headline font-bold text-2xl text-on-surface mb-6">
              My Collections
            </h2>
            
            {myCollections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCollections.map((collection) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    onClick={(collection) => navigate(`/collections/${collection.id}`)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="collections"
                title="No collections yet"
                description="Create your first collection to start organizing your favorite hotels and destinations."
                actionLabel="Create Collection"
                onAction={() => console.log('Create collection')}
              />
            )}
          </section>

          {/* Community Collections Section */}
          <section>
            <h2 className="font-headline font-bold text-2xl text-on-surface mb-6">
              Community Collections
            </h2>
            
            {/* Popular Tags */}
            <div className="mb-6">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {popularTags.map((tag) => (
                  <PopularTag
                    key={tag}
                    tag={tag}
                    isSelected={selectedTag === tag}
                    onClick={(tag) => setSelectedTag(selectedTag === tag ? null : tag)}
                  />
                ))}
              </div>
            </div>

            {/* Community Collections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCommunityCollections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  onClick={(collection) => navigate(`/collections/${collection.id}`)}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

/**
 * CollectionCard Component (Embedded)
 * Displays collection information in a card format
 */
const CollectionCard = ({ collection, onClick }) => {
  const handleClick = () => {
    if (onClick && typeof onClick === 'function') {
      onClick(collection);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="bg-surface rounded-xl border border-outline-variant overflow-hidden hover:shadow-lg transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View collection: ${collection.name}`}
    >
      {/* Cover Image */}
      <div className="relative aspect-video bg-surface-container-low">
        <img
          src={collection.coverImage}
          alt={collection.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = 'https://placehold.co/400x225?text=Collection';
          }}
        />
        
        {/* Visibility Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            collection.visibility === 'public'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {collection.visibility === 'public' ? 'Public' : 'Private'}
          </span>
        </div>

        {/* Item Count Badge */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-black/70 text-white px-2 py-1 rounded-full text-xs font-semibold">
            {collection.itemCount} items
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Collection Name */}
        <h3 className="font-semibold text-lg text-on-surface mb-2 line-clamp-1">
          {collection.name}
        </h3>

        {/* Description */}
        {collection.description && (
          <p className="text-sm text-on-surface-variant mb-3 line-clamp-2">
            {collection.description}
          </p>
        )}

        {/* Tags */}
        {collection.tags && collection.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {collection.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-surface-container text-on-surface-variant text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {collection.tags.length > 3 && (
              <span className="px-2 py-1 bg-surface-container text-on-surface-variant text-xs rounded-full">
                +{collection.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Collaborators */}
        {collection.collaborators && collection.collaborators.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {collection.collaborators.slice(0, 3).map((collaborator) => (
                <img
                  key={collaborator.id}
                  src={collaborator.avatar}
                  alt={collaborator.name}
                  className="w-6 h-6 rounded-full border-2 border-surface"
                  onError={(e) => {
                    e.target.src = `https://placehold.co/24x24?text=${collaborator.name.charAt(0)}`;
                  }}
                />
              ))}
              {collection.collaborators.length > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-surface bg-surface-container flex items-center justify-center">
                  <span className="text-xs text-on-surface-variant font-semibold">
                    +{collection.collaborators.length - 3}
                  </span>
                </div>
              )}
            </div>
            <span className="text-xs text-on-surface-variant">
              {collection.collaborators.length} collaborator{collection.collaborators.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * PopularTag Component (Embedded)
 * Interactive tag filter for community collections
 */
const PopularTag = ({ tag, isSelected, onClick }) => {
  const handleClick = () => {
    if (onClick && typeof onClick === 'function') {
      onClick(tag);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        isSelected
          ? 'bg-primary text-white hover:bg-primary/90 focus:bg-primary/90'
          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface focus:bg-surface-container-high focus:text-on-surface'
      }`}
      aria-pressed={isSelected}
      aria-label={`Filter by ${tag} tag${isSelected ? ' (currently selected)' : ''}`}
      type="button"
    >
      {tag}
    </button>
  );
};

export default AccountCollectionsPage;