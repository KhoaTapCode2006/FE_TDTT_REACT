import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { validators } from '../../utils/errorHandling.js';
import Icon from '../ui/Icon.jsx';

const ForgotPassword = () => {
  const { resetPassword, error, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  /**
   * Handle email input change
   */
  const handleEmailChange = (value) => {
    setEmail(value);
    
    // Clear errors when user starts typing
    if (emailError) setEmailError('');
    if (error) clearError();
  };

  /**
   * Validate email
   */
  const validateEmail = () => {
    const emailValidation = validators.email(email);
    if (emailValidation) {
      setEmailError(emailValidation);
      return false;
    }
    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (error) {
      // Error is handled by the AuthContext
      console.error('Password reset failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-editorial p-8 border border-outline-variant/20">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="mark_email_read" size={32} className="text-green-600" />
            </div>
            
            <h1 className="font-headline font-bold text-2xl text-primary mb-2">
              Check your inbox
            </h1>
            
            <p className="text-on-surface-variant text-sm mb-6">
              We've sent a password reset link to <strong>{email}</strong>. 
              Please check your email and follow the instructions to reset your password.
            </p>
            
            <div className="space-y-3">
              <Link
                to="/auth/login"
                className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary-container transition-colors inline-block text-center"
              >
                Back to Sign In
              </Link>
              
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                className="w-full bg-surface-container text-on-surface py-3 rounded-xl font-semibold text-sm hover:bg-surface-container-high transition-colors"
              >
                Try Different Email
              </button>
            </div>
            
            <p className="text-xs text-on-surface-variant mt-6">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => {
                  setEmailSent(false);
                }}
                className="text-primary hover:text-primary-container font-semibold"
              >
                try again
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-editorial p-8 border border-outline-variant/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="lock_reset" size={32} className="text-primary" />
          </div>
          
          <h1 className="font-headline font-bold text-2xl text-primary mb-2">
            Reset your password
          </h1>
          
          <p className="text-sm text-on-surface-variant">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Global Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <Icon name="error_outline" size={16} className="text-red-500 flex-none" />
              <p className="text-red-600 text-xs">{error}</p>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="you@example.com"
              required
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all bg-surface-container-low/50 ${
                emailError 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-outline-variant focus:border-primary'
              }`}
            />
            {emailError && (
              <p className="text-red-500 text-xs mt-1">{emailError}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary-container transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>

          {/* Back to Login */}
          <div className="text-center">
            <Link
              to="/auth/login"
              className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              <Icon name="arrow_back" size={16} />
              Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;