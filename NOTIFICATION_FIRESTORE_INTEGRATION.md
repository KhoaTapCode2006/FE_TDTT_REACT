# Notification Firestore Integration - Complete Update

## Overview
Updated `NotificationDropdown.jsx` to match the exact Firestore data structure from the backend and implement dynamic content generation based on notification type.

## Firestore Data Structure

### Notification Document Schema
```javascript
{
  id: "xohu3nYkyyuULzKoTrky",        // Firebase document ID
  ref_id: "OqRBlQ...",                // Backend invitation ID
  sender_uid: "nGUVEXtQgq...",        // User who sent the invitation
  target_uid: "IcxW7IPTXf...",        // User who received (matches currentUserId)
  type: "collection",                  // Notification type
  status: "pending",                   // 'pending', 'accepted', 'declined'
  read: false,                         // Read status
  created_at: "May 20, 2026..."       // Firebase timestamp
}
```

**Key Changes from Previous Structure:**
- ❌ Removed: `content` field (now generated dynamically)
- ❌ Removed: `actor_id` (replaced with `sender_uid`)
- ❌ Removed: `receiver_id` (replaced with `target_uid`)
- ❌ Removed: `send_at` (replaced with `created_at`)
- ✅ Added: `status` field for invitation state
- ✅ Added: `type` field for notification categorization

## Dynamic Content Generation

### Implementation
The component now generates notification content dynamically based on `type` and `sender_uid`:

```javascript
const generateNotificationContent = (notification) => {
  const isSelf = notification.sender_uid === user?.uid;
  
  switch (notification.type) {
    case 'collection':
      if (isSelf) {
        return 'Bạn đã gửi một lời mời tham gia bộ sưu tập.';
      }
      return 'Bạn nhận được một lời mời tham gia bộ sưu tập.';
    
    default:
      return 'Bạn có một thông báo mới.';
  }
};
```

### Content Rules
| Type | Condition | Vietnamese Text | English Translation |
|------|-----------|----------------|---------------------|
| `collection` | `sender_uid === currentUserId` | "Bạn đã gửi một lời mời tham gia bộ sưu tập." | "You sent an invitation to join a collection." |
| `collection` | `sender_uid !== currentUserId` | "Bạn nhận được một lời mời tham gia bộ sưu tập." | "You received an invitation to join a collection." |
| `default` | Any | "Bạn có một thông báo mới." | "You have a new notification." |

## Conditional Action Buttons

### Display Logic
Action buttons (Accept/Decline) are only shown when:
1. ✅ `status === 'pending'`
2. ✅ `sender_uid !== currentUserId` (user is not the sender)

```javascript
const shouldShowActions = (notification) => {
  return (
    notification.status === 'pending' &&
    notification.sender_uid !== user?.uid
  );
};
```

### Button States
| Status | Sender | Show Actions | Show "Mark as Read" |
|--------|--------|--------------|---------------------|
| `pending` | Other user | ✅ Yes | ❌ No |
| `pending` | Self | ❌ No | ✅ Yes (if unread) |
| `accepted` | Any | ❌ No | ✅ Yes (if unread) |
| `declined` | Any | ❌ No | ✅ Yes (if unread) |

## API Integration

### Base URL
```javascript
const API_BASE_URL = 'https://api.haubaka.xyz';
```

### Authentication
All requests use token from localStorage:
```javascript
const token = localStorage.getItem('token');
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}
```

### API Endpoints

#### 1. Mark Notification as Read
```javascript
PATCH https://api.haubaka.xyz/users/me/notifications/{notificationId}
Body: { "read": true }
```

**Handler:** `handleMarkAsRead(notificationId)`
- Marks notification as read
- Triggers `onNotificationUpdate()` callback
- Shows error alerts for failures

#### 2. Accept Invitation
```javascript
PATCH https://api.haubaka.xyz/invitations/{ref_id}
Body: { "status": "accepted" }
```

**Handler:** `handleAcceptInvite(refId, notificationId)`
- Step 1: Accept invitation via API
- Step 2: Mark notification as read
- Step 3: Show success alert
- Step 4: Trigger callback to refresh

#### 3. Decline Invitation
```javascript
PATCH https://api.haubaka.xyz/invitations/{ref_id}
Body: { "status": "declined" }  // MUST BE 'declined', NOT 'rejected'
```

**Handler:** `handleRejectInvite(refId, notificationId)`
- Shows confirmation dialog first
- Step 1: Decline invitation via API (status: 'declined')
- Step 2: Mark notification as read
- Step 3: Show success alert
- Step 4: Trigger callback to refresh

**⚠️ CRITICAL:** Use `"declined"` not `"rejected"` to prevent 422 validation errors!

## Error Handling

### Error Detection
```javascript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  throw new Error(errorData.message || `HTTP ${response.status}`);
}
```

### Error Messages

| Error Type | Condition | Vietnamese Message | English Translation |
|------------|-----------|-------------------|---------------------|
| 404 | Not found | "Lời mời không tồn tại hoặc đã hết hạn." | "Invitation does not exist or has expired." |
| 403 | Forbidden | "Bạn không có quyền thực hiện thao tác này." | "You don't have permission for this action." |
| 400/422 | Bad request | Backend message or "Lời mời không hợp lệ." | Backend message or "Invalid invitation." |
| Auth | No token | "Vui lòng đăng nhập lại." | "Please log in again." |
| Default | Other | "Không thể [action]. Vui lòng thử lại." | "Cannot [action]. Please try again." |

## Loading States

### Processing Management
```javascript
const [processingIds, setProcessingIds] = useState(new Set());
```

- Prevents double-clicks during API calls
- Disables buttons while processing
- Shows loading spinner in button
- Applies opacity to entire notification item

### Visual Feedback
```javascript
{processing ? (
  <>
    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
    <span>Đang xử lý...</span>
  </>
) : (
  <>
    <Icon name="check" size={16} />
    <span>Chấp nhận</span>
  </>
)}
```

## Icon Mapping

| Type | Icon Name | Color | Background |
|------|-----------|-------|------------|
| `collection` | `collections_bookmark` | `text-blue-600` | `bg-blue-100` |
| `trip` | `flight` | `text-purple-600` | `bg-purple-100` |
| `default` | `notifications` | `text-gray-600` | `bg-gray-100` |

## Testing Checklist

### Functional Tests
- [ ] Dynamic content generation for `collection` type
- [ ] Self-sent notifications show correct text
- [ ] Received notifications show correct text
- [ ] Action buttons only show for pending + non-self notifications
- [ ] Accept invitation works correctly
- [ ] Decline invitation works correctly (uses 'declined' status)
- [ ] Mark as read works for non-actionable notifications
- [ ] Confirmation dialog shows before declining

### Error Handling Tests
- [ ] 404 error shows correct message
- [ ] 403 error shows correct message
- [ ] 400/422 error shows backend message
- [ ] Missing token shows login prompt
- [ ] Network errors handled gracefully

### UI/UX Tests
- [ ] Loading spinner shows during API calls
- [ ] Buttons disabled during processing
- [ ] Double-click prevention works
- [ ] Unread badge updates after marking as read
- [ ] Notifications refresh after actions
- [ ] Relative time displays correctly

### Data Structure Tests
- [ ] Handles `ref_id` correctly (not `invitation_id`)
- [ ] Uses `sender_uid` (not `actor_id`)
- [ ] Uses `target_uid` (not `receiver_id`)
- [ ] Uses `created_at` (not `send_at`)
- [ ] Respects `status` field for action visibility

## Migration Notes

### Breaking Changes
1. **Field Name Changes:**
   - `actor_id` → `sender_uid`
   - `receiver_id` → `target_uid`
   - `send_at` → `created_at`
   - `content` → Dynamically generated

2. **Status Values:**
   - ✅ Use: `'declined'`
   - ❌ Don't use: `'rejected'`

3. **Action Button Logic:**
   - Now checks both `status` and `sender_uid`
   - Previously only checked `type`

### Backward Compatibility
- Dummy notifications updated to match new structure
- Falls back to dummy data when no real notifications exist
- Gracefully handles missing fields

## Dependencies

- `@/contexts/AuthContext` - For current user UID
- `@/components/ui/Icon` - For icon rendering
- `localStorage` - For auth token storage
- Native `fetch` API - For HTTP requests

## Future Enhancements

Consider implementing:
1. Toast notifications instead of alerts
2. Retry logic for failed requests
3. Optimistic UI updates
4. Batch mark as read
5. Notification grouping by type
6. Rich notification content with user avatars
7. Deep linking to referenced collections
8. Push notification support
9. Notification preferences/settings
10. Archive/delete notifications
