import { useState, useEffect } from 'react';
import Icon from '../ui/Icon.jsx';

/**
 * LikeButton Component
 * Reusable like/unlike button for collections with optimistic UI updates
 * 
 * @param {string} collectionId - Collection ID
 * @param {boolean} isLiked - Whether the collection is currently liked
 * @param {Function} onLike - Callback function (collectionId, shouldLike) => Promise<void>
 * @param {string} size - Button size: 'small' | 'medium' | 'large'
 * @param {string} className - Additional CSS classes
 */
const LikeButton = ({ 
  collectionId, 
  isLiked = false, 
  onLike, 
  size = 'medium',
  className = '' 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [liked, setLiked] = useState(isLiked);

  // Update local state when prop changes
  useEffect(() => {
    setLiked(isLiked);
  }, [isLiked]);

  // Size mappings
  const sizeMap = {
    small: { button: 'w-8 h-8', icon: 18 },
    medium: { button: 'w-10 h-10', icon: 20 },
    large: { button: 'w-12 h-12', icon: 24 }
  };

  const buttonSize = sizeMap[size] || sizeMap.medium;

  /**
   * Handle like button click with optimistic update
   */
  const handleClick = async (e) => {
    // Prevent event bubbling to parent elements (e.g., card click)
    e.stopPropagation();
    e.preventDefault();

    if (isLoading || !onLike) return;

    // Store previous state for rollback
    const previousState = liked;
    
    // Optimistic update
    setLiked(!liked);
    setIsLoading(true);

    try {
      // Call parent callback
      await onLike(collectionId, !liked);
      
      // Success - state already updated optimistically
    } catch (error) {
      // Rollback on failure
      console.error('Like/unlike failed:', error);
      setLiked(previousState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        like-button
        ${buttonSize.button}
        flex items-center justify-center
        rounded-full
        bg-white/90 backdrop-blur-sm
        shadow-md hover:shadow-lg
        transition-all duration-200
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}
        ${className}
      `}
      aria-label={liked ? 'Unlike collection' : 'Like collection'}
      aria-pressed={liked}
      title={liked ? 'Unlike collection' : 'Like collection'}
    >
      {isLoading ? (
        <Icon 
          name="progress_activity" 
          size={buttonSize.icon}
          className="text-gray-400 animate-spin"
        />
      ) : (
        <Icon 
          name={liked ? 'favorite' : 'favorite_border'} 
          size={buttonSize.icon}
          className={`transition-colors duration-200 ${
            liked ? 'text-red-500' : 'text-gray-600 hover:text-red-400'
          }`}
        />
      )}
    </button>
  );
};

export default LikeButton;
