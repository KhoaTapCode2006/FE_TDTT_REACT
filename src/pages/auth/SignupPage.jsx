import React from 'react';
import { Link } from 'react-router-dom';
import Signup from '../../components/auth/Signup.jsx';
import { RequireGuest } from '../../components/auth/ProtectedRoute.jsx';

const SignupPage = () => {
  return (
    <div className="flex flex-col ">
      <div className="min-h-[86vh] flex flex-1">
        {/* Left side - Hero Image */}
        <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-tertiary/80 via-tertiary/60 to-tertiary/40"></div>
          </div>
          
          <div className="relative z-10 flex flex-col justify-center items-center px-12 text-white text-center">
            <div className="max-w-md mx-auto">
              <h1 className="font-headline font-extrabold text-4xl xl:text-5xl leading-tight mb-6">
                Bắt đầu hành trình du lịch đẳng cấp.
              </h1>
              <p className="text-white/90 text-lg leading-relaxed mb-8">
                Tạo tài khoản ngay để nhận ưu đãi độc quyền, đề xuất chuyến đi cá nhân hóa và trải nghiệm đặt phòng mượt mà.
              </p>
              
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                  <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center flex-none">
                    <span className="material-symbols-outlined text-primary text-sm">savings</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">Ưu đãi đặc biệt</p>
                    <p className="text-white/80 text-xs">Giảm giá thành viên lên đến 30%</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                  <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center flex-none">
                    <span className="material-symbols-outlined text-primary text-sm">favorite</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">Đề xuất cá nhân</p>
                    <p className="text-white/80 text-xs">Gợi ý hành trình phù hợp với bạn</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                  <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center flex-none">
                    <span className="material-symbols-outlined text-primary text-sm">support_agent</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">Hỗ trợ tận tâm</p>
                    <p className="text-white/80 text-xs">Dịch vụ khách hàng 24/7</p>
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
    </div>
  );
};

export default SignupPage;