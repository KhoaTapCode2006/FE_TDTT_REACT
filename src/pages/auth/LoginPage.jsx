import React from 'react';
import { Link } from 'react-router-dom';
import Login from '../../components/auth/Login.jsx';
import { RequireGuest } from '../../components/auth/ProtectedRoute.jsx';

const LoginPage = () => {
  return (
    <RequireGuest>
      <div className="min-h-screen flex">
        {/* Left side - Hero Image */}
        <div className="hidden lg:flex lg:w-2/3 relative">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/60 to-primary/40"></div>
          </div>
          
          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <div className="max-w-md pl-50">
              <h1 className="font-headline font-extrabold text-6xl xl:text-6xl leading-tight mb-6">
                The Art of<br />
                <span className="text-secondary-container">Exceptional</span><br />
                Travel.
              </h1>
              <p className="text-white/90 text-lg leading-relaxed mb-8">
                Welcome to Booking4U. Whether you're returning for another escape or joining our inner circle, luxury awaits.
              </p>
              
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-none">
                  <span className="material-symbols-outlined text-primary text-lg">verified</span>
                </div>
                <div>
                  <p className="font-bold text-sm">Verified Excellence</p>
                  <p className="text-white/80 text-xs">Every property curated for perfection.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form (Half Screen) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
          <div className="w-full px-8">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <Link to="/" className="inline-block">
                <h1 className="font-headline font-extrabold text-2xl text-primary">
                  Booking4LU
                </h1>
              </Link>
            </div>

            <Login />
          </div>
        </div>
      </div>
    </RequireGuest>
  );
};

export default LoginPage;