import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import { collectionService } from "../services/backend/collection.service";

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

const getCurrentUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return JSON.parse(window.localStorage.getItem("currentUser") || "null");
  } catch {
    return null;
  }
};

function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div className="fixed right-4 top-4 z-50 max-w-sm">
      <div className={`rounded-2xl px-4 py-3 shadow-2xl shadow-slate-900/20 ${STATUS_TYPES[toast.type] || STATUS_TYPES.info}`}>
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
    <div className="rounded-full border border-outline-variant/50 bg-surface-container px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
      {label}: {value}
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
  const [collection, setCollection] = useState(null);
  const [editValues, setEditValues] = useState({ name: "", description: "", visibility: "public", thumbnail_url: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [pageBusy, setPageBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [pageError, setPageError] = useState(null);
  const [placeInput, setPlaceInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [collaboratorInput, setCollaboratorInput] = useState("");
  const [toast, setToast] = useState(null);

//   const currentUser = useMemo(() => getCurrentUser(), []);
  const currentUser = { uid: "uid_huy_001", name: "Gia Huy" };    
  const isOwner = useMemo(() => {
    return collection && currentUser?.uid && collection.owner_uid === currentUser.uid;
  }, [collection, currentUser]);

  const isCollaborator = useMemo(() => {
    return (
      collection &&
      currentUser?.uid &&
      collection.collaborators?.some((collaborator) => collaborator.uid === currentUser.uid)
    );
  }, [collection, currentUser]);

  const canEdit = isOwner || isCollaborator;

  const showToast = useCallback((title, message, type = "info") => {
    setToast({ title, message, type });
    window.setTimeout(() => setToast(null), 3300);
  }, []);

  const loadCollection = useCallback(async () => {
    setPageBusy(true);
    setPageError(null);

    try {
      // const result = await collectionService.getCollection(collectionId);
      // setCollection(result);
      setCollection(prev => ({ ...prev, ...editValues }));
      setEditValues({
        name: result?.name || "",
        description: result?.description || "",
        visibility: result?.visibility || "public",
        thumbnail_url: result?.thumbnail_url || "",
      });
    } catch (error) {
      console.error("Failed to load collection:", error);
      setPageError("Không thể tải collection. Vui lòng thử lại sau.");
    } finally {
      setPageBusy(false);
    }
  }, [collectionId]);

//   useEffect(() => {
//     loadCollection();
//   }, [loadCollection]);

//   const handleStartEdit = () => {
//     setIsEditing(true);
//   };
    useEffect(() => {
        // Hàm gọi mock data
        const fetchMockData = async () => {
        // 1. Dùng setPageBusy đã khai báo ở trên thay vì setLoading
        setPageBusy(true); 

        try {
            // 2. Fetch file JSON từ thư mục public
            const response = await fetch('/mockCollection.json');
            const data = await response.json();
            
            // Giả lập trễ mạng
            setTimeout(() => {
            // 3. Cập nhật dữ liệu vào state đã có
            setCollection(data);
            
            // 4. Mẹo nhỏ: Cập nhật luôn form Edit để mốt bấm nút Edit nó có sẵn chữ
            setEditValues({
                name: data?.name || "",
                description: data?.description || "",
                visibility: data?.visibility || "public",
                thumbnail_url: data?.thumbnail_url || "",
            });
            
            setPageBusy(false);
            }, 500);

        } catch (error) {
            console.error("Lỗi tải mock data:", error);
            setPageError("Không tìm thấy file mock data.");
            setPageBusy(false);
        }
        };

        fetchMockData();
    }, [collectionId]);
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

    setSaving(true);
    setPageError(null);

    try {
      //const updatedCollection = await collectionService.updateCollection(collection.id, payload);
      // setCollection(updatedCollection);
      setCollection(prev => ({ ...prev, ...editValues }));
      setIsEditing(false);
      showToast("Thành công", "Cập nhật collection đã được lưu.", "success");
    } catch (error) {
      console.error("Error updating collection:", error);
      setPageError("Lưu collection thất bại. Vui lòng thử lại.");
      showToast("Lỗi", "Không thể lưu collection.", "error");
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
    if (collection.places.some((item) => item.place_id === placeId)) {
      showToast("Đã tồn tại", "Địa điểm này đã có trong collection.", "info");
      return;
    }

    setActionBusy(true);
    try {
      const updatedCollection = await collectionService.addPlaces(collection.id, placeId);
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
      // const updatedCollection = await collectionService.removePlaceFromCollection(collection.id, placeId);
      // setCollection(updatedCollection);
      // Xóa thẳng trên giao diện giả
      setCollection(prev => ({
        ...prev,
        places: prev.places.filter(p => p.place_id !== placeId)
      }));
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
    if (collection.tags.includes(tag)) {
      showToast("Đã tồn tại", "Tag này đã có.", "info");
      return;
    }

    setActionBusy(true);
    try {
      const updatedCollection = await collectionService.addTags(collection.id, tag);
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
      //const updatedCollection = await collectionService.removeTagFromCollection(collection.id, tag);
      // setCollection(updatedCollection);

      setCollection(prev => ({ ...prev, ...editValues }));
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
      showToast("Lỗi", "Vui lòng nhập Email hoặc UID.", "error");
      return;
    }

    const collaboratorValue = collaboratorInput.trim();
    if (collection.collaborators.some((item) => item.uid === collaboratorValue || item.username === collaboratorValue)) {
      showToast("Đã tồn tại", "Người này đã là cộng tác viên.", "info");
      return;
    }

    setActionBusy(true);
    try {
      const updatedCollection = await collectionService.addCollaborators(collection.id, collaboratorValue);
      setCollection(updatedCollection);
      setCollaboratorInput("");
      showToast("Thành công", "Đã gửi lời mời cộng tác.", "success");
    } catch (error) {
      console.error("Add collaborator failed:", error);
      showToast("Lỗi", "Không thể thêm cộng tác viên.", "error");
    } finally {
      setActionBusy(false);
    }
  };

  const handleRemoveCollaborator = async (uid) => {
    if (!collection) return;
    setActionBusy(true);

    try {
      // const updatedCollection = await collectionService.removeCollaboratorFromCollection(collection.id, uid);
      // setCollection(updatedCollection);
      setCollection(prev => ({ ...prev, ...editValues }));
      showToast("Thành công", "Đã xóa cộng tác viên.", "success");
    } catch (error) {
      console.error("Remove collaborator failed:", error);
      showToast("Lỗi", "Xóa cộng tác viên không thành công.", "error");
    } finally {
      setActionBusy(false);
    }
  };

  const renderCollectionMeta = () => {
    if (!collection) return null;

    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PropertyChip label="ID" value={collection.id} />
        <PropertyChip label="Trạng thái" value={String(collection.visibility)} />
        <PropertyChip label="Số tag" value={collection.tags?.length ?? 0} />
        <PropertyChip label="Cộng tác viên" value={collection.collaborators?.length ?? 0} />
      </div>
    );
  };

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

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background px-4 py-6 text-on-background sm:px-6 lg:px-10">
      <Toast toast={toast} />

      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <div className="flex flex-col gap-6 rounded-4xl border border-outline-variant/40 bg-surface-container-low p-6 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  <Icon name="collections" size={16} /> Collection
                </span>
                <span className="rounded-full border border-outline-variant/50 bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant">
                  {collection.liked_count ?? 0} lượt thích
                </span>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-semibold text-on-surface">{collection.name}</h1>

                {isEditing ? (
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
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      {collection.tags?.length ? (
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
                    <p className="max-w-3xl text-sm leading-7 text-on-surface-variant">{collection.description || "Collection chưa có mô tả."}</p>
                  </>
                )}
              </div>

              {isEditing ? <div className="flex flex-wrap gap-2">{renderCollectionMeta()}</div> : null}
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-end">
              <span className="text-sm text-on-surface-variant">Owner: {collection.owner_uid}</span>
              {!isEditing && canEdit ? (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="inline-flex items-center gap-2 rounded-full border border-outline-variant/70 bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-high"
                >
                  <Icon name="edit" size={18} /> Chỉnh sửa
                </button>
              ) : null}

              {isEditing ? (
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
                    <Icon name="save" size={18} /> Lưu
                  </button>
                </>
              ) : null}
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
                  description="Chỉnh sửa thông tin cơ bản của bộ sưu tập."
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
                        disabled={!canEdit || actionBusy}
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
                              disabled={!canEdit || actionBusy}
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
                        disabled={!canEdit || actionBusy}
                        className="inline-flex items-center justify-center rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Icon name="tag" size={18} /> Thêm tag
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {collection.tags?.length ? (
                        collection.tags.map((tag) => (
                          <TagPill key={tag} tag={tag} removable={Boolean(canEdit)} onRemove={handleRemoveTag} />
                        ))
                      ) : (
                        <p className="text-sm text-on-surface-variant">Collection chưa có tag.</p>
                      )}
                    </div>
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
                      <p className="mt-1 text-sm text-on-surface-variant">{currentUser?.uid || "Chưa đăng nhập"}</p>
                    </div>
                  </div>
                </SectionCard>

                {isOwner ? (
                  <SectionCard
                    title="Quản lý cộng tác viên"
                    description="Chỉ chủ sở hữu collection mới có thể thêm hoặc xóa cộng tác viên."
                  >
                    <div className="grid gap-4">
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <input
                          value={collaboratorInput}
                          onChange={(event) => setCollaboratorInput(event.target.value)}
                          placeholder="Nhập email hoặc UID"
                          className="w-full rounded-3xl border border-outline-variant/70 bg-surface-container px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary/80"
                        />
                        <button
                          type="button"
                          onClick={handleAddCollaborator}
                          disabled={actionBusy}
                          className="inline-flex items-center justify-center rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Icon name="person_add" size={18} /> Mời cộng tác
                        </button>
                      </div>
                      <div className="space-y-3">
                        {collection.collaborators?.length ? (
                          collection.collaborators.map((collaborator) => (
                            <div key={collaborator.uid} className="flex flex-col gap-2 rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-on-surface">{collaborator.display_name || collaborator.username || collaborator.uid}</p>
                                <p className="text-xs text-on-surface-variant">UID: {collaborator.uid}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveCollaborator(collaborator.uid)}
                                disabled={actionBusy}
                                className="inline-flex items-center gap-2 rounded-full border border-rose-400/80 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Icon name="close" size={16} /> Xóa
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-3xl border border-dashed border-outline-variant/40 bg-surface-container py-10 text-center text-sm text-on-surface-variant">
                            Chưa có cộng tác viên nào.
                          </div>
                        )}
                      </div>
                    </div>
                  </SectionCard>
                ) : (
                  <SectionCard
                    title="Cộng tác viên"
                    description="Danh sách cộng tác viên hiện tại của collection."
                  >
                    <div className="grid gap-3">
                      {collection.collaborators?.length ? (
                        collection.collaborators.map((collaborator) => (
                          <div key={collaborator.uid} className="rounded-3xl border border-outline-variant/50 bg-surface-container px-4 py-3 text-sm text-on-surface">
                            <p className="font-semibold">{collaborator.display_name || collaborator.username || collaborator.uid}</p>
                            <p className="mt-1 text-xs text-on-surface-variant">UID: {collaborator.uid}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-on-surface-variant">Collection hiện không có cộng tác viên.</p>
                      )}
                    </div>
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
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {collection.places?.length ? (
                      collection.places.map((item) => (
                        <div key={item.place_id} className="overflow-hidden rounded-3xl border border-outline-variant/50 bg-surface-container shadow-sm">
                          <div className="h-44 w-full bg-slate-200">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name || item.place_id} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">Không có ảnh</div>
                            )}
                          </div>
                          <div className="space-y-2 p-4">
                            <div>
                              <p className="text-sm font-semibold text-on-surface">{item.name || item.place_id}</p>
                              <p className="text-xs text-on-surface-variant">{item.address || "Địa chỉ chưa có"}</p>
                            </div>
                            {item.rating ? (
                              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                <Icon name="star" size={14} /> {item.rating}
                              </div>
                            ) : null}
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
                          <p className="font-semibold">{collaborator.display_name || collaborator.username || collaborator.uid}</p>
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
                      <p className="mt-1 text-sm text-on-surface-variant">{currentUser?.uid || "Chưa đăng nhập"}</p>
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
