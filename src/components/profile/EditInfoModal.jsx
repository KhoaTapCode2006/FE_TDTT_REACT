import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * EditInfoModal Component
 * Modal dialog for editing user profile information
 * Synchronized with backend API fields
 * 
 * Backend editable fields: username, display_name, phone_number, bio
 * Backend read-only fields: email, avatar_url (handled separately), created_at, last_login
 */
const EditInfoModal = ({ isOpen, onClose, profileData, onSave }) => {
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    phoneNumber: '',
    bio: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Refs for input fields
  const displayNameRef = useRef(null);
  const usernameRef = useRef(null);
  const phoneNumberRef = useRef(null);
  const bioRef = useRef(null);

  // Initialize form data when modal opens or profileData changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        displayName: profileData?.displayName || '',
        username: profileData?.username || '',
        phoneNumber: profileData?.phoneNumber || '',
        bio: profileData?.bio || ''
      });
      setErrors({});
      setSaveError('');
      setSaveSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen, profileData]);

  /**
   * Validate form fields
   */
  const validateForm = () => {
    const newErrors = {};

    // Display Name validation - Required
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    } else if (formData.displayName.trim().length > 100) {
      newErrors.displayName = 'Display name must be less than 100 characters';
    }

    // Username validation - Required
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.trim().length > 30) {
      newErrors.username = 'Username must be less than 30 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Phone Number validation - Optional but must be valid if provided
    if (formData.phoneNumber.trim()) {
      // Basic phone number format validation
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(formData.phoneNumber.trim())) {
        newErrors.phoneNumber = 'Please enter a valid phone number';
      } else if (formData.phoneNumber.trim().replace(/\D/g, '').length < 10) {
        newErrors.phoneNumber = 'Phone number must be at least 10 digits';
      }
    }

    // Bio validation - Optional but has max length
    if (formData.bio.trim().length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    setErrors(newErrors);
    
    // If there are errors, scroll to the first error field
    if (Object.keys(newErrors).length > 0) {
      scrollToFirstError(newErrors);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Scroll to the first error field
   */
  const scrollToFirstError = (errorObj) => {
    const fieldOrder = [
      { name: 'displayName', ref: displayNameRef },
      { name: 'username', ref: usernameRef },
      { name: 'phoneNumber', ref: phoneNumberRef },
      { name: 'bio', ref: bioRef }
    ];

    for (const field of fieldOrder) {
      if (errorObj[field.name] && field.ref.current) {
        field.ref.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        setTimeout(() => {
          field.ref.current.focus();
        }, 300);
        
        break;
      }
    }
  };

  /**
   * Handle input change
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    // Clear save error
    if (saveError) {
      setSaveError('');
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔵 Form submitted');
    console.log('Form data:', formData);
    
    if (!validateForm()) {
      console.log('❌ Validation failed');
      console.log('Errors:', errors);
      return;
    }
    
    console.log('✅ Validation passed');
    
    setIsSubmitting(true);
    setSaveError('');
    setSaveSuccess(false);
    
    try {
      // Prepare data for save (convert empty strings to null)
      const dataToSave = {
        displayName: formData.displayName.trim(),
        username: formData.username.trim(),
        phoneNumber: formData.phoneNumber ? formData.phoneNumber.trim() : null,
        bio: formData.bio ? formData.bio.trim() : null
      };
      
      console.log('📤 Sending data to save:', dataToSave);
      
      await onSave(dataToSave);
      
      console.log('✅ Save successful');
      
      // Show success message
      setSaveSuccess(true);
      setIsSubmitting(false);
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('❌ Error saving profile:', err);
      console.error('Error message:', err.message);
      setSaveError(err.message || 'Failed to save profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/20">
          <div>
            <h2 className="font-headline font-bold text-2xl text-on-surface">
              Edit Profile
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Update your personal information
            </p>
          </div>
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="w-10 h-10 rounded-full hover:bg-surface-container-low transition-colors flex items-center justify-center disabled:opacity-50"
            aria-label="Close modal"
          >
            <Icon name="close" size={24} aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          {/* Success Message */}
          {saveSuccess && (
            <div className="mx-6 mt-6 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
              <Icon name="check_circle" size={18} className="text-green-500 flex-shrink-0" aria-hidden="true" />
              <p className="text-sm text-green-600">Profile updated successfully!</p>
            </div>
          )}

          {/* Error Message */}
          {saveError && (
            <div className="mx-6 mt-6 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <Icon name="error" size={18} className="text-red-500 flex-shrink-0" aria-hidden="true" />
              <p className="text-sm text-red-600">{saveError}</p>
            </div>
          )}

          {/* Form Fields */}
          <div className="p-6 space-y-6">
            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-semibold text-on-surface mb-2">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={displayNameRef}
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                placeholder="Enter your display name"
                disabled={isSubmitting}
                className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  errors.displayName 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-outline-variant focus:border-primary'
                }`}
              />
              {errors.displayName && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <Icon name="error" size={12} aria-hidden="true" />
                  {errors.displayName}
                </p>
              )}
              <p className="text-xs text-on-surface-variant mt-1">
                This is how your name will appear to others
              </p>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-on-surface mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                ref={usernameRef}
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter your username"
                disabled={isSubmitting}
                className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  errors.username 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-outline-variant focus:border-primary'
                }`}
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <Icon name="error" size={12} aria-hidden="true" />
                  {errors.username}
                </p>
              )}
              <p className="text-xs text-on-surface-variant mt-1">
                Letters, numbers, and underscores only
              </p>
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Email
              </label>
              <div className="w-full border border-outline-variant/50 rounded-lg px-4 py-3 text-sm bg-surface-container-low/30 text-on-surface-variant">
                {profileData?.email || 'Not provided'}
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                Email cannot be changed
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-semibold text-on-surface mb-2">
                Phone Number
              </label>
              <input
                ref={phoneNumberRef}
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                placeholder="Enter your phone number"
                disabled={isSubmitting}
                className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  errors.phoneNumber 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-outline-variant focus:border-primary'
                }`}
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <Icon name="error" size={12} aria-hidden="true" />
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-semibold text-on-surface mb-2">
                Bio
              </label>
              <textarea
                ref={bioRef}
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                disabled={isSubmitting}
                rows={4}
                maxLength={500}
                className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed ${
                  errors.bio 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-outline-variant focus:border-primary'
                }`}
              />
              {errors.bio && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <Icon name="error" size={12} aria-hidden="true" />
                  {errors.bio}
                </p>
              )}
              <p className="text-xs text-on-surface-variant mt-1">
                {formData.bio.length}/500 characters
              </p>
            </div>
          </div>
        </form>

        {/* Footer with Action Buttons */}
        <div className="flex gap-3 p-6 border-t border-outline-variant/20 bg-surface-container-low/10">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 rounded-lg font-semibold text-sm border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 rounded-lg font-semibold text-sm bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true"></div>
            )}
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditInfoModal;
