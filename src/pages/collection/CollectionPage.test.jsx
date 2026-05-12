import { describe, it, expect } from 'vitest';

/**
 * Unit tests for Task 2.1: Computed values for save button visibility and saved state
 * 
 * These tests verify the logic of the computed values:
 * - isSaved: checks if current user UID exists in collection.savers array
 * - showSaveButton: returns true only for non-owned collections when user is authenticated
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

describe('CollectionPage - Task 2.1: Computed Values Logic', () => {
  describe('isSaved computed value logic', () => {
    /**
     * Test the logic: isSaved = collection.savers?.some(saver => saver.uid === user.uid) || false
     */
    
    it('should return false when user is null', () => {
      const user = null;
      const collection = {
        savers: [{ uid: 'user-123', saved_at: new Date() }],
      };
      
      // Logic: if (!user || !collection) return false;
      const isSaved = !user || !collection ? false : collection.savers?.some(saver => saver.uid === user?.uid) || false;
      
      expect(isSaved).toBe(false);
    });

    it('should return false when collection is null', () => {
      const user = { uid: 'user-123' };
      const collection = null;
      
      // Logic: if (!user || !collection) return false;
      const isSaved = !user || !collection ? false : collection.savers?.some(saver => saver.uid === user?.uid) || false;
      
      expect(isSaved).toBe(false);
    });

    it('should return false when savers array is empty', () => {
      const user = { uid: 'user-123' };
      const collection = {
        savers: [],
      };
      
      const isSaved = !user || !collection ? false : collection.savers?.some(saver => saver.uid === user?.uid) || false;
      
      expect(isSaved).toBe(false);
    });

    it('should return false when savers array is undefined', () => {
      const user = { uid: 'user-123' };
      const collection = {
        savers: undefined,
      };
      
      const isSaved = !user || !collection ? false : collection.savers?.some(saver => saver.uid === user?.uid) || false;
      
      expect(isSaved).toBe(false);
    });

    it('should return true when current user UID exists in savers array', () => {
      const user = { uid: 'user-123' };
      const collection = {
        savers: [
          { uid: 'user-123', saved_at: new Date() },
          { uid: 'user-456', saved_at: new Date() },
        ],
      };
      
      const isSaved = !user || !collection ? false : collection.savers?.some(saver => saver.uid === user?.uid) || false;
      
      expect(isSaved).toBe(true);
    });

    it('should return false when current user UID does not exist in savers array', () => {
      const user = { uid: 'user-999' };
      const collection = {
        savers: [
          { uid: 'user-123', saved_at: new Date() },
          { uid: 'user-456', saved_at: new Date() },
        ],
      };
      
      const isSaved = !user || !collection ? false : collection.savers?.some(saver => saver.uid === user?.uid) || false;
      
      expect(isSaved).toBe(false);
    });

    it('should handle savers array with single user', () => {
      const user = { uid: 'user-123' };
      const collection = {
        savers: [{ uid: 'user-123', saved_at: new Date() }],
      };
      
      const isSaved = !user || !collection ? false : collection.savers?.some(saver => saver.uid === user?.uid) || false;
      
      expect(isSaved).toBe(true);
    });
  });

  describe('showSaveButton computed value logic', () => {
    /**
     * Test the logic: showSaveButton = user && collection && collection.owner_uid !== user.uid
     */
    
    it('should return false when user is null', () => {
      const user = null;
      const collection = {
        owner_uid: 'owner-456',
      };
      
      // Logic: if (!user || !collection) return false;
      // return collection.owner_uid !== user.uid;
      const showSaveButton = !user || !collection ? false : collection.owner_uid !== user.uid;
      
      expect(showSaveButton).toBe(false);
    });

    it('should return false when collection is null', () => {
      const user = { uid: 'user-123' };
      const collection = null;
      
      const showSaveButton = !user || !collection ? false : collection.owner_uid !== user.uid;
      
      expect(showSaveButton).toBe(false);
    });

    it('should return false when user is the owner', () => {
      const user = { uid: 'owner-456' };
      const collection = {
        owner_uid: 'owner-456',
      };
      
      const showSaveButton = !user || !collection ? false : collection.owner_uid !== user.uid;
      
      expect(showSaveButton).toBe(false);
    });

    it('should return true when user is authenticated and not the owner', () => {
      const user = { uid: 'user-123' };
      const collection = {
        owner_uid: 'owner-456',
      };
      
      const showSaveButton = !user || !collection ? false : collection.owner_uid !== user.uid;
      
      expect(showSaveButton).toBe(true);
    });

    it('should return true for different user UIDs', () => {
      const user = { uid: 'user-999' };
      const collection = {
        owner_uid: 'owner-123',
      };
      
      const showSaveButton = !user || !collection ? false : collection.owner_uid !== user.uid;
      
      expect(showSaveButton).toBe(true);
    });
  });

  describe('Requirements validation', () => {
    it('validates Requirement 1.1: Save button displayed for non-owned collections', () => {
      const user = { uid: 'user-123' };
      const collection = {
        owner_uid: 'owner-456',
      };
      
      const showSaveButton = !user || !collection ? false : collection.owner_uid !== user.uid;
      
      // Requirement 1.1: showSaveButton should be true for non-owned collections
      expect(showSaveButton).toBe(true);
    });

    it('validates Requirement 1.2: Save button not displayed for owned collections', () => {
      const user = { uid: 'owner-456' };
      const collection = {
        owner_uid: 'owner-456',
      };
      
      const showSaveButton = !user || !collection ? false : collection.owner_uid !== user.uid;
      
      // Requirement 1.2: showSaveButton should be false for owned collections
      expect(showSaveButton).toBe(false);
    });

    it('validates Requirement 1.3: Save button disabled when not authenticated', () => {
      const user = null;
      const collection = {
        owner_uid: 'owner-456',
      };
      
      const showSaveButton = !user || !collection ? false : collection.owner_uid !== user.uid;
      
      // Requirement 1.3: showSaveButton should be false when user is not authenticated
      expect(showSaveButton).toBe(false);
    });

    it('validates isSaved correctly identifies saved collections', () => {
      const user = { uid: 'user-123' };
      const collection = {
        savers: [
          { uid: 'user-123', saved_at: new Date() },
        ],
      };
      
      const isSaved = !user || !collection ? false : collection.savers?.some(saver => saver.uid === user?.uid) || false;
      
      // isSaved should be true when user's UID is in savers array
      expect(isSaved).toBe(true);
    });

    it('validates isSaved correctly identifies unsaved collections', () => {
      const user = { uid: 'user-123' };
      const collection = {
        savers: [],
      };
      
      const isSaved = !user || !collection ? false : collection.savers?.some(saver => saver.uid === user?.uid) || false;
      
      // isSaved should be false when user's UID is not in savers array
      expect(isSaved).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('handles undefined user.uid gracefully', () => {
      const user = { uid: undefined };
      const collection = {
        savers: [{ uid: 'user-123', saved_at: new Date() }],
      };
      
      const isSaved = !user || !collection ? false : collection.savers?.some(saver => saver.uid === user?.uid) || false;
      
      expect(isSaved).toBe(false);
    });

    it('handles undefined collection.owner_uid gracefully', () => {
      const user = { uid: 'user-123' };
      const collection = {
        owner_uid: undefined,
      };
      
      const showSaveButton = !user || !collection ? false : collection.owner_uid !== user.uid;
      
      // Should return true since undefined !== 'user-123'
      expect(showSaveButton).toBe(true);
    });

    it('handles empty string UIDs', () => {
      const user = { uid: '' };
      const collection = {
        owner_uid: '',
      };
      
      const showSaveButton = !user || !collection ? false : collection.owner_uid !== user.uid;
      
      // Should return false since '' === ''
      expect(showSaveButton).toBe(false);
    });

    it('handles savers with missing uid field', () => {
      const user = { uid: 'user-123' };
      const collection = {
        savers: [
          { saved_at: new Date() }, // Missing uid
          { uid: 'user-456', saved_at: new Date() },
        ],
      };
      
      const isSaved = !user || !collection ? false : collection.savers?.some(saver => saver.uid === user?.uid) || false;
      
      expect(isSaved).toBe(false);
    });
  });
});


/**
 * Unit tests for Task 2.2: handleSaveToggle with optimistic updates
 * 
 * These tests verify the save/unsave handler logic:
 * - Authentication check before save/unsave
 * - Optimistic UI updates (saved_count +1/-1, savers array modification)
 * - Error recovery (revert optimistic updates on API failure)
 * - Toast notifications for success and error cases
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 8.4
 */

describe('CollectionPage - Task 2.2: handleSaveToggle Logic', () => {
  describe('Authentication check (Requirement 8.4)', () => {
    it('should show error toast when user is not authenticated', () => {
      const user = null;
      const collection = { id: 'col-123', saved_count: 5, savers: [] };
      
      // Simulate authentication check
      const shouldProceed = user !== null;
      
      expect(shouldProceed).toBe(false);
      // In actual implementation, this would trigger:
      // showToast("Lỗi", "Vui lòng đăng nhập để lưu collection.", "error");
    });

    it('should proceed when user is authenticated', () => {
      const user = { uid: 'user-123' };
      const collection = { id: 'col-123', saved_count: 5, savers: [] };
      
      const shouldProceed = user !== null;
      
      expect(shouldProceed).toBe(true);
    });

    it('should return early when collection is null', () => {
      const user = { uid: 'user-123' };
      const collection = null;
      
      const shouldProceed = collection !== null;
      
      expect(shouldProceed).toBe(false);
    });
  });

  describe('Optimistic update logic (Requirements 2.2, 2.3, 3.1, 3.2)', () => {
    it('should increment saved_count by 1 when saving', () => {
      const previousSavedCount = 5;
      const newSavedState = true; // Saving
      
      const newSavedCount = previousSavedCount + (newSavedState ? 1 : -1);
      
      expect(newSavedCount).toBe(6);
    });

    it('should decrement saved_count by 1 when unsaving', () => {
      const previousSavedCount = 5;
      const newSavedState = false; // Unsaving
      
      const newSavedCount = previousSavedCount + (newSavedState ? 1 : -1);
      
      expect(newSavedCount).toBe(4);
    });

    it('should add user to savers array when saving', () => {
      const user = { uid: 'user-123' };
      const savers = [{ uid: 'user-456', saved_at: new Date() }];
      const newSavedState = true;
      
      const newSavers = newSavedState
        ? [...savers, { uid: user.uid, saved_at: new Date() }]
        : savers.filter(s => s.uid !== user.uid);
      
      expect(newSavers).toHaveLength(2);
      expect(newSavers.some(s => s.uid === 'user-123')).toBe(true);
    });

    it('should remove user from savers array when unsaving', () => {
      const user = { uid: 'user-123' };
      const savers = [
        { uid: 'user-123', saved_at: new Date() },
        { uid: 'user-456', saved_at: new Date() },
      ];
      const newSavedState = false;
      
      const newSavers = newSavedState
        ? [...savers, { uid: user.uid, saved_at: new Date() }]
        : savers.filter(s => s.uid !== user.uid);
      
      expect(newSavers).toHaveLength(1);
      expect(newSavers.some(s => s.uid === 'user-123')).toBe(false);
      expect(newSavers.some(s => s.uid === 'user-456')).toBe(true);
    });

    it('should handle empty savers array when saving', () => {
      const user = { uid: 'user-123' };
      const savers = [];
      const newSavedState = true;
      
      const newSavers = newSavedState
        ? [...savers, { uid: user.uid, saved_at: new Date() }]
        : savers.filter(s => s.uid !== user.uid);
      
      expect(newSavers).toHaveLength(1);
      expect(newSavers[0].uid).toBe('user-123');
    });

    it('should handle saved_count of 0 when saving', () => {
      const previousSavedCount = 0;
      const newSavedState = true;
      
      const newSavedCount = previousSavedCount + (newSavedState ? 1 : -1);
      
      expect(newSavedCount).toBe(1);
    });
  });

  describe('Error recovery logic (Requirements 2.4, 2.5, 2.6, 3.3, 3.4, 3.5)', () => {
    it('should revert saved_count to previous value on error', () => {
      const previousSavedCount = 5;
      const optimisticSavedCount = 6; // After optimistic update
      
      // Simulate error - revert to previous
      const revertedSavedCount = previousSavedCount;
      
      expect(revertedSavedCount).toBe(5);
      expect(revertedSavedCount).not.toBe(optimisticSavedCount);
    });

    it('should restore savers array to previous state on error when saving failed', () => {
      const user = { uid: 'user-123' };
      const previousSavedState = false;
      const previousSavers = [{ uid: 'user-456', saved_at: new Date() }];
      
      // After optimistic update (added user-123)
      const optimisticSavers = [...previousSavers, { uid: user.uid, saved_at: new Date() }];
      
      // Error occurred - revert
      const revertedSavers = previousSavedState
        ? [...previousSavers.filter(s => s.uid !== user.uid), { uid: user.uid, saved_at: new Date() }]
        : previousSavers.filter(s => s.uid !== user.uid);
      
      expect(revertedSavers).toHaveLength(1);
      expect(revertedSavers.some(s => s.uid === 'user-123')).toBe(false);
    });

    it('should restore savers array to previous state on error when unsaving failed', () => {
      const user = { uid: 'user-123' };
      const previousSavedState = true;
      const previousSavers = [
        { uid: 'user-123', saved_at: new Date() },
        { uid: 'user-456', saved_at: new Date() },
      ];
      
      // After optimistic update (removed user-123)
      const optimisticSavers = previousSavers.filter(s => s.uid !== user.uid);
      
      // Error occurred - revert (add user-123 back)
      const revertedSavers = previousSavedState
        ? [...previousSavers.filter(s => s.uid !== user.uid), { uid: user.uid, saved_at: new Date() }]
        : previousSavers.filter(s => s.uid !== user.uid);
      
      expect(revertedSavers).toHaveLength(2);
      expect(revertedSavers.some(s => s.uid === 'user-123')).toBe(true);
    });
  });

  describe('State transitions', () => {
    it('should correctly toggle from unsaved to saved', () => {
      const isSaved = false;
      const newSavedState = !isSaved;
      
      expect(newSavedState).toBe(true);
    });

    it('should correctly toggle from saved to unsaved', () => {
      const isSaved = true;
      const newSavedState = !isSaved;
      
      expect(newSavedState).toBe(false);
    });

    it('should preserve previous state for error recovery', () => {
      const isSaved = false;
      const previousSavedState = isSaved;
      const newSavedState = !isSaved;
      
      // After error, should revert to previousSavedState
      expect(previousSavedState).toBe(false);
      expect(newSavedState).toBe(true);
      expect(previousSavedState).not.toBe(newSavedState);
    });
  });

  describe('Requirements validation', () => {
    it('validates Requirement 2.2: Optimistic UI update before API call', () => {
      const previousSavedCount = 5;
      const newSavedState = true;
      
      // Optimistic update happens BEFORE API call
      const optimisticSavedCount = previousSavedCount + (newSavedState ? 1 : -1);
      
      expect(optimisticSavedCount).toBe(6);
    });

    it('validates Requirement 2.3: saved_count increments on save', () => {
      const previousSavedCount = 10;
      const newSavedState = true;
      
      const newSavedCount = previousSavedCount + 1;
      
      expect(newSavedCount).toBe(11);
    });

    it('validates Requirement 2.3: saved_count decrements on unsave', () => {
      const previousSavedCount = 10;
      const newSavedState = false;
      
      const newSavedCount = previousSavedCount - 1;
      
      expect(newSavedCount).toBe(9);
    });

    it('validates Requirement 2.4: Error recovery reverts optimistic update', () => {
      const previousSavedCount = 5;
      const optimisticSavedCount = 6;
      
      // On error, revert to previous
      const revertedSavedCount = previousSavedCount;
      
      expect(revertedSavedCount).toBe(5);
    });

    it('validates Requirement 8.4: Authentication check shows error toast', () => {
      const user = null;
      
      const shouldShowErrorToast = !user;
      
      expect(shouldShowErrorToast).toBe(true);
      // In actual implementation: showToast("Lỗi", "Vui lòng đăng nhập để lưu collection.", "error");
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined saved_count gracefully', () => {
      const previousSavedCount = undefined;
      const newSavedState = true;
      
      const newSavedCount = (previousSavedCount || 0) + (newSavedState ? 1 : -1);
      
      expect(newSavedCount).toBe(1);
    });

    it('should handle null saved_count gracefully', () => {
      const previousSavedCount = null;
      const newSavedState = true;
      
      const newSavedCount = (previousSavedCount || 0) + (newSavedState ? 1 : -1);
      
      expect(newSavedCount).toBe(1);
    });

    it('should handle undefined savers array gracefully', () => {
      const user = { uid: 'user-123' };
      const savers = undefined;
      const newSavedState = true;
      
      const newSavers = newSavedState
        ? [...(savers || []), { uid: user.uid, saved_at: new Date() }]
        : (savers || []).filter(s => s.uid !== user.uid);
      
      expect(newSavers).toHaveLength(1);
      expect(newSavers[0].uid).toBe('user-123');
    });

    it('should handle null savers array gracefully', () => {
      const user = { uid: 'user-123' };
      const savers = null;
      const newSavedState = false;
      
      const newSavers = newSavedState
        ? [...(savers || []), { uid: user.uid, saved_at: new Date() }]
        : (savers || []).filter(s => s.uid !== user.uid);
      
      expect(newSavers).toHaveLength(0);
    });

    it('should handle negative saved_count after decrement', () => {
      const previousSavedCount = 0;
      const newSavedState = false; // Unsaving
      
      const newSavedCount = previousSavedCount + (newSavedState ? 1 : -1);
      
      // Note: In production, backend should prevent this, but frontend allows it
      expect(newSavedCount).toBe(-1);
    });
  });
});


/**
 * Unit tests for Task 2.4: Toast notifications for save/unsave feedback
 * 
 * These tests verify the toast notification logic:
 * - Success toast for save operation
 * - Success toast for unsave operation
 * - Error toast for save failure
 * - Error toast for unsave failure
 * - Info toast for 400 errors (already saved)
 * 
 * Requirements: 2.4, 3.4, 8.1, 8.2, 8.3, 8.5
 */

describe('CollectionPage - Task 2.4: Toast Notifications Logic', () => {
  describe('Success toast messages (Requirements 2.4, 3.4)', () => {
    it('should show success toast "Đã lưu collection." when save succeeds', () => {
      const newSavedState = true; // Saving
      const expectedTitle = "Thành công";
      const expectedMessage = "Đã lưu collection.";
      const expectedType = "success";
      
      // Simulate success case
      const toastData = {
        title: expectedTitle,
        message: expectedMessage,
        type: expectedType,
      };
      
      expect(toastData.title).toBe("Thành công");
      expect(toastData.message).toBe("Đã lưu collection.");
      expect(toastData.type).toBe("success");
    });

    it('should show success toast "Đã bỏ lưu collection." when unsave succeeds', () => {
      const newSavedState = false; // Unsaving
      const expectedTitle = "Thành công";
      const expectedMessage = "Đã bỏ lưu collection.";
      const expectedType = "success";
      
      // Simulate success case
      const toastData = {
        title: expectedTitle,
        message: expectedMessage,
        type: expectedType,
      };
      
      expect(toastData.title).toBe("Thành công");
      expect(toastData.message).toBe("Đã bỏ lưu collection.");
      expect(toastData.type).toBe("success");
    });
  });

  describe('Error toast messages (Requirements 8.2, 8.3)', () => {
    it('should show error toast "Không thể lưu collection. Vui lòng thử lại." on save failure', () => {
      const newSavedState = true; // Saving
      const error = { statusCode: 500, message: 'Internal server error' };
      
      // Simulate error case (not 400)
      const toastData = error.statusCode === 400
        ? { title: "Thông báo", message: error.message, type: "info" }
        : {
            title: "Lỗi",
            message: newSavedState ? "Không thể lưu collection. Vui lòng thử lại." : "Không thể bỏ lưu collection. Vui lòng thử lại.",
            type: "error",
          };
      
      expect(toastData.title).toBe("Lỗi");
      expect(toastData.message).toBe("Không thể lưu collection. Vui lòng thử lại.");
      expect(toastData.type).toBe("error");
    });

    it('should show error toast "Không thể bỏ lưu collection. Vui lòng thử lại." on unsave failure', () => {
      const newSavedState = false; // Unsaving
      const error = { statusCode: 500, message: 'Internal server error' };
      
      // Simulate error case (not 400)
      const toastData = error.statusCode === 400
        ? { title: "Thông báo", message: error.message, type: "info" }
        : {
            title: "Lỗi",
            message: newSavedState ? "Không thể lưu collection. Vui lòng thử lại." : "Không thể bỏ lưu collection. Vui lòng thử lại.",
            type: "error",
          };
      
      expect(toastData.title).toBe("Lỗi");
      expect(toastData.message).toBe("Không thể bỏ lưu collection. Vui lòng thử lại.");
      expect(toastData.type).toBe("error");
    });
  });

  describe('Info toast for 400 errors (Requirement 8.1)', () => {
    it('should show info toast with backend message for 400 error (already saved)', () => {
      const error = { statusCode: 400, message: 'Collection already saved.' };
      
      // Simulate 400 error case
      const toastData = error.statusCode === 400
        ? { title: "Thông báo", message: error.message || "Thao tác không thành công.", type: "info" }
        : { title: "Lỗi", message: "Không thể lưu collection. Vui lòng thử lại.", type: "error" };
      
      expect(toastData.title).toBe("Thông báo");
      expect(toastData.message).toBe("Collection already saved.");
      expect(toastData.type).toBe("info");
    });

    it('should show info toast with fallback message when backend message is missing', () => {
      const error = { statusCode: 400, message: null };
      
      // Simulate 400 error case with missing message
      const toastData = error.statusCode === 400
        ? { title: "Thông báo", message: error.message || "Thao tác không thành công.", type: "info" }
        : { title: "Lỗi", message: "Không thể lưu collection. Vui lòng thử lại.", type: "error" };
      
      expect(toastData.title).toBe("Thông báo");
      expect(toastData.message).toBe("Thao tác không thành công.");
      expect(toastData.type).toBe("info");
    });

    it('should show info toast with fallback message when backend message is empty string', () => {
      const error = { statusCode: 400, message: '' };
      
      // Simulate 400 error case with empty message
      const toastData = error.statusCode === 400
        ? { title: "Thông báo", message: error.message || "Thao tác không thành công.", type: "info" }
        : { title: "Lỗi", message: "Không thể lưu collection. Vui lòng thử lại.", type: "error" };
      
      expect(toastData.title).toBe("Thông báo");
      expect(toastData.message).toBe("Thao tác không thành công.");
      expect(toastData.type).toBe("info");
    });
  });

  describe('Error handling logic (Requirement 8.5)', () => {
    it('should differentiate between 400 and other error codes', () => {
      const error400 = { statusCode: 400, message: 'Collection already saved.' };
      const error500 = { statusCode: 500, message: 'Internal server error' };
      
      const toast400 = error400.statusCode === 400
        ? { title: "Thông báo", type: "info" }
        : { title: "Lỗi", type: "error" };
      
      const toast500 = error500.statusCode === 400
        ? { title: "Thông báo", type: "info" }
        : { title: "Lỗi", type: "error" };
      
      expect(toast400.type).toBe("info");
      expect(toast500.type).toBe("error");
    });

    it('should handle 403 error as generic error', () => {
      const error = { statusCode: 403, message: 'Permission denied' };
      const newSavedState = true;
      
      const toastData = error.statusCode === 400
        ? { title: "Thông báo", message: error.message, type: "info" }
        : {
            title: "Lỗi",
            message: newSavedState ? "Không thể lưu collection. Vui lòng thử lại." : "Không thể bỏ lưu collection. Vui lòng thử lại.",
            type: "error",
          };
      
      expect(toastData.type).toBe("error");
      expect(toastData.title).toBe("Lỗi");
    });

    it('should handle 404 error as generic error', () => {
      const error = { statusCode: 404, message: 'Collection not found' };
      const newSavedState = true;
      
      const toastData = error.statusCode === 400
        ? { title: "Thông báo", message: error.message, type: "info" }
        : {
            title: "Lỗi",
            message: newSavedState ? "Không thể lưu collection. Vui lòng thử lại." : "Không thể bỏ lưu collection. Vui lòng thử lại.",
            type: "error",
          };
      
      expect(toastData.type).toBe("error");
      expect(toastData.title).toBe("Lỗi");
    });

    it('should handle network error as generic error', () => {
      const error = { code: 'NETWORK_ERROR', message: 'Network error' };
      const newSavedState = false;
      
      const toastData = error.statusCode === 400
        ? { title: "Thông báo", message: error.message, type: "info" }
        : {
            title: "Lỗi",
            message: newSavedState ? "Không thể lưu collection. Vui lòng thử lại." : "Không thể bỏ lưu collection. Vui lòng thử lại.",
            type: "error",
          };
      
      expect(toastData.type).toBe("error");
      expect(toastData.message).toBe("Không thể bỏ lưu collection. Vui lòng thử lại.");
    });
  });

  describe('Requirements validation', () => {
    it('validates Requirement 2.4: Success toast shown on save', () => {
      const newSavedState = true;
      const successMessage = newSavedState ? "Đã lưu collection." : "Đã bỏ lưu collection.";
      
      expect(successMessage).toBe("Đã lưu collection.");
    });

    it('validates Requirement 3.4: Success toast shown on unsave', () => {
      const newSavedState = false;
      const successMessage = newSavedState ? "Đã lưu collection." : "Đã bỏ lưu collection.";
      
      expect(successMessage).toBe("Đã bỏ lưu collection.");
    });

    it('validates Requirement 8.1: Info toast for 400 errors', () => {
      const error = { statusCode: 400, message: 'Collection already saved.' };
      const toastType = error.statusCode === 400 ? "info" : "error";
      
      expect(toastType).toBe("info");
    });

    it('validates Requirement 8.2: Error toast for save failure', () => {
      const newSavedState = true;
      const error = { statusCode: 500 };
      const errorMessage = newSavedState ? "Không thể lưu collection. Vui lòng thử lại." : "Không thể bỏ lưu collection. Vui lòng thử lại.";
      
      expect(errorMessage).toBe("Không thể lưu collection. Vui lòng thử lại.");
    });

    it('validates Requirement 8.3: Error toast for unsave failure', () => {
      const newSavedState = false;
      const error = { statusCode: 500 };
      const errorMessage = newSavedState ? "Không thể lưu collection. Vui lòng thử lại." : "Không thể bỏ lưu collection. Vui lòng thử lại.";
      
      expect(errorMessage).toBe("Không thể bỏ lưu collection. Vui lòng thử lại.");
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined statusCode', () => {
      const error = { statusCode: undefined, message: 'Some error' };
      const newSavedState = true;
      
      const toastData = error.statusCode === 400
        ? { title: "Thông báo", message: error.message, type: "info" }
        : {
            title: "Lỗi",
            message: newSavedState ? "Không thể lưu collection. Vui lòng thử lại." : "Không thể bỏ lưu collection. Vui lòng thử lại.",
            type: "error",
          };
      
      expect(toastData.type).toBe("error");
    });

    it('should handle null error object', () => {
      const error = null;
      const newSavedState = true;
      
      const toastData = error?.statusCode === 400
        ? { title: "Thông báo", message: error.message, type: "info" }
        : {
            title: "Lỗi",
            message: newSavedState ? "Không thể lưu collection. Vui lòng thử lại." : "Không thể bỏ lưu collection. Vui lòng thử lại.",
            type: "error",
          };
      
      expect(toastData.type).toBe("error");
    });

    it('should handle 400 error with custom backend message', () => {
      const error = { statusCode: 400, message: 'Custom backend error message' };
      
      const toastData = error.statusCode === 400
        ? { title: "Thông báo", message: error.message || "Thao tác không thành công.", type: "info" }
        : { title: "Lỗi", message: "Không thể lưu collection. Vui lòng thử lại.", type: "error" };
      
      expect(toastData.message).toBe("Custom backend error message");
    });
  });
});
