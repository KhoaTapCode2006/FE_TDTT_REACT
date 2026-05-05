import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * CreateCollectionModal Component
 * Modal dialog for creating new global collections
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close modal callback
 * @param {Function} props.onCreate - Create collection callback
 */
const CreateCollectionModal = ({ isOpen, onClose, onCreate }) => {
  const [collectionName, setCollectionName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCollectionName('');
      setDescription('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    if (!collectionName.trim()) {
      setError('Collection name is required');
      return false;
    }
    
    if (collectionName.trim().length < 2) {
      setError('Collection name must be at least 2 characters');
      return false;
    }
    
    if (collectionName.trim().length > 50) {
      setError('Collection name must be less than 50 characters');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await onCreate({
        name: collectionName.trim(),
        description: description.trim(),
      });
      
      // Close modal on success
      onClose();
    } catch (err) {
      console.error('Error creating collection:', err);
      setError(err.message || 'Failed to create collection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleInputChange = (value) => {
    setCollectionName(value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/20">
          <h2 className="font-headline font-bold text-xl text-on-surface">
            Create New Collection
          </h2>
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full hover:bg-surface-container-low transition-colors flex items-center justify-center disabled:opacity-50"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Collection Name Input */}
          <div className="mb-4">
            <label className="block text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-2">
              Collection Name *
            </label>
            <input
              type="text"
              value={collectionName}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="e.g., Beach Resorts, City Hotels"
              disabled={isSubmitting}
              className={`w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all bg-surface-container-low/50 disabled:opacity-60 disabled:cursor-not-allowed ${
                error 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-outline-variant focus:border-primary'
              }`}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                <Icon name="error" size={14} />
                {error}
              </p>
            )}
            <p className="text-xs text-on-surface-variant mt-1.5">
              {collectionName.length}/50 characters
            </p>
          </div>

          {/* Description Textarea */}
          <div className="mb-6">
            <label className="block text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for your collection..."
              disabled={isSubmitting}
              rows={3}
              maxLength={200}
              className="w-full border border-outline-variant rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all bg-surface-container-low/50 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-on-surface-variant mt-1.5">
              {description.length}/200 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !collectionName.trim()}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm bg-primary text-white hover:bg-primary-container transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              )}
              {isSubmitting ? 'Creating...' : 'Create Collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCollectionModal;
