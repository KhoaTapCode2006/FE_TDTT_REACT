import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * EditInfoModal Component
 * Modal dialog for editing user profile information with table-style layout
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close modal callback
 * @param {Object} props.profileData - Current profile data
 * @param {Function} props.onSave - Save callback with updated data
 */
const EditInfoModal = ({ isOpen, onClose, profileData, onSave }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    age: '',
    gender: '',
    location: '',
    phoneNumber: '',
    bio: '',
    work: '',
    jobTitle: '',
    education: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Refs for input fields (in order from top to bottom)
  const fullNameRef = useRef(null);
  const usernameRef = useRef(null);
  const bioRef = useRef(null);
  const workRef = useRef(null);
  const jobTitleRef = useRef(null);
  const educationRef = useRef(null);
  const locationRef = useRef(null);
  const phoneNumberRef = useRef(null);
  const ageRef = useRef(null);
  const genderRef = useRef(null);

  // Initialize form data when modal opens or profileData changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: profileData?.fullName || '',
        username: profileData?.username || '',
        age: profileData?.age || '',
        gender: profileData?.gender || '',
        location: profileData?.location || '',
        phoneNumber: profileData?.phoneNumber || '',
        bio: profileData?.bio || '',
        work: profileData?.work || '',
        jobTitle: profileData?.jobTitle || '',
        education: profileData?.education || ''
      });
      setErrors({});
      setSaveError('');
      setSaveSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen, profileData]);

  /**
   * Validate form fields
   * Requirements: 2.1 (fullName), 2.2 (username), 2.3 (age), 2.6 (phoneNumber)
   */
  const validateForm = () => {
    const newErrors = {};

    // Full Name validation - Required
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    } else if (formData.fullName.trim().length > 100) {
      newErrors.fullName = 'Full name must be less than 100 characters';
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

    // Age validation - Optional but must be valid if provided
    if (formData.age !== '') {
      const ageNum = parseInt(formData.age, 10);
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
        newErrors.age = 'Age must be between 13 and 120';
      }
    }

    // Phone Number validation - Optional but must be valid if provided
    if (formData.phoneNumber.trim()) {
      // Basic phone number format validation (allows various formats)
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(formData.phoneNumber.trim())) {
        newErrors.phoneNumber = 'Please enter a valid phone number';
      } else if (formData.phoneNumber.trim().replace(/\D/g, '').length < 10) {
        newErrors.phoneNumber = 'Phone number must be at least 10 digits';
      }
    }

    // Location validation - Optional but has max length
    if (formData.location.trim().length > 200) {
      newErrors.location = 'Location must be less than 200 characters';
    }

    // Bio validation - Optional but has max length
    if (formData.bio.trim().length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    setErrors(newErrors);
    
    // If there are errors, scroll to the first error field (from top to bottom)
    if (Object.keys(newErrors).length > 0) {
      scrollToFirstError(newErrors);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Scroll to the first error field (from top to bottom)
   */
  const scrollToFirstError = (errorObj) => {
    // Define field order from top to bottom (matching the form layout)
    const fieldOrder = [
      { name: 'fullName', ref: fullNameRef },
      { name: 'username', ref: usernameRef },
      { name: 'bio', ref: bioRef },
      { name: 'work', ref: workRef },
      { name: 'jobTitle', ref: jobTitleRef },
      { name: 'education', ref: educationRef },
      { name: 'location', ref: locationRef },
      { name: 'phoneNumber', ref: phoneNumberRef },
      { name: 'age', ref: ageRef },
      { name: 'gender', ref: genderRef }
    ];

    // Find the first field with an error
    for (const field of fieldOrder) {
      if (errorObj[field.name] && field.ref.current) {
        // Scroll to the field
        field.ref.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Focus on the field after a short delay (to allow scroll to complete)
        setTimeout(() => {
          field.ref.current.focus();
        }, 300);
        
        break; // Stop after finding the first error
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
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    // Clear save error when user makes changes
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
      // Prepare data for save (convert empty strings to null, parse age)
      const dataToSave = {
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        age: formData.age ? parseInt(formData.age, 10) : null,
        gender: formData.gender || null,
        location: formData.location ? formData.location.trim() : null,
        phoneNumber: formData.phoneNumber ? formData.phoneNumber.trim() : null,
        bio: formData.bio ? formData.bio.trim() : null,
        work: formData.work ? formData.work.trim() : null,
        jobTitle: formData.jobTitle ? formData.jobTitle.trim() : null,
        education: formData.education ? formData.education.trim() : null
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
      console.error('Error code:', err.code);
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
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/20">
          <div>
            <h2 className="font-headline font-bold text-2xl text-on-surface">
              Profile Settings
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Manage your personal information
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

          {/* Table-style Form */}
          <div className="p-6">
            <div className="border border-outline-variant/20 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-surface-container-low/30">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-bold text-on-surface-variant uppercase tracking-wider w-1/3">
                      Field Name
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                      Current Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {/* Full Name */}
                  <tr className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="px-6 py-4">
                      <label htmlFor="fullName" className="text-sm font-semibold text-on-surface">
                        Name <span className="text-red-500">*</span>
                      </label>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        ref={fullNameRef}
                        id="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        placeholder="Enter your full name"
                        disabled={isSubmitting}
                        className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                          errors.fullName 
                            ? 'border-red-300 focus:border-red-500' 
                            : 'border-outline-variant focus:border-primary'
                        }`}
                      />
                      {errors.fullName && (
                        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                          <Icon name="error" size={12} aria-hidden="true" />
                          {errors.fullName}
                        </p>
                      )}
                    </td>
                  </tr>

                  {/* Username */}
                  <tr className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="px-6 py-4">
                      <label htmlFor="username" className="text-sm font-semibold text-on-surface">
                        Username <span className="text-red-500">*</span>
                      </label>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        ref={usernameRef}
                        id="username"
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        placeholder="Enter your username"
                        disabled={isSubmitting}
                        className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
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
                    </td>
                  </tr>

                  {/* Bio */}
                  <tr className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="px-6 py-4">
                      <label htmlFor="bio" className="text-sm font-semibold text-on-surface">
                        Bio
                      </label>
                    </td>
                    <td className="px-6 py-4">
                      <textarea
                        ref={bioRef}
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        placeholder="Tell us about yourself..."
                        disabled={isSubmitting}
                        rows={3}
                        maxLength={500}
                        className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed ${
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
                    </td>
                  </tr>

                  {/* Work */}
                  <tr className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="px-6 py-4">
                      <label htmlFor="work" className="text-sm font-semibold text-on-surface">
                        Work
                      </label>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        ref={workRef}
                        id="work"
                        type="text"
                        value={formData.work}
                        onChange={(e) => handleInputChange('work', e.target.value)}
                        placeholder="Your company or workplace"
                        disabled={isSubmitting}
                        className="w-full border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </td>
                  </tr>

                  {/* Job Title */}
                  <tr className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="px-6 py-4">
                      <label htmlFor="jobTitle" className="text-sm font-semibold text-on-surface">
                        Job Title
                      </label>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        ref={jobTitleRef}
                        id="jobTitle"
                        type="text"
                        value={formData.jobTitle}
                        onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                        placeholder="Your job title"
                        disabled={isSubmitting}
                        className="w-full border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </td>
                  </tr>

                  {/* Education */}
                  <tr className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="px-6 py-4">
                      <label htmlFor="education" className="text-sm font-semibold text-on-surface">
                        Education
                      </label>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        ref={educationRef}
                        id="education"
                        type="text"
                        value={formData.education}
                        onChange={(e) => handleInputChange('education', e.target.value)}
                        placeholder="Your education background"
                        disabled={isSubmitting}
                        className="w-full border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </td>
                  </tr>

                  {/* Places Lived */}
                  <tr className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="px-6 py-4">
                      <label htmlFor="location" className="text-sm font-semibold text-on-surface">
                        Places Lived
                      </label>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        ref={locationRef}
                        id="location"
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="Cities or countries you've lived in"
                        disabled={isSubmitting}
                        className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                          errors.location 
                            ? 'border-red-300 focus:border-red-500' 
                            : 'border-outline-variant focus:border-primary'
                        }`}
                      />
                      {errors.location && (
                        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                          <Icon name="error" size={12} aria-hidden="true" />
                          {errors.location}
                        </p>
                      )}
                    </td>
                  </tr>

                  {/* Email (Read-only) */}
                  <tr className="hover:bg-surface-container-low/20 transition-colors bg-surface-container-low/10">
                    <td className="px-6 py-4">
                      <label className="text-sm font-semibold text-on-surface-variant">
                        Email
                      </label>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-on-surface-variant italic">
                        {profileData?.email || 'Not provided'}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Email cannot be changed
                      </p>
                    </td>
                  </tr>

                  {/* Phone */}
                  <tr className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="px-6 py-4">
                      <label htmlFor="phoneNumber" className="text-sm font-semibold text-on-surface">
                        Phone
                      </label>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        ref={phoneNumberRef}
                        id="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        placeholder="Enter your phone number"
                        disabled={isSubmitting}
                        className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
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
                    </td>
                  </tr>

                  {/* Age */}
                  <tr className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="px-6 py-4">
                      <label htmlFor="age" className="text-sm font-semibold text-on-surface">
                        Age
                      </label>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        ref={ageRef}
                        id="age"
                        type="number"
                        min="13"
                        max="120"
                        value={formData.age}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        placeholder="Enter your age"
                        disabled={isSubmitting}
                        className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                          errors.age 
                            ? 'border-red-300 focus:border-red-500' 
                            : 'border-outline-variant focus:border-primary'
                        }`}
                      />
                      {errors.age && (
                        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                          <Icon name="error" size={12} aria-hidden="true" />
                          {errors.age}
                        </p>
                      )}
                    </td>
                  </tr>

                  {/* Gender */}
                  <tr className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="px-6 py-4">
                      <label htmlFor="gender" className="text-sm font-semibold text-on-surface">
                        Gender
                      </label>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        ref={genderRef}
                        id="gender"
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        disabled={isSubmitting}
                        className="w-full border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </form>

        {/* Footer with Action Buttons */}
        <div className="flex gap-3 p-6 border-t border-outline-variant/20 bg-surface-container-low/10">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-lg font-semibold text-sm border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-lg font-semibold text-sm bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
