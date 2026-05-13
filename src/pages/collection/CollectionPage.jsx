import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import { collectionService } from "../../services/backend/collection.service";
import { viewsService } from "../../services/backend/views.service";
import { useAuth } from "../../contexts/AuthContext";

const STATUS_TYPES = {
  success: "bg-emerald-600 text-white",
  error: "bg-rose-600 text-white",
  info: "bg-slate-900 text-white",
};

const normalizeTagValue = (value) => value.trim().toLowerCase();

const formatDate = (value) => {
  try {
    return new Date(value).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div className="fixed right-4 top-4 z-50 max-w-sm">
      <div 
        role="alert" 
        aria-live="polite" 
        aria-atomic="true"
        className={`toast-fade-in rounded-2xl px-4 py-3 shadow-2xl shadow-slate-900/20 ${STATUS_TYPES[toast.type] || STATUS_TYPES.info}`}
      >
        <p className="text-sm font-semibold">{toast.title}</p>
        <p className="mt-1 text-xs leading-5 text-white/90">{toast.message}</p>
      </div>
    </div>
  );
}

function SectionCard({ title, description, children, action }) {
  return (
    <section className="rounded-3xl border border-outline-variant/40 bg-surface-container-low p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-on-surface">{title}</h2>
          {description ? <p className="text-sm text-on-surface-variant mt-1">{description}</p> : null}
        </div>
        {action ? <div className="flex items-center gap-2">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function PropertyChip({ label, value }) {
  return (
    <div className="rounded-full border border-outline-variant/50 bg-surface-container px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant break-words">
      <span className="whitespace-nowrap">{label}:</span> <span className="break-all">{value}</span>
    </div>
  );
}

function TagPill({ tag, onRemove, removable }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant/50 bg-surface-container px-3 py-1 text-xs font-medium text-on-surface">
      <span>#{tag}</span>
      {removable ? (
        <button
          type="button"
          onClick={() => onRemove(tag)}
          className="rounded-full p-1 text-on-surface hover:bg-surface-container-high"
          aria-label={`Xóa tag ${tag}`}
        >
          <Icon name="close" size={16} />
        </button>
      ) : null}
    </div>
  );
}

function CollectionPage() {
  const { collectionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  // Debug: Log auth state
  console.log("=== CollectionPage Render ===");
  console.log("authLoading:", authLoading);
  console.log("user:", user);
  console.log("collectionId:", collectionId);
  
  // Determine if this is create mode
  const isCreateMode = collectionId === 'new';
  
  const [collection, setCollection] = useState(null);
  const [editValues, setEditValues] = useState({ name: "", description: "", visibility: "public", thumbnail_url: "" });
  const [isEditing, setIsEditing] = useState(isCreateMode || location.state?.autoEdit || false);
  const [pageBusy, setPageBusy] = useState(!isCreateMode);
  const [saving, setSaving] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [pageError, setPageError] = useState(null);
  const [placeInput, setPlaceInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [collaboratorInput, setCollaboratorInput] = useState("");
  const [toast, setToast] = useState(null);

  // Check if current user is the owner
  const isOwner = useMemo(() => {
    console.log("=== isOwner Check ===");
    console.log("isCreateMode:", isCreateMode);
    console.log("user:", user);
    console.log("collection:", collection);
    
    if (isCreateMode) {
      console.log("→ isOwner = true (create mode)");
      return true;
    }
    
    // Standard ownership check
    if (!user || !collection) {
      console.log("→ isOwner = false (no user or collection)");
      return false;
    }
    
    const result = user.uid === collection.owner_uid;
    console.log("→ isOwner =", result, "| user.uid:", user.uid, "| owner_uid:", collection.owner_uid);
    return result;
  }, [user, collection, isCreateMode]);

  const isCollaborator = useMemo(() => {
    return (
      collection &&
      user?.uid &&
      collection.collaborators?.some(c => c.uid === user.uid)
    );
  }, [collection, user]);

  // Computed value: Check if current user has saved this collection
  // Requirements: 1.1, 1.2, 1.3
  const isSaved = useMemo(() => {
    if (!user || !collection) return false;
    return collection.savers?.some(saver => saver.uid === user.uid) || false;
  }, [user, collection]);

  // Computed value: Determine if save button should be shown
  // Requirements: 1.1, 1.2, 1.3
  const showSaveButton = useMemo(() => {
    if (!user || !collection) return false;
    return collection.owner_uid !== user.uid; // Don't show for owned collections
  }, [user, collection]);

  const showToast = useCallback((title, message, type = "info") => {
    setToast({ title, message, type });
    window.setTimeout(() => setToast(null), 3300);
  }, []);

  // Task 2.2: Save/Unsave handler with optimistic updates
  // Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 8.4
  // Task 8.2: Enhanced error handling with specific messages
  // Task 8.3: Optimistic update rollback on error
  const handleSaveToggle = useCallback(async () => {
    // Authentication check (Requirement 8.4, Task 8.4)
    if (!user) {
      showToast("Lỗi", "Vui lòng đăng nhập để lưu collection.", "error");
      return;
    }

    // Prevent action if no collection loaded
    if (!collection) {
      return;
    }

    // Task 8.3: Store previous state before optimistic update
    const previousSavedState = isSaved;
    const newSavedState = !isSaved;
    const previousSavedCount = collection.saved_count || 0;
    const previousSavers = collection.savers || [];

    try {
      // Optimistic update (Requirements 2.2, 2.3, 3.1, 3.2)
      // Update saved_count display optimistically (+1 for save, -1 for unsave)
      setCollection(prev => ({
        ...prev,
        saved_count: previousSavedCount + (newSavedState ? 1 : -1),
        savers: newSavedState 
          ? [...(prev.savers || []), { uid: user.uid, saved_at: new Date() }]
          : (prev.savers || []).filter(s => s.uid !== user.uid)
      }));

      // API call (Requirements 2.1, 3.1)
      if (newSavedState) {
        await collectionService.saveCollection(collection.id);
        showToast("Thành công", "Đã lưu collection.", "success");
      } else {
        await collectionService.unsaveCollection(collection.id);
        showToast("Thành công", "Đã bỏ lưu collection.", "success");
      }
    } catch (error) {
      // Task 8.3: Revert optimistic update on error (Requirements 2.4, 2.5, 2.6, 3.3, 3.4, 3.5)
      setCollection(prev => ({
        ...prev,
        saved_count: previousSavedCount,
        savers: previousSavers
      }));

      // Task 8.2: Enhanced error handling with specific messages (Requirements 8.1, 8.2, 8.3, 8.5)
      console.error('Save/unsave failed:', error);
      
      // Handle 400 errors (already saved/unsaved) with info toast showing backend message
      if (error.statusCode === 400) {
        showToast("Thông báo", error.message || "Thao tác không thành công.", "info");
      } 
      // Handle 403 error (permission denied) with error toast showing backend message
      else if (error.statusCode === 403) {
        showToast("Lỗi", error.message || "Bạn không có quyền thực hiện thao tác này.", "error");
      }
      // Handle 404 error (collection not found)
      else if (error.statusCode === 404) {
        showToast("Lỗi", "Collection không tồn tại.", "error");
      }
      // Handle network errors
      else if (error.code === 'NETWORK_ERROR' || error.message?.includes('network') || error.message?.includes('Network')) {
        showToast("Lỗi", "Không thể kết nối. Vui lòng thử lại.", "error");
      }
      // Generic error handling for other errors
      else {
        showToast(
          "Lỗi",
          newSavedState ? "Không thể lưu collection. Vui lòng thử lại." : "Không thể bỏ lưu collection. Vui lòng thử lại.",
          "error"
        );
      }
    }
  }, [user, collection, isSaved, showToast]);

  const loadCollection = useCallback(async () => {
    // Skip loading if in create mode
    if (isCreateMode) {
      setPageBusy(false);
      return;
    }
    
    setPageBusy(true);
    setPageError(null);

    try {
      const result = await collectionService.getCollection(collectionId);
      if (!result) {
        setPageError("Collection không tồn tại hoặc đã bị xóa.");
        return;
      }
      
      console.log("Collection loaded:", result);
      console.log("Current user:", user);
      
      setCollection(result);
      setEditValues({
        name: result?.name || "",
        description: result?.description || "",
        visibility: result?.visibility || "public",
        thumbnail_url: result?.thumbnail_url || "",
      });

      // Record view after successfully loading collection
      // This will send auth token automatically via viewsService interceptor
      // Backend will allow view tracking even for private collections if user is owner
      try {
        await viewsService.recordView(collectionId, 'collections');
        console.log("View recorded for collection:", collectionId);
        
        // Optimistically increment view count in local state
        setCollection(prev => ({
          ...prev,
          views: {
            ...prev.views,
            total_views: ((prev.views?.total_views || 0) + 1),
            weekly_views: ((prev.views?.weekly_views || 0) + 1)
          }
        }));
      } catch (viewError) {
        // Don't throw - view tracking is not critical
        console.warn("Failed to record view:", viewError);
      }
    } catch (error) {
      console.error("Failed to load collection:", error);
      setPageError("Không thể tải collection. Vui lòng thử lại sau.");
    } finally {
      setPageBusy(false);
    }
  }, [collectionId, user, isCreateMode]);

  useEffect(() => {
    if (collectionId && collectionId !== 'new') {
      loadCollection();
    } else if (collectionId === 'new') {
      // Initialize empty collection for create mode
      setCollection({
        name: '',
        description: '',
        visibility: 'public',
        thumbnail_url: '',
        tags: [],
        places: [],
        collaborators: [],
        owner_uid: user?.uid,
        saved_count: 0,
        views: {
          total_views: 0,
          weekly_views: 0
        }
      });
      setPageBusy(false);
    }
  }, [collectionId, loadCollection, user]);
  const handleCancelEdit = () => {
    if (collection) {
      setEditValues({
        name: collection.name || "",
        description: collection.description || "",
        visibility: collection.visibility || "public",
        thumbnail_url: collection.thumbnail_url || "",
      });
    }
    setIsEditing(false);
    setPageError(null);
  };
    const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleSaveCollection = async () => {
    // Validation
    if (!editValues.name || editValues.name.trim().length < 3) {
      showToast("Lỗi", "Tên collection phải có ít nhất 3 ký tự.", "error");
      return;
    }

    setSaving(true);
    setPageError(null);

    try {
      if (isCreateMode) {
        // CREATE MODE: Create new collection
        const newCollection = await collectionService.createCollection({
          name: editValues.name.trim(),
          description: editValues.description?.trim() || "",
          visibility: editValues.visibility,
          thumbnail_url: editValues.thumbnail_url?.trim() || "",
          tags: [],
        });
        
        showToast("Thành công", "Collection đã được tạo!", "success");
        
        // Navigate to the newly created collection's edit page
        navigate(`/collections/${newCollection.id}`, { replace: true });
      } else {
        // EDIT MODE: Update existing collection
        if (!collection) return;
        
        const payload = {};
        if (editValues.name !== collection.name) payload.name = editValues.name;
        if (editValues.description !== collection.description) payload.description = editValues.description;
        if (editValues.visibility !== collection.visibility) payload.visibility = editValues.visibility;
        if (editValues.thumbnail_url !== collection.thumbnail_url) payload.thumbnail_url = editValues.thumbnail_url;

        if (Object.keys(payload).length === 0) {
          setIsEditing(false);
          showToast("Đã lưu", "Không có thay đổi mới.", "info");
          return;
        }

        await collectionService.updateCollection(collection.id, payload);
        
        // Update local state with new values
        setCollection(prev => ({ ...prev, ...payload }));
        setIsEditing(false);
        showToast("Thành công", "Cập nhật collection đã được lưu.", "success");
      }
    } catch (error) {
      console.error("Error saving collection:", error);
      setPageError(isCreateMode ? "Tạo collection thất bại. Vui lòng thử lại." : "Lưu collection thất bại. Vui lòng thử lại.");
      showToast("Lỗi", isCreateMode ? "Không thể tạo collection." : "Không thể lưu collection.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPlace = async () => {
    if (!collection || !placeInput.trim()) {
      showToast("Lỗi", "Vui lòng nhập place id hợp lệ.", "error");
      return;
    }

    const placeId = placeInput.trim();
    if (collection.places?.some((item) => item.place_id === placeId)) {
      showToast("Đã tồn tại", "Địa điểm này đã có trong collection.", "info");
      return;
    }

    setActionBusy(true);
    try {
      // Backend expects array of place IDs
      // Backend will automatically add added_by and added_at from auth token
      const updatedCollection = await collectionService.addPlacesToCollection(collection.id, [placeId]);
      
      // Update local state with response from backend
      setCollection(updatedCollection);
      
      setPlaceInput("");
      showToast("Thành công", "Đã thêm địa điểm vào collection.", "success");
    } catch (error) {
      console.error("Add place failed:", error);
      showToast("Lỗi", "Thêm địa điểm không thành công.", "error");
    } finally {
      setActionBusy(false);
    }
  };

  const handleRemovePlace = async (placeId) => {
    if (!collection) return;
    setActionBusy(true);

    try {
      // Backend expects array of place IDs
      const updatedCollection = await collectionService.removePlacesFromCollection(collection.id, [placeId]);
      
      // Update local state with response from backend
      setCollection(updatedCollection);
      
      showToast("Thành công", "Đã xóa địa điểm.", "success");
    } catch (error) {
      console.error("Remove place failed:", error);
      showToast("Lỗi", "Xóa địa điểm không thành công.", "error");
    } finally {
      setActionBusy(false);
    }
  };

  const handleAddTag = async () => {
    if (!collection || !tagInput.trim()) {
      showToast("Lỗi", "Vui lòng nhập tag.", "error");
      return;
    }

    const tag = normalizeTagValue(tagInput);
    if (!tag) {
      showToast("Lỗi", "Tag không hợp lệ.", "error");
      return;
    }
    if (collection.tags?.includes(tag)) {
      showToast("Đã tồn tại", "Tag này đã có.", "info");
      return;
    }

    setActionBusy(true);
    try {
      // Backend expects array of tags
      const updatedCollection = await collectionService.addTagsToCollection(collection.id, [tag]);
      
      // Update local state with response from backend
      setCollection(updatedCollection);
      
      setTagInput("");
      showToast("Thành công", "Đã thêm tag.", "success");
    } catch (error) {
      console.error("Add tag failed:", error);
      showToast("Lỗi", "Thêm tag không thành công.", "error");
    } finally {
      setActionBusy(false);
    }
  };

  const handleRemoveTag = async (tag) => {
    if (!collection) return;
    setActionBusy(true);

    try {
      // Backend expects array of tags
      const updatedCollection = await collectionService.removeTagsFromCollection(collection.id, [tag]);
      
      // Update local state with response from backend
      setCollection(updatedCollection);
      
      showToast("Thành công", "Đã xóa tag.", "success");
    } catch (error) {
      console.error("Remove tag failed:", error);
      showToast("Lỗi", "Xóa tag không thành công.", "error");
    } finally {
      setActionBusy(false);
    }
  };

  const handleAddCollaborator = async () => {
    if (!collection || !collaboratorInput.trim()) {
      showToast("Lỗi", "Vui lòng nhập UID người dùng.", "error");
      return;
    }

    const collaboratorUid = collaboratorInput.trim();
    
    // Check if trying to add owner
    if (collaboratorUid === collection.owner_uid) {
      showToast("Lỗi", "Chủ sở hữu mặc định đã có quyền, không cần thêm vào danh sách.", "info");
      return;
    }
    
    // Check if already exists
    if (collection.collaborators?.some(c => c.uid === collaboratorUid)) {
      showToast("Đã tồn tại", "Người này đã là cộng tác viên.", "info");
      return;
    }

    setActionBusy(true);
    try {
      // API expects array of UIDs
      const updatedCollection = await collectionService.addCollaboratorsToCollection(
        collection.id, 
        [collaboratorUid]
      );
      
      // Update local state with response from backend
      setCollection(updatedCollection);
      
      setCollaboratorInput("");
      showToast("Thành công", "Đã thêm cộng tác viên.", "success");
    } catch (error) {
      console.error("Add collaborator failed:", error);
      showToast("Lỗi", error.message || "Không thể thêm cộng tác viên.", "error");
    } finally {
      setActionBusy(false);
    }
  };

  const handleRemoveCollaborator = async (uid) => {
    if (!collection) return;
    
    // Confirmation dialog
    if (!window.confirm("Bạn có chắc muốn xóa cộng tác viên này?")) {
      return;
    }
    
    setActionBusy(true);

    try {
      // API expects array of UIDs
      const updatedCollection = await collectionService.removeCollaboratorsFromCollection(
        collection.id, 
        [uid]
      );
      
      // Update local state with response from backend
      setCollection(updatedCollection);
      
      showToast("Thành công", "Đã xóa cộng tác viên.", "success");
    } catch (error) {
      console.error("Remove collaborator failed:", error);
      showToast("Lỗi", error.message || "Xóa cộng tác viên không thành công.", "error");
    } finally {
      setActionBusy(false);
    }
  };

  const renderCollectionMeta = () => {
    if (!collection) return null;

    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PropertyChip label="ID" value={collection.id ? (collection.id.substring(0, 8) + '...') : 'N/A'} />
        <PropertyChip label="Trạng thái" value={String(collection.visibility || 'public').toUpperCase()} />
        <PropertyChip label="Số tag" value={collection.tags?.length ?? 0} />
        <PropertyChip label="Cộng tác viên" value={collection.collaborators?.length ?? 0} />
      </div>
    );
  };

  // Wait for auth to load before rendering
  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-background text-on-background">
        <div className="inline-flex items-center gap-3 rounded-3xl border border-outline-variant/40 bg-surface-container-low px-6 py-5 shadow-xl">
          <Icon name="hourglass_top" size={24} className="text-primary animate-spin" />
          <span className="text-sm font-medium">Đang xác thực...</span>
        </div>
      </div>
    );
  }

  if (pageBusy) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-background text-on-background">
        <div className="inline-flex items-center gap-3 rounded-3xl border border-outline-variant/40 bg-surface-container-low px-6 py-5 shadow-xl">
          <Icon name="hourglass_top" size={24} className="text-primary" />
          <span className="text-sm font-medium">Đang tải collection...</span>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center gap-4 bg-background text-on-background px-4">
        <p className="text-lg font-semibold">Không tìm thấy collection.</p>
        {pageError ? <p className="text-sm text-on-surface-variant">{pageError}</p> : null}
        <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90">
          <Icon name="arrow_back_ios_new" size={18} /> Về trang chủ
        </Link>
      </div>
    );
  }

  // Show login warning only if:
  // 1. Auth is not loading
  // 2. User is null (not logged in)
  // 3. Not in create mode
  const showLoginWarning = !authLoading && !user && !isCreateMode;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background px-4 py-6 text-on-background sm:px-6 lg:px-10">
      <Toast toast={toast} />

      {/* Login Warning Banner */}
      {/* Task 8.4: Enhanced login prompt for unauthenticated users */}
      {showLoginWarning && (
        <div className="mx-auto w-full max-w-7xl mb-6">
          <div className="rounded-3xl border border-orange-400/20 bg-orange-50 p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <Icon name="warning" size={24} className="text-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-800">Bạn chưa đăng nhập</p>
                <p className="text-xs text-orange-600 mt-1">Vui lòng đăng nhập để lưu collection này và truy cập đầy đủ tính năng.</p>
              </div>
              <Link 
                to="/auth/login" 
                className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-orange-700 hover:scale-105 shadow-md"
              >
                <Icon name="login" size={18} />
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="mx-auto w-full max-w-7xl mb-6">
        <button
          type="button"
          onClick={() => {
            // If we have returnTab in location state, navigate to dashboard with that tab
            const returnTab = location.state?.returnTab;
            if (returnTab) {
              navigate(`/collections?tab=${returnTab}`, { state: { fromCollection: true } });
            } else {
              navigate(-1, { state: { fromCollection: true } });
            }
          }}
          className="inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
        >
          <Icon name="arrow_back" size={20} />
          <span>Quay lại</span>
        </button>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <div className="flex flex-col gap-6 rounded-4xl border border-outline-variant/40 bg-surface-container-low p-6 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  <Icon name="collections" size={16} /> Collection
                </span>
                {!isCreateMode && (
                  <>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/50 bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant">
                      <Icon name="favorite" size={14} />
                      <span>{collection?.saved_count ?? 0} lượt thích</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/50 bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant">
                      <Icon name="visibility" size={14} />
                      <span>{collection?.views?.total_views ?? 0} lượt xem</span>
                    </span>
                  </>
                )}
                {isCreateMode && (
                  <span className="rounded-full border border-outline-variant/50 bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant">
                    Mới
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-semibold text-on-surface">
                  {isCreateMode ? "Tạo Collection Mới" : collection.name}
                </h1>

                {!isEditing && (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      {collection?.tags?.length ? (
                        collection.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface">
                            #{tag}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant">
                          Chưa có thẻ tag
                        </span>
                      )}
                    </div>
                    <p className="max-w-3xl text-sm leading-7 text-on-surface-variant">{collection?.description || "Collection chưa có mô tả."}</p>
                  </>
                )}
              </div>

              {isEditing && !isCreateMode ? renderCollectionMeta() : null}
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-end">
              {!isCreateMode && <span className="text-sm text-on-surface-variant">Owner: {collection.owner_uid}</span>}
              
              {/* Save button - only show for non-owners when not editing (Requirements 1.1, 1.2, 6.1, 6.2, 6.3, 6.4, 9.1, 9.2, 9.3, 9.4, 9.5) */}
              {/* Task 8.1: Added hover animation and transitions */}
              {/* Task 8.4: Enhanced disabled state with tooltip for unauthenticated users */}
              {!isEditing && showSaveButton && !isCreateMode && (
                <button
                  type="button"
                  onClick={handleSaveToggle}
                  disabled={!user || actionBusy}
                  className="save-button-focus save-button-hover touch-target-min inline-flex items-center gap-2 rounded-full border border-outline-variant/70 bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface transition-all duration-300 hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  title={!user ? 'Please login to save collections' : (isSaved ? 'Unsave collection' : 'Save collection')}
                  aria-label={isSaved ? 'Unsave collection' : 'Save collection'}
                  aria-pressed={isSaved}
                  aria-busy={actionBusy}
                >
                  {actionBusy ? (
                    <>
                      <Icon name="hourglass_top" size={18} className="animate-spin" />
                      <span>Đang xử lý...</span>
                      <span className="sr-only">Đang lưu collection...</span>
                    </>
                  ) : (
                    <>
                      <Icon name={isSaved ? 'favorite' : 'favorite_border'} size={18} className={isSaved ? 'text-red-500 transition-all duration-300' : 'transition-all duration-300'} />
                      <span>{isSaved ? 'Đã lưu' : 'Lưu'}</span>
                    </>
                  )}
                </button>
              )}
              
              {/* Edit button - only show for owner when not editing and not in create mode */}
              {!isEditing && isOwner && !isCreateMode && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="inline-flex items-center gap-2 rounded-full border border-outline-variant/70 bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-high"
                >
                  <Icon name="edit" size={18} /> Chỉnh sửa
                </button>
              )}

              {/* Save and Cancel buttons - only show when editing */}
              {isEditing && (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="inline-flex items-center gap-2 rounded-full border border-outline-variant/70 bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-high"
                  >
                    <Icon name="close" size={18} /> Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCollection}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Icon name="save" size={18} /> {saving ? 'Đang lưu...' : (isCreateMode ? 'Tạo bộ sưu tập' : 'Lưu')}
                  </button>
                </>
              )}
            </div>
          </div>

          {pageError ? (
            <div className="rounded-3xl border border-rose-400/20 bg-rose-50 p-4 text-sm text-rose-800">
              {pageError}
            </div>
          ) : null}

          {isEditing ? (
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="grid gap-6">
                <SectionCard
                  title="Thông tin collection"
                  description={isCreateMode ? "Điền thông tin cơ bản cho collection mới." : "Chỉnh sửa thông tin cơ bản của bộ sưu tập."}
                >
                  <div className="grid gap-4">
                    <label className="grid gap-2 text-sm font-medium text-on-surface">
                      Tên collection
                      <input
                        value={editValues.name}
                        onChange={(event) => setEditValues((prev) => ({ ...prev, name: event.target.value }))}
                        disabled={!isEditing}
                        className="w-full rounded-3xl border border-outline-variant/70 bg-surface-container px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary/80 disabled:cursor-not-allowed disabled:bg-surface-container-low"
                        placeholder="Nhập tên collection"
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-on-surface">
                      Mô tả
                      <textarea
                        value={editValues.description}
                        onChange={(event) => setEditValues((prev) => ({ ...prev, description: event.target.value }))}
                        disabled={!isEditing}
                        rows={4}
                        className="w-full rounded-3xl border border-outline-variant/70 bg-surface-container px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary/80 disabled:cursor-not-allowed disabled:bg-surface-container-low"
                        placeholder="Thêm mô tả về collection"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="grid gap-2 text-sm font-medium text-on-surface">
                        Thẻ ảnh đại diện
                        <input
                          value={editValues.thumbnail_url}
                          onChange={(event) => setEditValues((prev) => ({ ...prev, thumbnail_url: event.target.value }))}
                          disabled={!isEditing}
                          className="w-full rounded-3xl border border-outline-variant/70 bg-surface-container px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary/80 disabled:cursor-not-allowed disabled:bg-surface-container-low"
                          placeholder="URL ảnh thumbnail"
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-medium text-on-surface">
                        Quyền truy cập
                        <select
                          value={editValues.visibility}
                          onChange={(event) => setEditValues((prev) => ({ ...prev, visibility: event.target.value }))}
                          disabled={!isEditing}
                          className="w-full rounded-3xl border border-outline-variant/70 bg-surface-container px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary/80 disabled:cursor-not-allowed disabled:bg-surface-container-low"
                        >
                          <option value="public">Công khai</option>
                          <option value="unlisted">Không để danh sách</option>
                          <option value="private">Riêng tư</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </SectionCard>

                {!isCreateMode && (
                  <>
                    <SectionCard
                      title="Quản lý địa điểm"
                      description="Thêm hoặc xóa địa điểm trong collection."
                    >
                  <div className="grid gap-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                      <input
                        value={placeInput}
                        onChange={(event) => setPlaceInput(event.target.value)}
                        placeholder="Nhập place id"
                        className="w-full rounded-3xl border border-outline-variant/70 bg-surface-container px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary/80"
                      />
                      <button
                        type="button"
                        onClick={handleAddPlace}
                        disabled={actionBusy}
                        className="inline-flex items-center justify-center rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Icon name="add" size={18} /> Thêm
                      </button>
                    </div>

                    <div className="space-y-3">
                      {collection.places?.length ? (
                        collection.places.map((item) => (
                          <div key={item.place_id} className="flex flex-col gap-2 rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-on-surface">{item.place_id}</p>
                              <p className="text-xs text-on-surface-variant">Thêm bởi {item.added_by} · {formatDate(item.added_at)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePlace(item.place_id)}
                              disabled={actionBusy}
                              className="inline-flex items-center gap-2 rounded-full border border-rose-400/80 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Icon name="delete" size={16} /> Xóa
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-3xl border border-dashed border-outline-variant/40 bg-surface-container py-10 text-center text-sm text-on-surface-variant">
                          Collection chưa có địa điểm nào.
                        </div>
                      )}
                    </div>
                  </div>
                </SectionCard>

                    <SectionCard
                      title="Thẻ tags"
                      description="Thêm tag mới để lọc collection."
                    >
                      <div className="grid gap-4">
                        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                          <input
                            value={tagInput}
                            onChange={(event) => setTagInput(event.target.value)}
                            placeholder="Nhập tag mới"
                            className="w-full rounded-3xl border border-outline-variant/70 bg-surface-container px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary/80"
                          />
                          <button
                            type="button"
                            onClick={handleAddTag}
                            disabled={actionBusy}
                            className="inline-flex items-center justify-center rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Icon name="tag" size={18} /> Thêm tag
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {collection.tags?.length ? (
                            collection.tags.map((tag) => (
                              <TagPill key={tag} tag={tag} removable={true} onRemove={handleRemoveTag} />
                            ))
                          ) : (
                            <p className="text-sm text-on-surface-variant">Collection chưa có tag.</p>
                          )}
                        </div>
                      </div>
                    </SectionCard>
                  </>
                )}
              </div>

              <div className="grid gap-6">
                <SectionCard
                  title="Tóm tắt"
                  description="Thông tin nhanh của collection."
                >
                  <div className="grid gap-3">
                    {!isCreateMode && (
                      <>
                        <div className="rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-4 text-sm text-on-surface">
                          <p className="font-semibold text-on-surface">Ngày tạo</p>
                          <p className="mt-1 text-sm text-on-surface-variant">{formatDate(collection.created_at)}</p>
                        </div>
                        <div className="rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-4 text-sm text-on-surface">
                          <p className="font-semibold text-on-surface">Cập nhật</p>
                          <p className="mt-1 text-sm text-on-surface-variant">{formatDate(collection.updated_at)}</p>
                        </div>
                      </>
                    )}
                    <div className="rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-4 text-sm text-on-surface">
                      <p className="font-semibold text-on-surface">Người dùng hiện tại</p>
                      <p className="mt-1 text-sm text-on-surface-variant">{user?.uid || "Chưa đăng nhập"}</p>
                    </div>
                    {isCreateMode && (
                      <div className="rounded-3xl border border-primary/20 bg-primary/5 px-4 py-4 text-sm">
                        <p className="font-semibold text-primary">Chế độ tạo mới</p>
                        <p className="mt-1 text-xs text-on-surface-variant">Điền thông tin cơ bản và bấm "Tạo bộ sưu tập"</p>
                      </div>
                    )}
                  </div>
                </SectionCard>

                {!isCreateMode && (
                  <SectionCard
                    title={isOwner ? "Quản lý cộng tác viên" : "Cộng tác viên"}
                    description={isOwner ? "Chỉ chủ sở hữu collection mới có thể thêm hoặc xóa cộng tác viên." : "Danh sách cộng tác viên hiện tại của collection."}
                  >
                    {isOwner ? (
                      <div className="grid gap-4">
                        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                          <input
                            value={collaboratorInput}
                            onChange={(event) => setCollaboratorInput(event.target.value)}
                            placeholder="Nhập UID người dùng"
                            className="w-full rounded-3xl border border-outline-variant/70 bg-surface-container px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary/80"
                          />
                          <button
                            type="button"
                            onClick={handleAddCollaborator}
                            disabled={actionBusy}
                            className="inline-flex items-center justify-center gap-2 rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Icon name="person_add" size={18} />
                            <span>Mời</span>
                          </button>
                        </div>
                        <div className="space-y-3">
                          {collection.collaborators?.length ? (
                            collection.collaborators.map((collaborator) => {
                              const isCollaboratorOwner = collaborator.uid === collection.owner_uid;
                              
                              return (
                                <div key={collaborator.uid} className="flex flex-col gap-2 rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-on-surface">{collaborator.uid}</p>
                                    <p className="text-xs text-on-surface-variant">UID: {collaborator.uid}</p>
                                  </div>
                                  {isCollaboratorOwner ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
                                      Owner
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCollaborator(collaborator.uid)}
                                      disabled={actionBusy}
                                      className="inline-flex items-center gap-2 rounded-full border border-rose-400/80 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      <Icon name="close" size={16} /> Xóa
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="rounded-3xl border border-dashed border-outline-variant/40 bg-surface-container py-10 text-center text-sm text-on-surface-variant">
                              Chưa có cộng tác viên nào.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {collection.collaborators?.length ? (
                          collection.collaborators.map((collaborator) => (
                            <div key={collaborator.uid} className="rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-3 text-sm text-on-surface">
                              <p className="font-semibold">{collaborator.uid}</p>
                              <p className="mt-1 text-xs text-on-surface-variant">UID: {collaborator.uid}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-on-surface-variant">Collection hiện không có cộng tác viên.</p>
                        )}
                      </div>
                    )}
                  </SectionCard>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="grid gap-6">
                <SectionCard
                  title="Địa điểm trong collection"
                  description="Danh sách địa điểm đã lưu trong collection."
                >
                  <div className="space-y-3">
                    {collection.places?.length ? (
                      collection.places.map((item) => (
                        <div key={item.place_id} className="flex flex-col gap-2 rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{item.place_id}</p>
                            <p className="text-xs text-on-surface-variant">Thêm bởi {item.added_by} · {formatDate(item.added_at)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-3xl border border-dashed border-outline-variant/40 bg-surface-container py-10 text-center text-sm text-on-surface-variant">
                        Collection chưa có địa điểm.
                      </div>
                    )}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Cộng tác viên"
                  description="Danh sách người cộng tác hiện tại của collection."
                >
                  <div className="grid gap-3">
                    {collection.collaborators?.length ? (
                      collection.collaborators.map((collaborator) => (
                        <div key={collaborator.uid} className="rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-4 text-sm text-on-surface">
                          <p className="font-semibold">{collaborator.uid}</p>
                          <p className="mt-1 text-xs text-on-surface-variant">UID: {collaborator.uid}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-3xl border border-dashed border-outline-variant/40 bg-surface-container py-10 text-center text-sm text-on-surface-variant">
                        Chưa có cộng tác viên.
                      </div>
                    )}
                  </div>
                </SectionCard>
              </div>
              <div className="grid gap-6">
                <SectionCard
                  title="Tóm tắt"
                  description="Thông tin nhanh của collection."
                >
                  <div className="grid gap-3">
                    <div className="rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-4 text-sm text-on-surface">
                      <p className="font-semibold text-on-surface">Ngày tạo</p>
                      <p className="mt-1 text-sm text-on-surface-variant">{formatDate(collection.created_at)}</p>
                    </div>
                    <div className="rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-4 text-sm text-on-surface">
                      <p className="font-semibold text-on-surface">Cập nhật</p>
                      <p className="mt-1 text-sm text-on-surface-variant">{formatDate(collection.updated_at)}</p>
                    </div>
                    <div className="rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-4 text-sm text-on-surface">
                      <p className="font-semibold text-on-surface">Người dùng hiện tại</p>
                      <p className="mt-1 text-sm text-on-surface-variant">{user?.uid || "Chưa đăng nhập"}</p>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CollectionPage;
