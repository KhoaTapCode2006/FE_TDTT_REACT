import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import PlaceListItem from "@/components/collection/PlaceListItem";
import PlaceDetailModal from "@/components/collection/PlaceDetailModal";
import UserSuggestionAutocomplete from "@/components/autocomplete/UserSuggestionAutocomplete";
import HotelSuggestionAutocomplete from "@/components/autocomplete/HotelSuggestionAutocomplete";
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

// Tab configuration for collection page navigation
const TABS = [
  {
    id: 'info',
    label: 'Thông tin',
    icon: 'info',
    ariaLabel: 'Thông tin collection'
  },
  {
    id: 'places',
    label: 'Địa điểm',
    icon: 'location_on',
    ariaLabel: 'Địa điểm trong collection'
  },
  {
    id: 'contributors',
    label: 'Người đóng góp',
    icon: 'group',
    ariaLabel: 'Người đóng góp trong collection'
  },
  {
    id: 'savers',
    label: 'Người đã lưu',
    icon: 'favorite',
    ariaLabel: 'Người đã lưu collection'
  }
];

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
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'places', 'contributors', 'savers'
  const [savers, setSavers] = useState([]); // List of users who saved this collection
  const [saversPage, setSaversPage] = useState(1); // Current page for savers list
  const [saversLoading, setSaversLoading] = useState(false); // Loading state for savers fetch
  const SAVERS_PER_PAGE = 3; // Number of savers per page
  const PLACES_PER_PAGE = 3; // Number of places per page

  // Task 2: Places state management for collection-places-display feature
  // Requirements: REQ-4 (Load Places Data on Tab Navigation)
  const [allPlaces, setAllPlaces] = useState([]); // Full places list from API (paginate on client)
  const [placesPage, setPlacesPage] = useState(1); // Current page for places list
  const [placesLoading, setPlacesLoading] = useState(false); // Loading state for places fetch
  const [placesError, setPlacesError] = useState(null); // Error message for places fetch
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Keyboard navigation handler for tab buttons
  const handleTabKeyDown = useCallback((event, tabId) => {
    const currentIndex = TABS.findIndex(tab => tab.id === tabId);
    
    switch (event.key) {
      case 'Enter':
      case ' ':
        // Activate tab on Enter or Space
        event.preventDefault();
        setActiveTab(tabId);
        break;
      case 'ArrowRight':
        // Move to next tab
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % TABS.length;
        setActiveTab(TABS[nextIndex].id);
        // Focus the next tab button
        document.getElementById(`${TABS[nextIndex].id}-tab`)?.focus();
        break;
      case 'ArrowLeft':
        // Move to previous tab
        event.preventDefault();
        const prevIndex = (currentIndex - 1 + TABS.length) % TABS.length;
        setActiveTab(TABS[prevIndex].id);
        // Focus the previous tab button
        document.getElementById(`${TABS[prevIndex].id}-tab`)?.focus();
        break;
      case 'Home':
        // Move to first tab
        event.preventDefault();
        setActiveTab(TABS[0].id);
        document.getElementById(`${TABS[0].id}-tab`)?.focus();
        break;
      case 'End':
        // Move to last tab
        event.preventDefault();
        setActiveTab(TABS[TABS.length - 1].id);
        document.getElementById(`${TABS[TABS.length - 1].id}-tab`)?.focus();
        break;
      default:
        break;
    }
  }, []);

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
    
    // Handle both owner_uid (string) and owner.uid (object) formats
    const ownerUid = collection.owner_uid || collection.owner?.uid;
    const result = user.uid === ownerUid;
    console.log("→ isOwner =", result, "| user.uid:", user.uid, "| owner_uid:", ownerUid);
    return result;
  }, [user, collection, isCreateMode]);

  // Check if current user can edit (owner OR contributor)
  const canEdit = useMemo(() => {
    if (isCreateMode) return true;
    if (!user || !collection) return false;
    
    // Owner can always edit
    if (isOwner) return true;
    
    // Check if user is a contributor
    const isContributor = collection.contributors?.some(c => c.uid === user.uid);
    console.log("→ canEdit check | isOwner:", isOwner, "| isContributor:", isContributor);
    return isContributor;
  }, [user, collection, isOwner, isCreateMode]);

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
    // Handle both owner_uid (string) and owner.uid (object) formats
    const ownerUid = collection.owner_uid || collection.owner?.uid;
    return ownerUid !== user.uid; // Don't show for owned collections
  }, [user, collection]);

  const showToast = useCallback((title, message, type = "info") => {
    setToast({ title, message, type });
    window.setTimeout(() => setToast(null), 3300);
  }, []);

  // Task 2.5: Load places data callback function
  // Requirements: REQ-1 (Fetch Collection Places with Full Hotel Data), REQ-4 (Load Places Data on Tab Navigation)
  const loadAllPlaces = useCallback(async () => {
    if (!collection || isCreateMode) {
      return;
    }

    setPlacesLoading(true);
    setPlacesError(null);

    try {
      const places = await collectionService.getCollectionPlaces(collection.id);
      setAllPlaces(places || []);
    } catch (error) {
      console.error("Failed to load places data:", error);
      setPlacesError("Không thể tải danh sách địa điểm. Vui lòng thử lại.");
    } finally {
      setPlacesLoading(false);
    }
  }, [collection, isCreateMode]);

  const getTotalPlaces = useCallback(() => {
    if (collection?.place_count != null) {
      return collection.place_count;
    }
    return allPlaces.length;
  }, [collection?.place_count, allPlaces.length]);

  const visiblePlaces = useMemo(() => {
    const start = (placesPage - 1) * PLACES_PER_PAGE;
    return allPlaces.slice(start, start + PLACES_PER_PAGE);
  }, [allPlaces, placesPage]);

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

      let merged = result;
      try {
        const contributorRows = await collectionService.getCollectionContributors(collectionId);
        merged = { ...result, contributors: contributorRows };
      } catch (contribErr) {
        console.warn("Could not load contributors list:", contribErr);
      }

      console.log("Collection loaded:", merged);
      console.log("Current user:", user);
      
      setCollection(merged);
      setEditValues({
        name: merged?.name || "",
        description: merged?.description || "",
        visibility: merged?.visibility || "public",
        thumbnail_url: merged?.thumbnail_url || "",
      });

      // Load savers list
      try {
        const saversList = await collectionService.getCollectionSavers(collectionId);
        setSavers(saversList || []);
      } catch (saversErr) {
        console.warn("Could not load savers list:", saversErr);
        setSavers([]);
      }

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
        contributors: [],
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

  useEffect(() => {
    setPlacesPage(1);
    setAllPlaces([]);
    setSelectedPlace(null);
  }, [collectionId]);

  useEffect(() => {
    if (activeTab === 'places' && !isCreateMode && collection) {
      loadAllPlaces();
    }
  }, [activeTab, collection?.id, isCreateMode, loadAllPlaces]);

  useEffect(() => {
    const totalPlaces = getTotalPlaces();
    if (totalPlaces === 0) return;
    const totalPages = Math.ceil(totalPlaces / PLACES_PER_PAGE);
    if (placesPage > totalPages) {
      setPlacesPage(totalPages);
    }
  }, [getTotalPlaces, placesPage]);
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
      
      const totalPlaces = updatedCollection.place_count ?? updatedCollection.places?.length ?? 0;
      const lastPage = Math.max(1, Math.ceil(totalPlaces / PLACES_PER_PAGE));
      await loadAllPlaces();
      setPlacesPage(lastPage);

      setPlaceInput("");
      showToast("Thành công", "Đã thêm địa điểm vào collection.", "success");
    } catch (error) {
      console.error("Add place failed:", error);
      showToast("Lỗi", "Thêm địa điểm không thành công.", "error");
    } finally {
      setActionBusy(false);
    }
  };

  /**
   * Handle hotel selection from HotelSuggestionAutocomplete
   */
  const handleHotelSelect = async (hotel) => {
    if (!collection) {
      showToast("Lỗi", "Collection chưa được tải.", "error");
      return;
    }

    // Use property_token as place_id
    const placeId = hotel.property_token;
    
    if (!placeId) {
      showToast("Lỗi", "Khách sạn không hợp lệ.", "error");
      return;
    }

    // Check for duplicates
    if (collection.places?.some((item) => item.place_id === placeId)) {
      showToast("Thông báo", "Khách sạn này đã có trong collection.", "info");
      return;
    }

    setActionBusy(true);
    try {
      // Backend expects array of place IDs
      const updatedCollection = await collectionService.addPlacesToCollection(collection.id, [placeId]);
      
      // Update local state with response from backend
      setCollection(updatedCollection);
      
      const totalPlaces = updatedCollection.place_count ?? updatedCollection.places?.length ?? 0;
      const lastPage = Math.max(1, Math.ceil(totalPlaces / PLACES_PER_PAGE));
      await loadAllPlaces();
      setPlacesPage(lastPage);

      showToast("Thành công", "Đã thêm khách sạn vào collection.", "success");
    } catch (error) {
      console.error("Add hotel failed:", error);
      showToast("Lỗi", "Thêm khách sạn không thành công.", "error");
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
      
      setCollection(updatedCollection);

      if (selectedPlace?.place_id === placeId) {
        setSelectedPlace(null);
      }

      const totalPlaces = updatedCollection.place_count ?? updatedCollection.places?.length ?? 0;
      const totalPages = Math.max(1, Math.ceil(totalPlaces / PLACES_PER_PAGE));
      await loadAllPlaces();
      if (placesPage > totalPages) {
        setPlacesPage(totalPages);
      }

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

  /**
   * Handle user selection from UserSuggestionAutocomplete
   * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
   */
  const handleAddContributor = async (selectedUser) => {
    if (!collection) {
      showToast("Lỗi", "Collection chưa được tải.", "error");
      return;
    }

    if (!selectedUser || !selectedUser.uid) {
      showToast("Lỗi", "Người dùng không hợp lệ.", "error");
      return;
    }

    const contributorUid = selectedUser.uid;

    // Handle both owner_uid (string) and owner.uid (object) formats
    const ownerUid = collection.owner_uid || collection.owner?.uid;
    if (contributorUid === ownerUid) {
      showToast("Thông báo", "Chủ sở hữu mặc định đã có quyền, không cần thêm vào danh sách.", "info");
      return;
    }

    // Check if user is already a contributor (Requirement 15.3)
    if (collection.contributors?.some((c) => c.uid === contributorUid)) {
      showToast("Thông báo", "Người dùng đã là contributor.", "info");
      return;
    }

    setActionBusy(true);
    try {
      // Call API to add contributor (Requirement 15.4)
      const updatedCollection = await collectionService.addContributorsToCollection(collection.id, [
        contributorUid,
      ]);
      
      // Refresh contributors list to get full user details
      const rows = await collectionService.getCollectionContributors(collection.id).catch(() => null);
      setCollection({
        ...updatedCollection,
        contributors: rows ?? updatedCollection.contributors ?? [],
      });

      showToast("Thành công", "Đã thêm người đóng góp.", "success");
    } catch (error) {
      // Handle API errors (Requirement 15.5)
      console.error("Add contributor failed:", error);
      
      // Display specific error messages based on error type
      if (error.statusCode === 400) {
        showToast("Lỗi", error.message || "Yêu cầu không hợp lệ.", "error");
      } else if (error.statusCode === 403) {
        showToast("Lỗi", error.message || "Bạn không có quyền thêm người đóng góp.", "error");
      } else if (error.statusCode === 404) {
        showToast("Lỗi", "Người dùng hoặc collection không tồn tại.", "error");
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
        showToast("Lỗi", "Không thể kết nối. Vui lòng thử lại.", "error");
      } else {
        showToast("Lỗi", error.message || "Không thể thêm người đóng góp.", "error");
      }
    } finally {
      setActionBusy(false);
    }
  };

  const handleRemoveContributor = async (uid) => {
    if (!collection) return;

    if (!window.confirm("Bạn có chắc muốn xóa người đóng góp này?")) {
      return;
    }

    setActionBusy(true);

    try {
      const updatedCollection = await collectionService.removeContributorsFromCollection(collection.id, [
        uid,
      ]);
      const rows = await collectionService.getCollectionContributors(collection.id).catch(() => null);
      setCollection({
        ...updatedCollection,
        contributors: rows ?? updatedCollection.contributors ?? [],
      });

      showToast("Thành công", "Đã xóa người đóng góp.", "success");
    } catch (error) {
      console.error("Remove contributor failed:", error);
      showToast("Lỗi", error.message || "Xóa người đóng góp không thành công.", "error");
    } finally {
      setActionBusy(false);
    }
  };

  const renderCollectionMeta = () => {
    if (!collection) return null;

    return (
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Views */}
        <PropertyChip 
          label="Lượt xem (tuần)" 
          value={collection.views?.weekly_views ?? 0} 
        />
        <PropertyChip 
          label="Lượt xem (tổng)" 
          value={collection.views?.total_views ?? 0} 
        />
        
        {/* Contributors */}
        <PropertyChip 
          label="Người đóng góp" 
          value={collection.contributors?.length ?? 0} 
        />
        
        {/* Saves */}
        <PropertyChip 
          label="Lượt lưu" 
          value={collection.saved_count ?? 0} 
        />
        
        {/* Places */}
        <PropertyChip 
          label="Số địa điểm" 
          value={collection.place_count ?? collection.places?.length ?? 0} 
        />
        
        {/* Visibility */}
        <PropertyChip 
          label="Trạng thái" 
          value={String(collection.visibility || 'public').toUpperCase()} 
        />
      </div>
    );
  };

  const renderPlacesPagination = () => {
    const totalPlaces = getTotalPlaces();
    const totalPages = Math.ceil(totalPlaces / PLACES_PER_PAGE);

    if (totalPages <= 1) {
      return null;
    }

    return (
      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setPlacesPage(prev => Math.max(1, prev - 1))}
          disabled={placesPage === 1 || placesLoading}
          className="inline-flex items-center gap-2 rounded-full border border-outline-variant/70 bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name="chevron_left" size={18} />
          Trước
        </button>

        <span className="text-sm text-on-surface-variant">
          Trang {placesPage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => setPlacesPage(prev => Math.min(totalPages, prev + 1))}
          disabled={placesPage === totalPages || placesLoading}
          className="inline-flex items-center gap-2 rounded-full border border-outline-variant/70 bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sau
          <Icon name="chevron_right" size={18} />
        </button>
      </div>
    );
  };

  const renderPlacesList = (isEditMode) => {
    if (placesLoading) {
      return (
        <div className="flex items-center justify-center py-10">
          <div className="flex items-center gap-3 text-on-surface-variant">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm">Đang tải địa điểm...</span>
          </div>
        </div>
      );
    }

    if (placesError) {
      return (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">Lỗi</p>
          <p>{placesError}</p>
        </div>
      );
    }

    if (getTotalPlaces() === 0) {
      return (
        <div className="rounded-3xl border border-dashed border-outline-variant/40 bg-surface-container py-10 text-center text-sm text-on-surface-variant">
          Collection chưa có địa điểm nào
        </div>
      );
    }

    return (
      <>
        {visiblePlaces.map((place) => (
          <PlaceListItem
            key={place.place_id}
            place={place}
            onViewDetails={setSelectedPlace}
            isEditMode={isEditMode}
            onRemove={isEditMode ? handleRemovePlace : undefined}
          />
        ))}
        {renderPlacesPagination()}
      </>
    );
  };

  // Task 4: Render Places Tab Content
  // Requirements: REQ-3 (Places Tab Content), REQ-6 (Edit Mode Behavior Across Tabs), REQ-8 (Backward Compatibility)
  const renderPlacesTab = () => {
    if (isEditing) {
      // Task 5: Edit Mode - Show places list with add place form and remove buttons using PlaceListItem
      // Requirements: REQ-5 (Edit Mode Behavior), REQ-6 (Edit Mode Across Tabs)
      return (
        <div className="grid gap-6">
          <SectionCard
            title="Quản lý địa điểm"
            description="Thêm hoặc xóa địa điểm trong collection."
          >
            <div className="grid gap-4">
              {/* Add Hotel Form */}
              <HotelSuggestionAutocomplete
                onSelect={handleHotelSelect}
                placeholder="Tìm kiếm khách sạn..."
                disabled={actionBusy}
              />

              {/* Task 5.2: Places List with PlaceListItem components in edit mode */}
              <div className="space-y-3">
                {renderPlacesList(true)}
              </div>
            </div>
          </SectionCard>
        </div>
      );
    } else {
      // View Mode: Show places list using PlaceListItem components
      // Task 4: Update renderPlacesTab for View Mode
      // Requirements: REQ-2 (Display Compact Place List), REQ-3 (Expand Place Card on Click), REQ-4 (Load Places Data on Tab Navigation)
      return (
        <div className="grid gap-6">
          <SectionCard
            title="Địa điểm trong collection"
            description={`${getTotalPlaces()} địa điểm trong collection.`}
          >
            <div className="space-y-3">
              {renderPlacesList(false)}
            </div>
          </SectionCard>
        </div>
      );
    }
  };

  // Task 5: Render Contributors Tab Content
  // Requirements: REQ-4 (Contributors Tab Content), REQ-6 (Edit Mode Behavior Across Tabs), REQ-8 (Backward Compatibility)
  // Task 10.1: Integrated UserSuggestionAutocomplete component
  // Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
  const renderContributorsTab = () => {
    if (isEditing && isOwner) {
      // Edit Mode (Owner Only): Show add/remove controls with UserSuggestionAutocomplete
      return (
        <div className="grid gap-6">
          <SectionCard
            title="Quản lý người đóng góp"
            description="Chỉ chủ sở hữu collection mới có thể thêm hoặc xóa người đóng góp."
          >
            <div className="grid gap-4">
              {/* UserSuggestionAutocomplete Component (Requirement 15.1) */}
              <UserSuggestionAutocomplete
                onSelect={handleAddContributor}
                placeholder="Tìm kiếm người dùng để thêm vào collection..."
                disabled={actionBusy}
                ariaLabel="Tìm kiếm người dùng để thêm vào collection"
              />

              {/* Current Contributors List (Requirement 15.5) */}
              <div className="space-y-3">
                {collection.contributors?.length ? (
                  collection.contributors.map((contributor) => {
                    // Handle both owner_uid (string) and owner.uid (object) formats
                    const ownerUid = collection.owner_uid || collection.owner?.uid;
                    const isOwnerRow = contributor.uid === ownerUid;
                    const displayLabel =
                      contributor.display_name || contributor.username || contributor.uid;

                    return (
                      <div key={contributor.uid} className="flex flex-col gap-2 rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Avatar (Requirement 15.5) */}
                          {contributor.avatar_url ? (
                            <img 
                              src={contributor.avatar_url} 
                              alt={`${displayLabel} avatar`}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-medium flex-shrink-0">
                              {(contributor.username || contributor.uid).charAt(0).toUpperCase()}
                            </div>
                          )}
                          
                          {/* User Info */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-sm font-semibold text-on-surface truncate">{displayLabel}</p>
                            <p className="text-xs text-on-surface-variant font-mono truncate">@{contributor.username || contributor.uid}</p>
                            <p className="text-xs text-on-surface-variant truncate">
                              Đóng góp: {contributor.contributed_count || 0} · Tham gia: {formatDate(contributor.joined_at)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Remove Button or Owner Badge (Requirement 15.5) */}
                        {isOwnerRow ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
                            Owner
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemoveContributor(contributor.uid)}
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
                    Chưa có người đóng góp nào
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
        </div>
      );
    } else {
      // View Mode or Edit Mode (Non-Owner): Show read-only list
      return (
        <div className="grid gap-6">
          <SectionCard
            title="Người đóng góp"
            description="Danh sách người đóng góp hiện tại của collection."
          >
            <div className="space-y-3">
              {collection.contributors?.length ? (
                collection.contributors.map((contributor) => {
                  const displayLabel =
                    contributor.display_name || contributor.username || contributor.uid;
                  return (
                  <div key={contributor.uid} className="flex items-center gap-3 rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-3">
                    {/* Avatar */}
                    {contributor.avatar_url ? (
                      <img 
                        src={contributor.avatar_url} 
                        alt={`${displayLabel} avatar`}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-medium flex-shrink-0">
                        {(contributor.username || contributor.uid).charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-on-surface truncate">{displayLabel}</p>
                      <p className="text-xs text-on-surface-variant font-mono truncate">@{contributor.username || contributor.uid}</p>
                      <p className="text-xs text-on-surface-variant truncate">
                        Đóng góp: {contributor.contributed_count || 0} · Tham gia: {formatDate(contributor.joined_at)}
                      </p>
                    </div>
                  </div>
                  );
                })
              ) : (
                <div className="rounded-3xl border border-dashed border-outline-variant/40 bg-surface-container py-10 text-center text-sm text-on-surface-variant">
                  Chưa có người đóng góp nào
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      );
    }
  };

  // Task 6: Render Tab Content with Switch Statement
  // Requirements: REQ-5 (Tab State Management), REQ-6 (Edit Mode Behavior Across Tabs)
  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return renderInfoTab();
      case 'places':
        return renderPlacesTab();
      case 'contributors':
        return renderContributorsTab();
      case 'savers':
        return renderSaversTab();
      default:
        // Default to Info tab if invalid tab value
        return renderInfoTab();
    }
  };

  // Render Savers Tab Content
  const renderSaversTab = () => {
    // Calculate pagination
    const totalSavers = collection?.saved_count || 0;
    const totalPages = Math.ceil(totalSavers / SAVERS_PER_PAGE);
    const startIndex = (saversPage - 1) * SAVERS_PER_PAGE;
    const endIndex = startIndex + SAVERS_PER_PAGE;
    const currentSavers = savers.slice(startIndex, endIndex);

    return (
      <div className="grid gap-6">
        <SectionCard
          title="Người đã lưu"
          description={`${totalSavers} người dùng đã lưu collection này.`}
        >
          <div className="space-y-3">
            {saversLoading ? (
              <div className="rounded-3xl border border-dashed border-outline-variant/40 bg-surface-container py-10 text-center text-sm text-on-surface-variant">
                <Icon name="hourglass_top" size={24} className="text-primary animate-spin mx-auto mb-2" />
                Đang tải...
              </div>
            ) : currentSavers.length ? (
              <>
                {currentSavers.map((saver) => {
                  const displayLabel = saver.display_name || saver.username || saver.uid;
                  return (
                    <div key={saver.uid} className="flex items-center gap-3 rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-3">
                      {/* Avatar */}
                      {saver.avatar_url ? (
                        <img 
                          src={saver.avatar_url} 
                          alt={`${displayLabel} avatar`}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-medium flex-shrink-0">
                          {(saver.username || saver.uid).charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-on-surface truncate">{displayLabel}</p>
                        <p className="text-xs text-on-surface-variant font-mono truncate">@{saver.username || saver.uid}</p>
                        <p className="text-xs text-on-surface-variant truncate">
                          Đã lưu: {formatDate(saver.saved_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setSaversPage(prev => Math.max(1, prev - 1))}
                      disabled={saversPage === 1}
                      className="inline-flex items-center gap-2 rounded-full border border-outline-variant/70 bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icon name="chevron_left" size={18} />
                      Trước
                    </button>
                    
                    <span className="text-sm text-on-surface-variant">
                      Trang {saversPage} / {totalPages}
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => setSaversPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={saversPage === totalPages}
                      className="inline-flex items-center gap-2 rounded-full border border-outline-variant/70 bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                      <Icon name="chevron_right" size={18} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-outline-variant/40 bg-surface-container py-10 text-center text-sm text-on-surface-variant">
                Chưa có ai lưu collection này
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    );
  };

  // Task 3: Render Info Tab Content
  // Requirements: REQ-2 (Info Tab Content), REQ-6 (Edit Mode Behavior Across Tabs), REQ-8 (Backward Compatibility)
  const renderInfoTab = () => {
    if (isEditing) {
      // Edit Mode: Show collection info form, tags management, and summary
      return (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-6">
            {/* Collection Info Form */}
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

            {/* Tags Management Section */}
            {!isCreateMode && (
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
            )}
          </div>

          {/* Summary Card */}
          <div className="grid gap-6">
            <SectionCard
              title="Tóm tắt"
              description="Thông tin nhanh của collection."
            >
              <div className="grid gap-3">
                {!isCreateMode && (
                  <>
                    {/* Owner Info */}
                    <div className="rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-4">
                      <p className="font-semibold text-on-surface mb-3">Chủ sở hữu</p>
                      <div className="flex items-center gap-3">
                        {collection.owner?.avatar_url ? (
                          <img 
                            src={collection.owner.avatar_url} 
                            alt={collection.owner.display_name || collection.owner.username}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-medium flex-shrink-0">
                            {(collection.owner?.username || collection.owner_uid || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-on-surface truncate">
                            {collection.owner?.display_name || collection.owner?.username || collection.owner_uid || 'N/A'}
                          </p>
                          {collection.owner?.username && (
                            <p className="text-xs text-on-surface-variant truncate">
                              @{collection.owner.username}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Created and Updated dates side by side */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-4 text-sm text-on-surface">
                        <p className="font-semibold text-on-surface">Ngày tạo</p>
                        <p className="mt-1 text-sm text-on-surface-variant">{formatDate(collection.created_at)}</p>
                      </div>
                      <div className="rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-4 text-sm text-on-surface">
                        <p className="font-semibold text-on-surface">Cập nhật lần cuối</p>
                        <p className="mt-1 text-sm text-on-surface-variant">{formatDate(collection.updated_at)}</p>
                      </div>
                    </div>
                  </>
                )}
                {isCreateMode && (
                  <div className="rounded-3xl border border-primary/20 bg-primary/5 px-4 py-4 text-sm">
                    <p className="font-semibold text-primary">Chế độ tạo mới</p>
                    <p className="mt-1 text-xs text-on-surface-variant">Điền thông tin cơ bản và bấm "Tạo bộ sưu tập"</p>
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      );
    } else {
      // View Mode: Show collection metadata, tags display, and summary
      return (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-6">
            {/* Collection Metadata */}
            <SectionCard
              title="Thông tin collection"
              description="Thông tin cơ bản của bộ sưu tập."
            >
              {renderCollectionMeta()}
            </SectionCard>

            {/* Tags Display */}
            <SectionCard
              title="Thẻ tags"
              description="Các tag của collection."
            >
              <div className="flex flex-wrap gap-2">
                {collection.tags?.length ? (
                  collection.tags.map((tag) => (
                    <TagPill key={tag} tag={tag} removable={false} onRemove={() => {}} />
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant">Collection chưa có tag.</p>
                )}
              </div>
            </SectionCard>
          </div>

          {/* Summary Card */}
          <div className="grid gap-6">
            <SectionCard
              title="Tóm tắt"
              description="Thông tin nhanh của collection."
            >
              <div className="grid gap-3">
                {/* Owner Info */}
                <div className="rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-4">
                  <p className="font-semibold text-on-surface mb-3">Chủ sở hữu</p>
                  <div className="flex items-center gap-3">
                    {collection.owner?.avatar_url ? (
                      <img 
                        src={collection.owner.avatar_url} 
                        alt={collection.owner.display_name || collection.owner.username}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-medium flex-shrink-0">
                        {(collection.owner?.username || collection.owner_uid || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">
                        {collection.owner?.display_name || collection.owner?.username || collection.owner_uid || 'N/A'}
                      </p>
                      {collection.owner?.username && (
                        <p className="text-xs text-on-surface-variant truncate">
                          @{collection.owner.username}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Created and Updated dates side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-4 text-sm text-on-surface">
                    <p className="font-semibold text-on-surface">Ngày tạo</p>
                    <p className="mt-1 text-sm text-on-surface-variant">{formatDate(collection.created_at)}</p>
                  </div>
                  <div className="rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-4 text-sm text-on-surface">
                    <p className="font-semibold text-on-surface">Cập nhật lần cuối</p>
                    <p className="mt-1 text-sm text-on-surface-variant">{formatDate(collection.updated_at)}</p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      );
    }
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

      {selectedPlace && (
        <PlaceDetailModal
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      )}

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
            const returnMyTab = location.state?.returnMyTab;
            if (returnTab) {
              const params = new URLSearchParams({ tab: returnTab });
              if (
                returnTab === 'my' &&
                returnMyTab &&
                ['owned', 'contributing', 'saved'].includes(returnMyTab)
              ) {
                params.set('myTab', returnMyTab);
              }
              navigate(`/collections?${params.toString()}`, { state: { fromCollection: true } });
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
                  <p className="max-w-3xl text-sm leading-7 text-on-surface-variant">{collection?.description || "Collection chưa có mô tả."}</p>
                )}
              </div>

              {isEditing && !isCreateMode ? renderCollectionMeta() : null}
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-end">
              {!isCreateMode && <span className="text-sm text-on-surface-variant">Owner: {collection.owner_uid || collection.owner?.uid || 'N/A'}</span>}
              
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
              
              {/* Edit button - only show for owner or contributor when not editing and not in create mode */}
              {!isEditing && canEdit && !isCreateMode && (
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

          {/* Tab Navigation Bar - Task 7: Responsive Design and Mobile Support */}
          {/* Requirements: REQ-1 (Tab Navigation System), REQ-7 (Responsive Tab Navigation), REQ-9 (UI Consistency) */}
          {!isCreateMode && (
            <div 
              role="tablist" 
              aria-label="Collection navigation"
              className="flex gap-2 border-b border-outline-variant/30 overflow-x-auto scrollbar-hide -webkit-overflow-scrolling-touch"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`${tab.id}-panel`}
                  aria-label={tab.ariaLabel}
                  id={`${tab.id}-tab`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
                  className={`
                    relative inline-flex items-center justify-center gap-2 
                    px-6 py-3
                    text-sm font-semibold
                    transition-colors
                    bg-transparent border-0 outline-none 
                    focus:outline-none focus:ring-0 focus:border-0 
                    active:outline-none active:ring-0 active:border-0
                    whitespace-nowrap
                    touch-manipulation
                    flex-shrink-0
                    ${activeTab === tab.id 
                      ? 'text-primary' 
                      : 'text-on-surface-variant hover:text-on-surface'
                    }
                  `}
                  style={{ 
                    minHeight: '44px', 
                    minWidth: '44px',
                    touchAction: 'manipulation',
                    boxShadow: 'none'
                  }}
                >
                  <Icon name={tab.icon} size={20} aria-hidden="true" />
                  <span className="text-sm">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Tab Content Area with ARIA attributes - Task 6 Complete */}
          <div
            role="tabpanel"
            id={`${activeTab}-panel`}
            aria-labelledby={`${activeTab}-tab`}
          >
            {/* Render content using renderTabContent() function with switch statement */}
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CollectionPage;
