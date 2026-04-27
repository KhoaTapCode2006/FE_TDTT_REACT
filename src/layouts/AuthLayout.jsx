import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { AuthBoundary } from '../components/auth/ProtectedRoute.jsx';
import Header from '../components/layout/Header.jsx';

const AuthLayout = () => {
  return (
    <AuthBoundary>
      <div className="min-h-screen bg-background">
        {/* Reuse Header component with navigation hidden */}
        <Header hideNavigation={true} />

        {/* Main Content */}
        <main className="pt-10">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-outline-variant/20 px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-headline font-bold text-primary text-base">Booking4LU</span>
            
            <div className="flex items-center gap-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              <Link to="/about" className="hover:text-primary transition-colors">About</Link>
              <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
              <Link to="/support" className="hover:text-primary transition-colors">Support</Link>
            </div>
            
            <span className="text-xs text-on-surface-variant">
              © 2024 Booking4U. Premium Travel Experience
            </span>
          </div>
        </footer>
      </div>
    </AuthBoundary>
  );
};

export default AuthLayout;