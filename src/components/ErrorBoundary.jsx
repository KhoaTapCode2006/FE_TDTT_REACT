import React from 'react';
import Icon from './ui/Icon';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 relative overflow-hidden h-full min-h-[640px] bg-gray-50">
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-50">
            <Icon name="error_outline" size={48} className="text-red-500 mb-4" />
            <h2 className="text-lg font-bold text-gray-700 mb-2">Map Error</h2>
            <p className="text-sm text-gray-600 mb-4 text-center max-w-md">
              There was an error loading the map. Please refresh the page to try again.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-container transition-colors"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 max-w-md">
                <summary className="text-xs text-gray-500 cursor-pointer">Error Details</summary>
                <pre className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded overflow-auto max-h-32">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;