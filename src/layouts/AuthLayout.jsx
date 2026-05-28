import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { AuthBoundary } from '../components/auth/ProtectedRoute.jsx';
import Header from '../components/layout/Header.jsx';
import Footer from '../components/layout/Footer.jsx';
const AuthLayout = () => {
  return (
    <AuthBoundary>
      <div className="min-h-screen bg-background">
        {/* Reuse Header component with navigation hidden */}
        <Header hideNavigation={true} />

        {/* Main Content */}
        <main className="">
          <Outlet />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </AuthBoundary>
  );
};

export default AuthLayout;