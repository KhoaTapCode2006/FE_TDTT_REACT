# Image Upload Refactor Summary

## Overview
Replaced the manual URL input for collection thumbnails with a modern drag-and-drop file upload system that integrates with the backend API.

## Changes Made

### 1. New Upload Service (`src/services/backend/upload.service.js`)
- **Purpose**: Handles file uploads to Cloudflare R2 via presigned URLs
- **Features**:
  - Three-step upload process (presign → upload to R2 → confirm)
  - File validation (type and size)
  - Authentication via Firebase tokens
  - Comprehensive error handling
  - Support for multiple categories (avatar, collection_cover, generic)

**API Flow**:
1. POST `/uploads/presign` - Get presigned URL and file key
2. PUT to presigned URL - Upload file directly to R2
3. POST `/uploads/confirm` - Confirm upload and get public URL

### 2. New ImageUpload Component (`src/components/ui/ImageUpload.jsx`)
- **Purpose**: Reusable drag-and-drop file upload UI component
- **Features**:
  - Drag and drop support
  - Click to select file
  - Loading state with spinner
  - Current image preview
  - File validation (type: JPEG, PNG, WebP, GIF; size: max 10MB)
  - Error handling with user-friendly messages
  - Disabled state support

**Props**:
- `onUpload(publicUrl)` - Callback when upload succeeds
- `onError(errorMessage)` - Callback when upload fails
- `disabled` - Whether upload is disabled
- `currentImageUrl` - Current image URL to display
- `category` - Upload category for backend

### 3. Updated CollectionPage Components
Updated both:
- `src/pages/collection/CollectionPage.jsx`
- `src/pages/CollectionPage.jsx`

**Changes**:
- Removed manual URL text input
- Added ImageUpload component import
- Replaced thumbnail input with ImageUpload component
- Added success/error toast notifications for uploads
- Added image preview for non-editing mode
- Improved UX with visual feedback

## User Experience Improvements

### Before
- Manual URL input (error-prone)
- No validation
- No preview
- Required external image hosting

### After
- Drag and drop or click to upload
- Automatic file validation
- Real-time upload progress
- Immediate preview
- Direct integration with backend storage
- User-friendly error messages

## Technical Details

### File Validation
- **Allowed types**: JPEG, PNG, WebP, GIF
- **Max size**: 10MB
- **Validation**: Client-side (immediate feedback) + Server-side (security)

### Error Handling
- Authentication errors
- Network errors
- File validation errors
- Upload failures
- All errors display user-friendly messages via toast notifications

### Security
- Authentication required (Firebase JWT)
- File type validation
- File size limits
- Presigned URLs (time-limited, secure)

## Testing Recommendations

1. **Upload Flow**:
   - Test drag and drop
   - Test click to select
   - Test with various image formats
   - Test with oversized files
   - Test with invalid file types

2. **Error Scenarios**:
   - Test without authentication
   - Test with network disconnected
   - Test with invalid files
   - Test backend errors

3. **UI States**:
   - Test loading state
   - Test disabled state
   - Test preview display
   - Test edit/view mode transitions

4. **Integration**:
   - Test creating new collection with image
   - Test updating existing collection image
   - Test image persistence after save

## API Requirements

The backend must implement these endpoints:

1. **POST /uploads/presign**
   - Headers: `Authorization: Bearer <token>`
   - Body: `{ filename, content_type, file_size, category }`
   - Response: `{ data: { upload_url, file_key } }`

2. **POST /uploads/confirm**
   - Headers: `Authorization: Bearer <token>`
   - Body: `{ file_key, file_size }`
   - Response: `{ data: { public_url } }`

## Environment Variables

Ensure `VITE_LOCAL_API` is set in `.env`:
```
VITE_LOCAL_API=http://localhost:8000
```

## Migration Notes

- Existing collections with thumbnail URLs will continue to work
- No database migration needed
- Old URL input completely removed
- Users can now upload images directly instead of providing URLs

## Future Enhancements

Potential improvements:
- Image cropping/editing before upload
- Multiple image upload
- Progress bar for large files
- Image optimization/compression
- Thumbnail generation
- Support for more file types (videos, documents)
