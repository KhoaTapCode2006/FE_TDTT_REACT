# Firebase Setup Guide - Booking4LU

## ✅ Đã Hoàn Thành

1. ✅ Tạo file `.env` với Firebase configuration
2. ✅ Cập nhật Firebase config để Storage là optional
3. ✅ Cập nhật profile service để hoạt động mà không cần Storage
4. ✅ Cập nhật .gitignore để bảo vệ credentials

## 🔧 Các Bước Tiếp Theo

### 1. Cấu Hình Firestore Database Rules

Truy cập Firebase Console → Firestore Database → Rules và thêm rules sau:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Allow users to read their own profile
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Allow users to create their own profile during signup
      allow create: if request.auth != null && request.auth.uid == userId;
      
      // Allow users to update their own profile
      allow update: if request.auth != null && request.auth.uid == userId;
      
      // Prevent deletion
      allow delete: if false;
    }
    
    // Public read for username availability check
    match /users/{userId} {
      allow read: if request.auth != null;
    }
  }
}
```

**Lưu ý:** Rules trên cho phép:
- Người dùng đọc/tạo/cập nhật profile của chính họ
- Tất cả người dùng đã đăng nhập có thể kiểm tra username availability
- Không ai có thể xóa profile

### 2. Cấu Hình Authentication

Truy cập Firebase Console → Authentication → Sign-in method và enable:

1. **Email/Password** (Bắt buộc)
   - Click "Email/Password"
   - Enable
   - Save

2. **Google** (Tùy chọn)
   - Click "Google"
   - Enable
   - Chọn support email
   - Save

3. **Facebook** (Tùy chọn)
   - Click "Facebook"
   - Enable
   - Nhập App ID và App Secret từ Facebook Developers
   - Save

### 3. Khởi Động Lại Development Server

```bash
# Dừng server hiện tại (Ctrl+C)
# Khởi động lại
npm run dev
```

## 🎯 Tính Năng Hiện Tại

### ✅ Hoạt Động (Không Cần Storage)
- ✅ Đăng ký với email/password
- ✅ Đăng nhập với email/password
- ✅ Đăng nhập với Google OAuth
- ✅ Đăng nhập với Facebook OAuth
- ✅ Quên mật khẩu / Reset password
- ✅ Lưu user profile trong Firestore
- ✅ Avatar mặc định (SVG với initials)
- ✅ Session management với cookies
- ✅ Protected routes
- ✅ Username availability check

### ⚠️ Tạm Thời Vô Hiệu Hóa (Cần Storage)
- ⚠️ Upload custom avatar (cần upgrade plan để enable Storage)

## 🔍 Kiểm Tra Authentication

1. Mở browser console (F12)
2. Truy cập trang signup: `http://localhost:5173/auth/signup`
3. Điền form và submit
4. Kiểm tra console - không còn lỗi Firebase
5. Kiểm tra Firestore Console - user profile đã được tạo

## 🐛 Troubleshooting

### Lỗi: "Firebase permission denied"
**Giải pháp:** Cập nhật Firestore Rules như hướng dẫn ở trên

### Lỗi: "Email already in use"
**Giải pháp:** Email đã được đăng ký, thử email khác hoặc đăng nhập

### Lỗi: "Network error"
**Giải pháp:** 
- Kiểm tra internet connection
- Kiểm tra Firebase project có đang hoạt động không

### Avatar không hiển thị
**Giải pháp:** Avatar mặc định là SVG với initials, sẽ tự động tạo khi đăng ký

## 📝 Lưu Ý Quan Trọng

1. **File `.env` chứa credentials nhạy cảm** - Đã được thêm vào .gitignore
2. **Không commit file `firebase.env`** - Đã được thêm vào .gitignore
3. **Firestore Rules** - Cần cập nhật để authentication hoạt động
4. **Storage** - Không bắt buộc, chỉ cần khi muốn upload custom avatars

## 🚀 Nâng Cấp Sau Này

Khi cần enable Storage (upload custom avatars):
1. Upgrade lên Blaze Plan (Pay as you go)
2. Enable Storage trong Firebase Console
3. Tính năng upload avatar sẽ tự động hoạt động

## ✨ Tính Năng Đặc Biệt

- **Default Avatar**: Tự động tạo avatar SVG với initials và màu sắc dựa trên tên
- **Password Strength Indicator**: Hiển thị độ mạnh của mật khẩu real-time
- **Form Validation**: Validate tất cả fields với error messages rõ ràng
- **Remember Me**: Lưu session lâu dài hoặc session-only
- **Social Login**: Google và Facebook OAuth ready
