import { useState } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * InfoSection Component
 * Displays personal information fields with edit functionality
 * Synchronized with backend API fields
 * 
 * Backend fields: username, display_name, email, phone_number, avatar_url, bio
 */
const InfoSection = ({ profileData, onEdit, loading = false }) => {
  /**
   * Format field value with placeholder for empty fields
   */
  const formatValue = (value, placeholder = 'Not provided') => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-on-surface-variant italic">{placeholder}</span>;
    }
    return value;
  };

  return (
    <div className="bg-white rounded-2xl border border-outline-variant/20 p-8 shadow-sm">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-headline font-bold text-3xl text-on-surface">
          Personal Information
        </h2>
        <button
          onClick={onEdit}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-semibold text-base hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Edit profile information"
        >
          <Icon name="edit" size={20} aria-hidden="true" />
          Edit
        </button>
      </div>

      {/* Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Display Name */}
        <div>
          <label className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-2 block">
            Display Name
          </label>
          <p className="text-on-surface font-medium text-lg">
            {formatValue(profileData?.displayName)}
          </p>
        </div>

        {/* Username */}
        <div>
          <label className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-2 block">
            Username
          </label>
          <p className="text-on-surface font-medium text-lg">
            {formatValue(profileData?.username)}
          </p>
        </div>

        {/* Email (Read-only) */}
        <div>
          <label className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-2 block">
            Email
          </label>
          <p className="text-on-surface font-medium text-lg flex items-center gap-2">
            {formatValue(profileData?.email)}
            {profileData?.emailVerified && (
              <Icon 
                name="verified" 
                size={18} 
                className="text-primary" 
                variant="filled"
                aria-label="Email verified"
              />
            )}
          </p>
        </div>

        {/* Phone Number */}
        <div>
          <label className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-2 block">
            Phone Number
          </label>
          <p className="text-on-surface font-medium text-lg">
            {formatValue(profileData?.phoneNumber)}
          </p>
        </div>

        {/* Bio */}
        <div className="md:col-span-2">
          <label className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-2 block">
            Bio
          </label>
          <p className="text-on-surface font-medium text-lg leading-relaxed">
            {formatValue(profileData?.bio, 'No bio added yet')}
          </p>
        </div>
      </div>

      {/* Member Since */}
      {profileData?.createdAt && (
        <div className="mt-8 pt-8 border-t border-outline-variant/20">
          <div className="flex items-center gap-2 text-on-surface-variant text-base">
            <Icon name="calendar_today" size={18} aria-hidden="true" />
            <span>
              Member since {new Date(profileData.createdAt.toDate?.() || profileData.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      )}

      {/* Last Login */}
      {profileData?.lastLogin && (
        <div className="mt-3">
          <div className="flex items-center gap-2 text-on-surface-variant text-base">
            <Icon name="schedule" size={18} aria-hidden="true" />
            <span>
              Last login: {new Date(profileData.lastLogin.toDate?.() || profileData.lastLogin).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoSection;
