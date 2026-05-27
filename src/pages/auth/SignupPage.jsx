import React from 'react';
import { Link } from 'react-router-dom';
import Signup from '../../components/auth/Signup.jsx';
import { RequireGuest } from '../../components/auth/ProtectedRoute.jsx';

const SignupPage = () => {
  return (
    <RequireGuest>
      <div className="min-h-screen flex">
        {/* Left side - Hero Image */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-tertiary/80 via-tertiary/60 to-tertiary/40"></div>
          </div>
          
          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <div className="max-w-md">
              <h1 className="font-headline font-extrabold text-4xl xl:text-5xl leading-tight mb-6">
                Join the<br />
                <span className="text-secondary-container">Premium</span><br />
                Experience.
              </h1>
              <p className="text-white/90 text-lg leading-relaxed mb-8">
                Create your account and unlock exclusive travel deals, personalized recommendations, and seamless booking experiences.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                  <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center flex-none">
                    <span className="material-symbols-outlined text-primary text-sm">savings</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">Exclusive Deals</p>
                    <p className="text-white/80 text-xs">Member-only discounts up to 30%</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                  <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center flex-none">
                    <span className="material-symbols-outlined text-primary text-sm">favorite</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">Personalized</p>
                    <p className="text-white/80 text-xs">Tailored recommendations just for you</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                  <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center flex-none">
                    <span className="material-symbols-outlined text-primary text-sm">support_agent</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">24/7 Support</p>
                    <p className="text-white/80 text-xs">Premium customer service</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Signup Form (Half Screen) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-2xl">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <Link to="/" className="inline-block">
                <h1 className="font-headline font-extrabold text-2xl text-primary">
                  Booking4LU
                </h1>
              </Link>
            </div>

            <Signup />
          </div>
        </div>
      </div>
    </RequireGuest>
  );
};

export default SignupPage;