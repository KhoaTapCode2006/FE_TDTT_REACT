import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import CollectionCard from '@/components/collection/CollectionCard';
import { collectionService } from '@/services/backend/collection.service';
import { viewsService } from '@/services/backend/views.service';
import { likedCollectionsService } from '@/services/profile/likedCollections.service';
import { useAuth } from '@/contexts/AuthContext';

const VALID_MAIN_TABS = ['my', 'global'];
const VALID_MY_SUB_TABS = ['owned', 'contributing', 'saved'];

/** Parse GET /views/top style payload into an array of collections */
function collectionsFromTopViewsBody(body) {
  if (!body) return [];
  const d = body.data;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.items)) return d.items;
  if (Array.isArray(body.items)) return body.items;
  return [];
}

function withOwnerUid(collection) {
  if (!collection || typeof collection !== 'object') return collection;
  const ownerUid = collection.owner?.uid ?? collection.owner_uid;
  return { ...collection, owner_uid: ownerUid ?? collection.owner_uid };
}

/**
 * Two main tabs: My Collections | Global Collections.
 * Inside My Collections: three sub-tabs (owned / contributing / saved) → three /me/* APIs.
 */
function CollectionsDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const rawMainTab = searchParams.get('tab');
  const rawMySubTab = searchParams.get('myTab');

  const mainTab = VALID_MAIN_TABS.includes(rawMainTab) ? rawMainTab : 'my';
  const mySubTab =
    mainTab === 'my' && VALID_MY_SUB_TABS.includes(rawMySubTab) ? rawMySubTab : 'owned';

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'contributing' || t === 'saved') {
      setSearchParams(
        { tab: 'my', myTab: t === 'contributing' ? 'contributing' : 'saved' },
        { replace: true }
      );
      return;
    }
    if (t != null && !VALID_MAIN_TABS.includes(t)) {
      setSearchParams({ tab: 'my', myTab: 'owned' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const [myCollections, setMyCollections] = useState([]);
  const [contributingCollections, setContributingCollections] = useState([]);
  const [savedCollections, setSavedCollections] = useState([]);
  const [globalCollections, setGlobalCollections] = useState([]);
  const [savedCollectionIds, setSavedCollectionIds] = useState(new Set());

  const [loadingMy, setLoadingMy] = useState(false);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const [topType, setTopType] = useState('all_time');
  const [globalPage, setGlobalPage] = useState(1);
  const [hasMoreGlobal, setHasMoreGlobal] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const hasAnyMyData =
    myCollections.length > 0 ||
    contributingCollections.length > 0 ||
    savedCollections.length > 0;

  const loadMySection = useCallback(async () => {
    if (!user) {
      setMyCollections([]);
      setContributingCollections([]);
      setSavedCollections([]);
      setSavedCollectionIds(new Set());
      setLoadingMy(false);
      return;
    }

    try {
      setLoadingMy(true);
      setError(null);

      // Only load data for the active sub-tab to improve performance
      if (mySubTab === 'owned') {
        const owned = await collectionService.getMyOwnedCollections();
        setMyCollections(owned || []);
      } else if (mySubTab === 'contributing') {
        const contributing = await collectionService.getContributingCollections();
        setContributingCollections(contributing || []);
      } else if (mySubTab === 'saved') {
        const saved = await collectionService.getSavedCollections();
        // Filter out own collections from saved list - only show collections from other users
        const filteredSaved = (saved || []).filter(c => {
          const ownerUid = c.owner?.uid ?? c.owner_uid;
          return ownerUid !== user?.uid;
        });
        setSavedCollections(filteredSaved);
        setSavedCollectionIds(new Set(filteredSaved.map((c) => c.id)));
      }
    } catch (err) {
      console.error('Failed to load my collections section:', err);
      setError(err.message || 'Failed to load your collections');
    } finally {
      setLoadingMy(false);
    }
  }, [user, mySubTab]);

  const loadGlobalCollections = useCallback(
    async (page = 1, append = false) => {
      try {
        if (!append) {
          setLoadingGlobal(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const limit = 10;
        const response = await viewsService.getTopCollections(topType, limit, page);
        let collections = collectionsFromTopViewsBody(response).map(withOwnerUid);

        if (collections.length < limit && page === 1) {
          try {
            const needed = limit - collections.length;
            const fallbackResponse = await viewsService.getTopCollections('all_time', 50, 1);
            const latestCollections = collectionsFromTopViewsBody(fallbackResponse).map(
              withOwnerUid
            );
            const topViewIds = new Set(collections.map((c) => c.id));
            const additionalCollections = latestCollections
              .filter((c) => !topViewIds.has(c.id))
              .slice(0, needed);
            collections = [...collections, ...additionalCollections];
          } catch (fallbackError) {
            console.error('Failed to load fallback collections:', fallbackError);
          }
        }

        // Client-side sorting to ensure correct order
        // Sort by weekly_views for 'weekly' topType, total_views for 'all_time'
        collections.sort((a, b) => {
          const viewsA = topType === 'weekly' 
            ? (a.views?.weekly_views || 0) 
            : (a.views?.total_views || 0);
          const viewsB = topType === 'weekly' 
            ? (b.views?.weekly_views || 0) 
            : (b.views?.total_views || 0);
          return viewsB - viewsA; // Descending order (highest first)
        });

        if (append) {
          setGlobalCollections((prev) => [...prev, ...collections]);
        } else {
          setGlobalCollections(collections);
        }

        setHasMoreGlobal(collections.length >= limit);
        setGlobalPage(page);

        if (user?.uid) {
          const fromSavers = new Set(
            collections
              .filter((c) => c.savers?.some((s) => s.uid === user.uid))
              .map((c) => c.id)
          );
          setSavedCollectionIds((prev) => {
            const next = new Set(prev);
            fromSavers.forEach((id) => next.add(id));
            return next;
          });
        }
      } catch (err) {
        console.error('Failed to load global collections:', err);
        setError(err.message || 'Failed to load global collections');
      } finally {
        setLoadingGlobal(false);
        setLoadingMore(false);
      }
    },
    [topType, user]
  );

  useEffect(() => {
    if (mainTab !== 'my' || !user) return;
    const timer = setTimeout(() => loadMySection(), 50);
    return () => clearTimeout(timer);
  }, [user, mainTab, location.key, loadMySection]);

  useEffect(() => {
    if (mainTab !== 'global') return;
    const timer = setTimeout(() => loadGlobalCollections(1, false), 50);
    return () => clearTimeout(timer);
  }, [mainTab, topType, location.key, loadGlobalCollections]);

  const setMainTabParams = (nextMain) => {
    setError(null);
    const p = new URLSearchParams(searchParams);
    p.set('tab', nextMain);
    if (nextMain === 'global') {
      p.delete('myTab');
    } else {
      const cur = p.get('myTab');
      if (!VALID_MY_SUB_TABS.includes(cur)) {
        p.set('myTab', 'owned');
      }
    }
    setSearchParams(p);
  };

  const setMySubTabParams = (sub) => {
    setError(null);
    const p = new URLSearchParams(searchParams);
    p.set('tab', 'my');
    p.set('myTab', sub);
    setSearchParams(p);
  };

  const refreshSavedCollections = useCallback(async () => {
    if (!user) return;
    try {
      const saved = await collectionService.getSavedCollections();
      // Filter out own collections from saved list - only show collections from other users
      const filteredSaved = (saved || []).filter(c => {
        const ownerUid = c.owner?.uid ?? c.owner_uid;
        return ownerUid !== user?.uid;
      });
      setSavedCollections(filteredSaved);
      setSavedCollectionIds(new Set(filteredSaved.map((c) => c.id)));
    } catch (e) {
      console.error('Failed to refresh saved collections:', e);
    }
  }, [user]);

  const handleDeleteCollection = async (collectionId) => {
    setActionLoading(true);
    try {
      await collectionService.deleteCollection(collectionId);
      setMyCollections((prev) => prev.filter((c) => c.id !== collectionId));
      alert('Collection deleted successfully!');
    } catch (err) {
      console.error('Failed to delete collection:', err);
      alert(`Failed to delete collection: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCollection = async (collectionId, shouldSave) => {
    if (!user) {
      alert('Vui lòng đăng nhập để lưu collection.');
      return;
    }

    setActionLoading(true);
    try {
      if (shouldSave) {
        await collectionService.saveCollection(collectionId);
        setSavedCollectionIds((prev) => new Set([...prev, collectionId]));
      } else {
        await collectionService.unsaveCollection(collectionId);
        setSavedCollectionIds((prev) => {
          const next = new Set(prev);
          next.delete(collectionId);
          return next;
        });
      }

      setContributingCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId
            ? {
                ...c,
                saved_count: Math.max(0, (c.saved_count || 0) + (shouldSave ? 1 : -1)),
              }
            : c
        )
      );

      setGlobalCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId
            ? {
                ...c,
                saved_count: Math.max(0, (c.saved_count || 0) + (shouldSave ? 1 : -1)),
              }
            : c
        )
      );

      await refreshSavedCollections();
    } catch (err) {
      console.error('Failed to save/unsave collection:', err);

      if (err.statusCode === 400) {
        alert(err.message || 'Thao tác không thành công.');
      } else if (err.statusCode === 403) {
        alert(err.message || 'Bạn không có quyền thực hiện thao tác này.');
      } else if (err.statusCode === 404) {
        alert('Collection không tồn tại.');
      } else if (
        err.code === 'NETWORK_ERROR' ||
        err.message?.includes('network') ||
        err.message?.includes('Network')
      ) {
        alert('Không thể kết nối. Vui lòng thử lại.');
      } else {
        alert(`Không thể ${shouldSave ? 'lưu' : 'bỏ lưu'} collection. Vui lòng thử lại.`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMoreGlobal) {
      loadGlobalCollections(globalPage + 1, true);
    }
  };

  const handleTopTypeChange = (newTopType) => {
    setTopType(newTopType);
    setGlobalPage(1);
  };

  const handleCreateCollection = () => {
    navigate('/collections/new');
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-background">
        <div className="inline-flex items-center gap-3 rounded-3xl border border-outline-variant/40 bg-surface-container-low px-6 py-5 shadow-xl">
          <Icon name="hourglass_top" size={24} className="text-primary animate-spin" />
          <span className="text-sm font-medium text-on-surface">Đang tải...</span>
        </div>
      </div>
    );
  }

  const showFullPageLoad =
    (mainTab === 'my' && user && loadingMy && !hasAnyMyData) ||
    (mainTab === 'global' && loadingGlobal && globalCollections.length === 0);

  if (showFullPageLoad) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-background">
        <div className="inline-flex items-center gap-3 rounded-3xl border border-outline-variant/40 bg-surface-container-low px-6 py-5 shadow-xl">
          <Icon name="hourglass_top" size={24} className="text-primary animate-spin" />
          <span className="text-sm font-medium text-on-surface">Đang tải bộ sưu tập...</span>
        </div>
      </div>
    );
  }

  const currentCollections =
    mainTab === 'global'
      ? globalCollections
      : mySubTab === 'owned'
        ? myCollections
        : mySubTab === 'contributing'
          ? contributingCollections
          : savedCollections;

  const sectionLoading = mainTab === 'my' ? loadingMy : loadingGlobal;

  const pageTitle =
    mainTab === 'global' ? 'Bộ sưu tập toàn cầu' : 'Bộ sưu tập của tôi';

  const pageSubtitle =
    mainTab === 'global'
      ? 'Khám phá và lưu bộ sưu tập từ cộng đồng'
      : 'Bộ sưu tập của bạn, cộng tác và đã lưu';

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-on-surface">{pageTitle}</h1>
            <p className="mt-2 text-sm text-on-surface-variant">{pageSubtitle}</p>
          </div>

          {mainTab === 'my' && mySubTab === 'owned' && user && (
            <button
              type="button"
              onClick={handleCreateCollection}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
            >
              <Icon name="add" size={20} />
              Tạo bộ sưu tập
            </button>
          )}
        </div>

        {/* Main tabs */}
        <div className="flex flex-wrap gap-2 border-b-2 border-outline-variant/40">
          <button
            type="button"
            onClick={() => setMainTabParams('my')}
            className={`relative px-6 py-3.5 text-sm font-bold transition-colors bg-transparent border-0 outline-none ${
              mainTab === 'my' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon name="collections_bookmark" size={22} />
              Bộ sưu tập của tôi
            </div>
            {mainTab === 'my' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMainTabParams('global')}
            className={`relative px-6 py-3.5 text-sm font-bold transition-colors bg-transparent border-0 outline-none ${
              mainTab === 'global' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon name="public" size={22} />
              Bộ sưu tập toàn cầu
            </div>
            {mainTab === 'global' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
            )}
          </button>
        </div>

        {/* Sub-tabs (only under My Collections) */}
        {mainTab === 'my' && (
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/60 p-2">
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'owned', label: 'Của tôi', icon: 'person' },
                { id: 'contributing', label: 'Đóng góp', icon: 'group' },
                { id: 'saved', label: 'Đã lưu', icon: 'bookmark' },
              ].map(({ id, label, icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMySubTabParams(id)}
                  className={`relative flex-1 min-w-[120px] rounded-xl px-4 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
                    mySubTab === id
                      ? 'bg-primary text-white shadow-md'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Icon name={icon} size={18} />
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {mainTab === 'global' && (
          <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30">
            <Icon name="filter_list" size={20} className="text-on-surface-variant" />
            <span className="text-sm font-medium text-on-surface-variant">Hiển thị:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleTopTypeChange('all_time')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  topType === 'all_time'
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                Thịnh hành nhất
              </button>
              <button
                type="button"
                onClick={() => handleTopTypeChange('weekly')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  topType === 'weekly'
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                Xu hướng tuần
              </button>
            </div>
          </div>
        )}

        {mainTab === 'my' && !user && (
          <div className="rounded-3xl border border-outline-variant/40 bg-surface-container-low p-6 text-center text-sm text-on-surface-variant">
            Đăng nhập để xem collection của bạn, contributing và đã lưu.
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-400/20 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <Icon name="error" size={24} className="text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-800">Lỗi khi tải bộ sưu tập</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {sectionLoading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="hourglass_top" size={32} className="text-primary animate-spin" />
          </div>
        ) : mainTab === 'my' && !user ? null : currentCollections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="rounded-full bg-surface-container p-6 mb-4">
              <Icon
                name={
                  mainTab === 'global'
                    ? 'public'
                    : mySubTab === 'owned'
                      ? 'collections_bookmark'
                      : mySubTab === 'contributing'
                        ? 'group'
                        : 'bookmark'
                }
                size={48}
                className="text-on-surface-variant"
              />
            </div>
            <h3 className="text-xl font-semibold text-on-surface mb-2">
              {mainTab === 'global'
                ? 'Chưa có bộ sưu tập công khai'
                : mySubTab === 'owned'
                  ? 'Chưa có bộ sưu tập'
                  : mySubTab === 'contributing'
                    ? 'Chưa có bộ sưu tập cộng tác'
                    : 'Chưa có bộ sưu tập đã lưu'}
            </h3>
            <p className="text-sm text-on-surface-variant text-center max-w-md mb-6">
              {mainTab === 'global'
                ? 'Quay lại sau để xem bộ sưu tập từ cộng đồng'
                : mySubTab === 'owned'
                  ? 'Tạo bộ sưu tập đầu tiên để bắt đầu sắp xếp các địa điểm yêu thích'
                  : mySubTab === 'contributing'
                    ? 'Khi bạn cộng tác trong một bộ sưu tập, nó sẽ xuất hiện ở đây'
                    : 'Lưu bộ sưu tập từ Toàn cầu để xem chúng ở đây'}
            </p>
            {mainTab === 'my' && mySubTab === 'owned' && user && (
              <button
                type="button"
                onClick={handleCreateCollection}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90"
              >
                <Icon name="add" size={20} />
                Tạo bộ sưu tập đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {currentCollections.map((collection) => {
              const isCardOwner = user?.uid && collection.owner_uid === user.uid;
              const returnMyTab =
                mainTab === 'my'
                  ? mySubTab
                  : undefined;

              return (
                <CollectionCard
                  key={`${mainTab}-${mySubTab}-${collection.id}`}
                  collection={collection}
                  isOwner={isCardOwner}
                  onDelete={isCardOwner ? handleDeleteCollection : undefined}
                  {...((mainTab === 'global' ||
                    mySubTab === 'contributing' ||
                    mySubTab === 'saved') && {
                    onSave: handleSaveCollection,
                    isSaved: savedCollectionIds.has(collection.id),
                  })}
                  showActions
                  returnTab={mainTab}
                  returnMyTab={returnMyTab}
                  currentUserId={user?.uid}
                  showWeeklyViews={mainTab === 'global' && topType === 'weekly'}
                  showVisibilityBadge={mainTab === 'my'}
                />
              );
            })}
          </div>
        )}

        {mainTab === 'global' &&
          !sectionLoading &&
          currentCollections.length > 0 &&
          hasMoreGlobal && (
            <div className="flex justify-center mt-8">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <>
                    <Icon name="hourglass_top" size={20} className="animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  <>
                    <Icon name="expand_more" size={20} />
                    Xem thêm
                  </>
                )}
              </button>
            </div>
          )}

        {actionLoading && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="rounded-3xl bg-surface-container-low px-6 py-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <Icon name="hourglass_top" size={24} className="text-primary animate-spin" />
                <span className="text-sm font-medium text-on-surface">Đang xử lý...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CollectionsDashboard;
