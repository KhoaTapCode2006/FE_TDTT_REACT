import React from 'react';
import Login from '../../components/auth/Login.jsx';
const LoginPage = () => {
  return (
      <div className="flex flex-col ">
        <div className="flex-1 flex max-h-[86vh]">
          {/* Left side - Hero Image */}
          <div className="hidden lg:flex lg:w-2/3 relative">
          <div 
            className="absolute inset-0 bg-cover bg-cente "
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80)'
            }}
          >
            <div className="absolute inset-0 bg-linear-to-r from-primary/80 via-primary/60 to-primary/40"></div>
          </div>
          
          <div className="relative z-10 flex flex-col items-center justify-center px-12 text-white ">
            <div className="w-full max-w-5xl ">
              <h1 className="font-headline font-extrabold text-6xl text-center xl:text-6xl leading-tight mb-6 whitespace-nowrap overflow-visible">
                Nghệ thuật <span className="text-secondary-container">Du lịch</span> Đẳng cấp.
              </h1>
              <p className="text-white/90 mx-26 text-lg leading-relaxed mb-8">
                Chào mừng đến với Lodgy4U. Dù bạn quay lại để khám phá hay gia nhập cộng đồng của chúng tôi, chúng tôi luôn hoan nghênh với sự sang trọng và sự tinh tế bậc nhất.
              </p>
              
              <div className="flex justify-center">
                <div className="inline-flex items-center justify-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-none">
                    <span className="material-symbols-outlined text-primary text-lg">verified</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-center">Tiêu chuẩn xác thực</p>
                    <p className="text-white/80 text-xs">Mỗi điểm nghỉ dưỡng được chọn lọc hoàn hảo.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form (Half Screen) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
          <div className="w-full px-8">
            <Login />
          </div>
        </div>
       </div>
      </div>
  );
};

export default LoginPage;