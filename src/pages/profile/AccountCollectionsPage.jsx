import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collectionService } from '../../services/profile/collection.service';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/profile/EmptyState';

/**
 * AccountCollectionsPage Component
 * Display user's personal collections and community collections with Firebase integration
 */
const AccountCollectionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State management
  const [myCollections, setMyCollections] = useState([]);
  const [communityCollections, setCommunityCollections] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const popularTags = [
    'beach', 'luxury', 'boutique', 'family', 'business', 
    'mountain', 'city-center', 'resort', 'historic', 'unique'
  ];

  // Load collections from Firebase
  const loadCollections = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both my collections and community collections in parallel
      const [myCollectionsData, communityCollectionsData] = await Promise.all([
        collectionService.fetchMyCollections(user.uid),
        collectionService.fetchCommunityCollections()
      ]);
      
      setMyCollections(myCollectionsData);
      setCommunityCollections(communityCollectionsData);
    } catch (err) {
      console.error('Error loading collections:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load collections on component mount and when user changes
  useEffect(() => {
    loadCollections();
  }, [user]);

  // Handle creating a new collection
  const handleCreateCollection = async (collectionData) => {
    if (!user) return;
    
    try {
      await collectionService.createCollection(user.uid, collectionData);
      setShowCreateModal(false);
      // Reload collections to show the new one
      await loadCollections();
    } catch (err) {
      console.error('Error creating collection:', err);
      throw err; // Let the modal handle the error display
    }
  };

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

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
            <Icon name="error" className="text-red-500 mb-4" size={48} />
            <h3 className="font-semibold text-red-800 mb-2">Error Loading Collections</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={loadCollections}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <div className="space-y-12">
          {/* My Collections Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline font-bold text-2xl text-on-surface">
                My Collections
              </h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Icon name="add" size={20} />
                Create Collection
              </button>
            </div>
            
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
                onAction={() => setShowCreateModal(true)}
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

      {/* Create Collection Modal */}
      {showCreateModal && (
        <CreateCollectionModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateCollection}
        />
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
          src={collection.coverImage || 'https://placehold.co/400x225?text=Collection'}
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
            {collection.hotels?.length || 0} items
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

/**
 * CreateCollectionModal Component
 * Modal for creating new collections
 */
const CreateCollectionModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
    visibility: 'private'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Collection name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Parse tags from comma-separated string
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);

      const collectionData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        tags,
        visibility: formData.visibility
      };

      await onSubmit(collectionData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant">
          <h2 className="font-headline font-bold text-xl text-on-surface">
            Create New Collection
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-container rounded-full transition-colors"
            disabled={loading}
          >
            <Icon name="close" size={24} className="text-on-surface-variant" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Icon name="error" size={20} className="text-red-500" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Collection Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-on-surface mb-2">
              Collection Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter collection name"
              className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={loading}
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-on-surface mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your collection (optional)"
              rows={3}
              className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              disabled={loading}
              maxLength={500}
            />
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-semibold text-on-surface mb-2">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="Enter tags separated by commas (e.g., luxury, beach, family)"
              className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={loading}
            />
            <p className="text-xs text-on-surface-variant mt-1">
              Separate multiple tags with commas
            </p>
          </div>

          {/* Visibility Toggle */}
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-3">
              Visibility
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={formData.visibility === 'private'}
                  onChange={(e) => handleInputChange('visibility', e.target.value)}
                  className="w-4 h-4 text-primary focus:ring-primary"
                  disabled={loading}
                />
                <span className="text-sm text-on-surface">Private</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={formData.visibility === 'public'}
                  onChange={(e) => handleInputChange('visibility', e.target.value)}
                  className="w-4 h-4 text-primary focus:ring-primary"
                  disabled={loading}
                />
                <span className="text-sm text-on-surface">Public</span>
              </label>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Public collections can be discovered by other users
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                'Create Collection'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountCollectionsPage;