import { useState } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * InfoSection Component
 * Displays personal information fields with edit functionality
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
 * 
 * @param {Object} props
 * @param {Object} props.profileData - User profile data
 * @param {Function} props.onEdit - Callback when edit button is clicked
 * @param {boolean} props.loading - Loading state
 */
const InfoSection = ({ profileData, onEdit, loading = false }) => {
  /**
   * Format field value with placeholder for empty fields
   * Requirement 2.8: Display placeholder text for empty fields
   */
  const formatValue = (value, placeholder = 'Not provided') => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-on-surface-variant italic">{placeholder}</span>;
    }
    return value;
  };

  /**
   * Capitalize first letter of string
   */
  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <div className="bg-white rounded-2xl border border-outline-variant/20 p-6 shadow-sm">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-headline font-bold text-2xl text-on-surface">
          Personal Information
        </h2>
        <button
          onClick={onEdit}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Edit profile information"
        >
          <Icon name="edit" size={18} aria-hidden="true" />
          Edit
        </button>
      </div>

      {/* Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name - Requirement 2.1 */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1 block">
            Full Name
          </label>
          <p className="text-on-surface font-medium">
            {formatValue(profileData?.fullName)}
          </p>
        </div>

        {/* Username - Requirement 2.2 */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1 block">
            Username
          </label>
          <p className="text-on-surface font-medium">
            {formatValue(profileData?.username)}
          </p>
        </div>

        {/* Email (Read-only) */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1 block">
            Email
          </label>
          <p className="text-on-surface font-medium flex items-center gap-2">
            {formatValue(profileData?.email)}
            {profileData?.emailVerified && (
              <Icon 
                name="verified" 
                size={16} 
                className="text-primary" 
                variant="filled"
                aria-label="Email verified"
              />
            )}
          </p>
        </div>

        {/* Phone Number - Requirement 2.6 */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1 block">
            Phone Number
          </label>
          <p className="text-on-surface font-medium">
            {formatValue(profileData?.phoneNumber)}
          </p>
        </div>

        {/* Age - Requirement 2.3 */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1 block">
            Age
          </label>
          <p className="text-on-surface font-medium">
            {formatValue(profileData?.age)}
          </p>
        </div>

        {/* Gender - Requirement 2.4 */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1 block">
            Gender
          </label>
          <p className="text-on-surface font-medium">
            {profileData?.gender ? capitalize(profileData.gender) : formatValue(null)}
          </p>
        </div>

        {/* Location - Requirement 2.5 */}
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1 block">
            Location
          </label>
          <p className="text-on-surface font-medium flex items-start gap-2">
            {profileData?.location && (
              <Icon name="location_on" size={18} className="text-on-surface-variant flex-shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <span>{formatValue(profileData?.location)}</span>
          </p>
        </div>

        {/* Bio - Requirement 2.7 */}
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1 block">
            Bio
          </label>
          <p className="text-on-surface font-medium leading-relaxed">
            {formatValue(profileData?.bio, 'No bio added yet')}
          </p>
        </div>

        {/* Work */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1 block">
            Work
          </label>
          <p className="text-on-surface font-medium">
            {formatValue(profileData?.work)}
          </p>
        </div>

        {/* Job Title */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1 block">
            Job Title
          </label>
          <p className="text-on-surface font-medium">
            {formatValue(profileData?.jobTitle)}
          </p>
        </div>

        {/* Education */}
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1 block">
            Education
          </label>
          <p className="text-on-surface font-medium">
            {formatValue(profileData?.education)}
          </p>
        </div>
      </div>

      {/* Member Since */}
      {profileData?.createdAt && (
        <div className="mt-6 pt-6 border-t border-outline-variant/20">
          <div className="flex items-center gap-2 text-on-surface-variant text-sm">
            <Icon name="calendar_today" size={16} aria-hidden="true" />
            <span>
              Member since {new Date(profileData.createdAt.toDate?.() || profileData.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoSection;
