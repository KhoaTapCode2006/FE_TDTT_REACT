import React from 'react';
import { Link } from 'react-router-dom';
import ForgotPassword from '../../components/auth/ForgotPassword.jsx';
import { RequireGuest } from '../../components/auth/ProtectedRoute.jsx';

const ForgotPasswordPage = () => {
  return (
    <RequireGuest>
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <h1 className="font-headline font-extrabold text-2xl text-primary">
                Booking4LU
              </h1>
            </Link>
          </div>

          <ForgotPassword />
        </div>
      </div>
    </RequireGuest>
  );
};

export default ForgotPasswordPage;