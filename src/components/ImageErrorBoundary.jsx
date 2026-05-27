import React from 'react';

/**
 * ImageErrorBoundary Component
 * Error boundary for handling image loading failures gracefully
 * Displays a placeholder icon when images fail to load
 * Only logs errors in development mode to prevent console spam
 */
class ImageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    // Log error silently without spamming console
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.warn('Image loading error:', error.message);
    }
  }
  
  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return this.props.fallback || (
        <div className="w-full h-full bg-surface-container flex items-center justify-center">
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className="text-outline"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      );
    }
    
    return this.props.children;
  }
}

export default ImageErrorBoundary;
