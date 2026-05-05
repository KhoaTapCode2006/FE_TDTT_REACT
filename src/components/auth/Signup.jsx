import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { validators, debounce, validateForm } from '../../utils/errorHandling.js';
import Icon from '../ui/Icon.jsx';

const Signup = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle, loginWithFacebook, loading, error, clearError, checkUsernameAvailability } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    acceptTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ strength: 0, checks: {} });
  const [usernameChecking, setUsernameChecking] = useState(false);



  /**
   * Handle input changes with real-time validation
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear previous errors
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
    
    // Clear global error when user starts typing
    if (error) {
      clearError();
    }
    
    // Special handling for password to show strength
    if (field === 'password') {
      const passwordValidation = validators.password(value);
      setPasswordStrength({
        strength: passwordValidation.strength,
        checks: passwordValidation.checks,
        strengthText: passwordValidation.strengthText
      });
    }
    
    // Debounced validation
    debouncedValidation(field, value);
  };

  /**
   * Debounced validation function
   */
  const debouncedValidation = debounce(async (field, value) => {
    let fieldError = null;
    
    switch (field) {
      case 'username':
        fieldError = validators.username(value);
        if (!fieldError && value && value.trim().length > 0) {
          // Check username availability
          setUsernameChecking(true);
          try {
            const isAvailable = await checkUsernameAvailability(value);
            if (!isAvailable) {
              fieldError = 'Username is already taken.';
            }
          } catch (error) {
            console.error('Username check failed:', error);
            // Don't show error during check, will be validated during registration
          } finally {
            setUsernameChecking(false);
          }
        }
        break;
      case 'email':
        fieldError = validators.email(value);
        break;
      case 'password':
        const passwordValidation = validators.password(value);
        fieldError = passwordValidation.error;
        break;
    }
    
    if (fieldError) {
      setFormErrors(prev => ({ ...prev, [field]: fieldError }));
    }
  }, 300);

  /**
   * Validate entire form
   */
  const validateEntireForm = () => {
    const rules = {
      username: validators.username,
      email: validators.email,
      password: (value) => validators.password(value).error,
      acceptTerms: (value) => value ? null : 'You must accept the terms and conditions.'
    };
    
    const validation = validateForm(formData, rules);
    setFormErrors(validation.errors);
    return validation.isValid;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEntireForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare registration data
      const registrationData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        acceptTerms: formData.acceptTerms
      };
      
      await register(registrationData);
      
      // Redirect to home page after successful registration
      navigate('/', { replace: true });
    } catch (error) {
      // Error is handled by the AuthContext
      console.error('Registration failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle Google signup
   */
  const handleGoogleSignup = async () => {
    try {
      await loginWithGoogle();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Google signup failed:', error);
    }
  };

  /**
   * Handle Facebook signup
   */
  const handleFacebookSignup = async () => {
    try {
      await loginWithFacebook();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Facebook signup failed:', error);
    }
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  /**
   * Get password strength color
   */
  const getPasswordStrengthColor = () => {
    switch (passwordStrength.strength) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-editorial p-8 border border-outline-variant/20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-headline font-bold text-2xl text-primary mb-2">
            Join Booking4LU
          </h1>
          <p className="text-sm text-on-surface-variant">
            Create your account to access exclusive travel deals and save your preferences
          </p>
        </div>

        {/* Social Signup Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 bg-white border border-outline-variant rounded-xl px-4 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>

          <button
            type="button"
            onClick={handleFacebookSignup}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 bg-[#1877F2] text-white rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#166FE5] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline-variant"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-on-surface-variant">Or create account with email</span>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Global Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <Icon name="error_outline" size={16} className="text-red-500 flex-none" />
              <p className="text-red-600 text-xs">{error}</p>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Username *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="john doe"
                required
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all bg-surface-container-low/40 ${
                  formErrors.username 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-outline-variant focus:border-primary'
                }`}
              />
              {usernameChecking && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {formErrors.username && (
              <p className="text-red-500 text-xs mt-1">{formErrors.username}</p>
            )}
            <p className="text-xs text-on-surface-variant/70 mt-1">
              Letters, numbers, underscores, and single spaces allowed
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="john@example.com"
              required
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all bg-surface-container-low/40 ${
                formErrors.email 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-outline-variant focus:border-primary'
              }`}
            />
            {formErrors.email && (
              <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full border rounded-xl px-3 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all bg-surface-container-low/40 ${
                  formErrors.password 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-outline-variant focus:border-primary'
                }`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
              >
                <Icon name={showPassword ? "visibility_off" : "visibility"} size={18} />
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-on-surface-variant">
                    {passwordStrength.strengthText}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center gap-1 ${passwordStrength.checks.length ? 'text-green-600' : 'text-gray-400'}`}>
                    <Icon name={passwordStrength.checks.length ? "check_circle" : "radio_button_unchecked"} size={12} />
                    8+ characters
                  </div>
                  <div className={`flex items-center gap-1 ${passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                    <Icon name={passwordStrength.checks.uppercase ? "check_circle" : "radio_button_unchecked"} size={12} />
                    Uppercase letter
                  </div>
                  <div className={`flex items-center gap-1 ${passwordStrength.checks.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                    <Icon name={passwordStrength.checks.lowercase ? "check_circle" : "radio_button_unchecked"} size={12} />
                    Lowercase letter
                  </div>
                  <div className={`flex items-center gap-1 ${passwordStrength.checks.number ? 'text-green-600' : 'text-gray-400'}`}>
                    <Icon name={passwordStrength.checks.number ? "check_circle" : "radio_button_unchecked"} size={12} />
                    Number
                  </div>
                </div>
              </div>
            )}
            
            {formErrors.password && (
              <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
            )}
          </div>



          {/* Terms and Conditions */}
          <div className="flex items-start gap-3 p-4 bg-surface-container-low/30 rounded-xl">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={formData.acceptTerms}
              onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
              className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary/30"
            />
            <label htmlFor="acceptTerms" className="text-sm text-on-surface-variant cursor-pointer">
              I agree to the{' '}
              <Link to="/terms" className="text-primary hover:text-primary-container font-semibold">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary hover:text-primary-container font-semibold">
                Privacy Policy
              </Link>
            </label>
          </div>
          {formErrors.acceptTerms && (
            <p className="text-red-500 text-xs">{formErrors.acceptTerms}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary-container transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>

          {/* Login Link */}
          <p className="text-center text-sm text-on-surface-variant mt-4">
            Already have an account?{' '}
            <Link
              to="/auth/login"
              className="font-semibold text-primary hover:text-primary-container transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;