# Notification API Integration Summary

## Overview
Updated the `NotificationDropdown` component to perform real API calls to the FastAPI backend instead of using placeholder/dummy handlers.

## Changes Made

### 1. Created Notification Service (`src/services/backend/notification.service.js`)

A new service module following the existing project patterns with:

- **Axios client configuration** with automatic Firebase authentication token injection
- **Error handling** with proper error transformation and user-friendly messages
- **Two main API methods**:
  - `markAsRead(notificationId)` - Mark notification as read
  - `updateInvitation(invitationId, status)` - Accept or reject invitations

**Key Features:**
- Uses Firebase auth to get current user token automatically
- Follows the same pattern as `collection.service.js`
- Proper error handling with status code mapping
- Timeout configuration (10 seconds)
- Base URL from environment variable: `VITE_LOCAL_API` (defaults to `http://localhost:8000`)

### 2. Updated NotificationDropdown Component (`src/components/ui/NotificationDropdown.jsx`)

Replaced all placeholder handlers with real API implementations:

#### `handleMarkAsRead(notificationId)`
- **Endpoint**: `PATCH /users/me/notifications/{notificationId}`
- **Body**: `{ "read": true }`
- **Headers**: Automatic `Authorization: Bearer {token}` via interceptor
- **Success**: Calls `onNotificationUpdate()` to refresh notifications
- **Error Handling**: 
  - 404: "Thông báo không tồn tại."
  - 403: "Bạn không có quyền thực hiện thao tác này."
  - Network: "Không thể kết nối. Vui lòng thử lại."
  - Default: "Không thể đánh dấu đã đọc. Vui lòng thử lại."

#### `handleAcceptInvite(invitationId, notificationId)`
- **Step 1**: `PATCH /invitations/{invitationId}` with `{ "status": "accepted" }`
- **Step 2**: `PATCH /users/me/notifications/{notificationId}` with `{ "read": true }`
- **Step 3**: Show success alert: "Đã chấp nhận lời mời thành công!"
- **Step 4**: Call `onNotificationUpdate()` to refresh
- **Error Handling**:
  - 404: "Lời mời không tồn tại hoặc đã hết hạn."
  - 403: "Bạn không có quyền chấp nhận lời mời này."
  - 400: Shows backend error message or "Lời mời không hợp lệ."
  - Network: "Không thể kết nối. Vui lòng thử lại."
  - Default: "Không thể chấp nhận lời mời. Vui lòng thử lại."

#### `handleRejectInvite(invitationId, notificationId)`
- **Confirmation**: Shows confirm dialog before proceeding
- **Step 1**: `PATCH /invitations/{invitationId}` with `{ "status": "declined" }`
- **Step 2**: `PATCH /users/me/notifications/{notificationId}` with `{ "read": true }`
- **Step 3**: Show success alert: "Đã từ chối lời mời"
- **Step 4**: Call `onNotificationUpdate()` to refresh
- **Error Handling**: Same as accept invite

## API Endpoints Used

| Method | Endpoint | Body | Purpose |
|--------|----------|------|---------|
| PATCH | `/users/me/notifications/{id}` | `{ "read": true }` | Mark notification as read |
| PATCH | `/invitations/{id}` | `{ "status": "accepted" }` | Accept invitation |
| PATCH | `/invitations/{id}` | `{ "status": "declined" }` | Reject invitation |

## Authentication

All API calls automatically include the Firebase authentication token via axios interceptor:
```javascript
Authorization: Bearer {firebase_id_token}
```

The token is obtained from `auth.currentUser.getIdToken()` before each request.

## Error Handling Strategy

1. **Try-catch blocks** wrap all async operations
2. **Loading state management** prevents double-clicks during requests
3. **User-friendly error messages** based on HTTP status codes
4. **Fallback messages** for unexpected errors
5. **Network error detection** for connectivity issues

## Testing Checklist

- [ ] Mark notification as read (non-invitation)
- [ ] Accept invitation notification
- [ ] Reject invitation notification
- [ ] Handle 404 errors (notification/invitation not found)
- [ ] Handle 403 errors (permission denied)
- [ ] Handle 400 errors (invalid request)
- [ ] Handle network errors (offline/timeout)
- [ ] Verify Firebase token is sent in Authorization header
- [ ] Verify notifications refresh after actions
- [ ] Verify loading states prevent double-clicks

## Environment Configuration

Ensure your `.env` file has the correct API base URL:

```env
VITE_LOCAL_API=http://localhost:8000
```

## Dependencies

- `axios` - HTTP client (already in project)
- `@/config/firebase` - Firebase auth instance (already in project)
- `@/services/backend/notification.service` - New service module

## Notes

- Dummy notifications are still displayed when no real notifications exist (for development/testing)
- The component maintains backward compatibility with the Firebase Firestore realtime listener
- All API calls are asynchronous and non-blocking
- The `onNotificationUpdate` callback triggers Firestore to sync automatically
- Error messages are in Vietnamese to match the UI language

## Future Improvements

Consider implementing:
1. Toast notifications instead of alerts for better UX
2. Retry logic for failed requests
3. Optimistic UI updates before API confirmation
4. Batch operations for marking multiple notifications as read
5. Loading skeleton states instead of disabled buttons
