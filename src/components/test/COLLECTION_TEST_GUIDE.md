# 🧪 Collection Service Test Component - Hướng dẫn sử dụng

## 📍 Truy cập Test Component

Sau khi khởi động app, truy cập URL:

```
http://localhost:5173/test/collection
```

## 🎯 Chức năng của Component

Component `CollectionTest.jsx` cung cấp giao diện đơn giản để test Collection Service API với các chức năng:

### 1️⃣ Create Collection
- **Chức năng**: Tạo một collection mới với dữ liệu mẫu
- **Dữ liệu mẫu**:
  - Name: "Test Collection [timestamp]"
  - Description: "This is a test collection created from UI"
  - Tags: ['test', 'demo', 'ui-test']
  - Visibility: 'public'
  - Thumbnail: placeholder image
- **Kết quả**: Hiển thị Collection ID vừa tạo

### 2️⃣ Get Collection
- **Chức năng**: Lấy thông tin chi tiết của collection vừa tạo
- **Yêu cầu**: Phải tạo collection trước (bước 1)
- **Hiển thị**:
  - Basic Info (name, description, visibility, owner, dates)
  - Tags list
  - Places list (với place_id, added_by, added_at)
  - Collaborators list
  - Savers list
  - Raw JSON data

### 3️⃣ Add Places
- **Chức năng**: Thêm 3 places mẫu vào collection
- **Places mẫu**: ['place_001', 'place_002', 'place_003']
- **Yêu cầu**: Phải tạo collection trước
- **Kết quả**: Collection được cập nhật với places mới

### 🔄 Reset
- **Chức năng**: Reset tất cả state, bắt đầu lại từ đầu

## 📊 Thông tin hiển thị

Component hiển thị đầy đủ thông tin collection:

### Basic Info
- Name
- Description
- Visibility (public/unlisted/private)
- Owner UID
- Saved Count
- Created At (Date)
- Updated At (Date)

### Tags
- Hiển thị dạng badges màu xanh
- Số lượng tags

### Places
- Place ID
- Added by (user UID)
- Added at (Date)
- Hiển thị dạng list items

### Collaborators
- User UID
- Contribution count
- Joined at (Date)

### Savers
- User UID
- Saved at (Date)

### Raw JSON
- Xem toàn bộ response data dạng JSON
- Có thể expand/collapse

## 🎨 Giao diện

Component sử dụng inline styles đơn giản với:
- Container màu xám nhạt (#f5f5f5)
- Buttons màu xanh (#007bff)
- Success messages màu xanh lá
- Error messages màu đỏ
- Loading indicator màu vàng
- Data sections với background trắng

## ⚠️ Error Handling

Component hiển thị các loại errors:

### VALIDATION_ERROR
```
❌ Error: Name must be between 3 and 32 characters (Code: VALIDATION_ERROR)
```

### AUTH_ERROR
```
❌ Error: User not authenticated (Code: AUTH_ERROR)
```

### NETWORK_ERROR
```
❌ Error: Network error - please check your connection (Code: NETWORK_ERROR)
```

### SERVER_ERROR
```
❌ Error: Collection not found (Code: SERVER_ERROR)
```

## 🔍 Console Logs

Component tự động log các thông tin quan trọng vào console:
- Created collection data
- Fetched collection data
- Updated collection data
- Error details

Mở DevTools Console để xem chi tiết.

## 📝 Workflow Test

### Test Flow 1: Create → Get
1. Click "Create Collection"
2. Đợi success message
3. Click "Get Collection"
4. Xem data hiển thị

### Test Flow 2: Create → Add Places → Get
1. Click "Create Collection"
2. Click "Add Places"
3. Click "Get Collection"
4. Xem places list (3 items)

### Test Flow 3: Multiple Creates
1. Click "Create Collection"
2. Click "Reset"
3. Click "Create Collection" lại
4. Mỗi lần tạo sẽ có timestamp khác nhau

## 🐛 Troubleshooting

### Lỗi: "User not authenticated"
**Giải pháp**: 
- Login vào app trước
- Kiểm tra Firebase Auth status
- Refresh page và login lại

### Lỗi: "Network error"
**Giải pháp**:
- Kiểm tra backend có đang chạy không
- Kiểm tra URL: `http://api.haubaka.xyz`
- Kiểm tra CORS settings trên backend
- Xem Network tab trong DevTools

### Lỗi: "Collection not found"
**Giải pháp**:
- Collection ID có thể đã bị xóa
- Click "Reset" và tạo collection mới
- Kiểm tra backend database

### Button bị disabled
**Nguyên nhân**:
- "Get Collection" và "Add Places" cần collection ID
- Phải click "Create Collection" trước
- Đang loading (đợi request hoàn thành)

## 🔧 Technical Details

### API Endpoint
```
Base URL: http://api.haubaka.xyz/api/v1
```

### Endpoints được test:
- `POST /collections` - Create collection
- `GET /collections/:id` - Get collection
- `POST /collections/:id/places` - Add places

### Authentication
- Tự động lấy Firebase Auth token
- Thêm vào header: `Authorization: Bearer <token>`

### Response Format
```json
{
  "status_code": 200,
  "message": "Success",
  "data": {
    "collection": {
      "id": "col_123",
      "name": "Test Collection",
      ...
    }
  }
}
```

## 📦 Files

- `CollectionTest.jsx` - Main test component
- `COLLECTION_TEST_GUIDE.md` - This guide
- `../../services/backend/collection.service.js` - Service implementation

## 🚀 Next Steps

Sau khi test thành công với component này, bạn có thể:

1. Test các API methods khác:
   - updateCollection
   - deleteCollection
   - removePlacesFromCollection
   - addCollaboratorsToCollection
   - removeCollaboratorsFromCollection
   - addTagsToCollection
   - removeTagsFromCollection

2. Tích hợp vào UI thật:
   - Import `collectionService` vào components
   - Sử dụng các methods đã test
   - Xử lý errors theo patterns đã thấy

3. Thêm features:
   - Upload thumbnail images
   - Search collections
   - Filter by tags
   - Share collections

## 📞 Support

Nếu gặp vấn đề:
1. Check console logs
2. Check Network tab trong DevTools
3. Check backend logs
4. Verify Firebase Auth status
5. Verify `.env` configuration

---

**Happy Testing! 🎉**
