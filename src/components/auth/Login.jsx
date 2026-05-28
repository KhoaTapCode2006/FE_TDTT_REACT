import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { validators, debounce } from '../../utils/errorHandling.js';
import Icon from '../ui/Icon.jsx';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, loading, error, clearError } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get redirect path from location state or default to home
  const redirectTo = location.state?.from?.pathname || '/';

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
    
    // Debounced validation
    debouncedValidation(field, value);
  };

  /**
   * Debounced validation function
   */
  const debouncedValidation = debounce((field, value) => {
    let fieldError = null;
    
    switch (field) {
      case 'email':
        fieldError = validators.email(value);
        break;
      case 'password':
        if (value && value.length < 6) {
          fieldError = 'Mật khẩu phải có ít nhất 6 ký tự';
        }
        break;
    }
    
    if (fieldError) {
      setFormErrors(prev => ({ ...prev, [field]: fieldError }));
    }
  }, 300);

  /**
   * Validate entire form
   */
  const validateForm = () => {
    const errors = {};
    
    const emailError = validators.email(formData.email);
    if (emailError) errors.email = emailError;
    
    if (!formData.password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await login(formData.email, formData.password, rememberMe);
      
      // Redirect to intended destination
      navigate(redirectTo, { replace: true });
    } catch (error) {
      // Error is handled by the AuthContext
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle Google login
   */
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate(redirectTo, { replace: true });
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };



  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const isLoading = loading || isSubmitting;

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="bg-white rounded-2xl shadow-editorial p-10 border border-outline-variant/20">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-headline font-bold text-3xl text-primary mb-3">
            Chào mừng trở lại
          </h1>
          <p className="text-base text-on-surface-variant">
            Vui lòng nhập thông tin để truy cập tài khoản
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-4 mb-8">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-outline-variant rounded-xl px-6 py-4 text-base font-semibold text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Tiếp tục với Google
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline-variant"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-on-surface-variant">Hoặc tiếp tục bằng email</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Global Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <Icon name="error_outline" size={18} className="text-red-500 flex-none" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-2">
              Địa chỉ email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="nguyen.van.a@example.com"
              required
              className={`w-full border rounded-xl px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all bg-surface-container-low/50 ${
                formErrors.email 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-outline-variant focus:border-primary'
              }`}
            />
            {formErrors.email && (
              <p className="text-red-500 text-sm mt-1.5">{formErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-2">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full border rounded-xl px-5 py-4 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all bg-surface-container-low/50 ${
                  formErrors.password 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-outline-variant focus:border-primary'
                }`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
              >
                <Icon name={showPassword ? "visibility_off" : "visibility"} size={20} />
              </button>
            </div>
            {formErrors.password && (
              <p className="text-red-500 text-sm mt-1.5">{formErrors.password}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-outline-variant text-primary focus:ring-primary/30 w-4 h-4"
              />
              <span className="text-base text-on-surface-variant">Ghi nhớ đăng nhập</span>
            </label>
            <Link
              to="/auth/forgot-password"
              className="text-base font-semibold text-secondary hover:text-secondary/80 transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base hover:bg-primary-container transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-8 flex items-center justify-center gap-2"
          >
            {isLoading && (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-base text-on-surface-variant mt-6">
            Chưa có tài khoản?{' '}
            <Link
              to="/auth/signup"
              className="font-semibold text-primary hover:text-primary-container transition-colors"
            >
              Đăng ký tại đây
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
export default Login;