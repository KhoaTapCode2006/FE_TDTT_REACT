import { useEffect, useState } from "react";
import { usePopup } from "../hooks/usePopup";
import styles from "./HotelPopup.module.css";

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconLocation = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IconPool = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M2 12h20M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    <circle cx="12" cy="7" r="2.5" /><path d="M12 9.5v2.5" />
  </svg>
);
const IconSpa = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
    <path d="M12 6c-2 2-2 5 0 7 2-2 2-5 0-7z" />
    <path d="M8 9c2 1 4 3 4 5M16 9c-2 1-4 3-4 5" />
  </svg>
);
const IconWifi = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <circle cx="12" cy="20" r="1" fill="currentColor" />
  </svg>
);
const IconBreakfast = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 10h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <path d="M6 10V7a2 2 0 0 1 2-2h1v5M13 5h3a2 2 0 0 1 2 2v3" />
  </svg>
);
const IconParking = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M6 3h7a4 4 0 1 1 0 8H9v7H6z" />
  </svg>
);
const IconSnow = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 2v20M4.93 6l14.14 12M19.07 6 4.93 18M3 12h18" />
  </svg>
);
const IconPaw = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="8" cy="8" r="2" />
    <circle cx="16" cy="8" r="2" />
    <circle cx="6.5" cy="13" r="2" />
    <circle cx="17.5" cy="13" r="2" />
    <path d="M12 20c2.5 0 4-1.2 4-3s-1.5-3-4-3-4 1.2-4 3 1.5 3 4 3z" />
  </svg>
);
const IconDumbbell = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 10v4M6 9v6M18 9v6M21 10v4M6 12h12" />
  </svg>
);
const IconRoomService = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 12h18M5 12a7 7 0 0 1 14 0M12 8v1" />
    <path d="M4 12v4h16v-4" />
  </svg>
);
const IconKitchen = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 3v9M4 8h4M10 3v9M15 3v18M20 3v18" />
  </svg>
);
const IconShuttle = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="6" width="18" height="10" rx="2" />
    <circle cx="8" cy="18" r="1.5" />
    <circle cx="16" cy="18" r="1.5" />
  </svg>
);
const IconLaundry = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <circle cx="9" cy="7" r="1" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);
const IconAccessible = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="5" r="1.5" />
    <path d="M12 7.5v4l3 2M12 9.5H8M12 11.5l-2 4M13.5 13.5l2.5 4" />
  </svg>
);
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const StarIcon = ({ filled }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const AMENITY_ICONS = {
  pool: <IconPool />,
  spa: <IconSpa />,
  wifi: <IconWifi />,
  breakfast: <IconBreakfast />,
  parking: <IconParking />,
  ac: <IconSnow />,
  pet: <IconPaw />,
  fitness: <IconDumbbell />,
  roomService: <IconRoomService />,
  kitchen: <IconKitchen />,
  shuttle: <IconShuttle />,
  laundry: <IconLaundry />,
  accessible: <IconAccessible />,
};

const resolveAmenity = (amenity) => {
  if (typeof amenity === "string") {
    const normalized = amenity.toLowerCase();
    if (normalized.includes("breakfast")) return { label: amenity, icon: "breakfast" };
    if (normalized.includes("parking")) return { label: amenity, icon: "parking" };
    if (normalized.includes("air conditioning")) return { label: amenity, icon: "ac" };
    if (normalized.includes("pet")) return { label: amenity, icon: "pet" };
    if (normalized.includes("fitness")) return { label: amenity, icon: "fitness" };
    if (normalized.includes("room service")) return { label: amenity, icon: "roomService" };
    if (normalized.includes("kitchen")) return { label: amenity, icon: "kitchen" };
    if (normalized.includes("shuttle")) return { label: amenity, icon: "shuttle" };
    if (normalized.includes("laundry")) return { label: amenity, icon: "laundry" };
    if (normalized.includes("accessible")) return { label: amenity, icon: "accessible" };
    if (normalized.includes("wi-fi") || normalized.includes("wifi")) return { label: amenity, icon: "wifi" };
    return { label: amenity, icon: "wifi" };
  }

  return amenity;
};

const formatPrice = (price) => new Intl.NumberFormat("vi-VN").format(price) + " VND";
const TAB_ITEMS = [
  { id: "overview", label: "Mo ta & Gia" },
  { id: "reviews", label: "Danh gia" },
  { id: "amenities", label: "Tien nghi & Gan day" },
];

export default function HotelPopup() {
  const { isOpen, hotel, close } = usePopup();
  const INITIAL_AMENITIES_VISIBLE = 6;
  const [imgIndex, setImgIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [isAmenitiesExpanded, setIsAmenitiesExpanded] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      setActiveTab("overview");
      setIsAmenitiesExpanded(false);
      setImgIndex(0);
    }
  }, [isOpen, hotel?.name]);

  if (!isOpen || !hotel) return null;

  const prevImg = () => {
    setImgIndex((i) => (i - 1 + hotel.images.length) % hotel.images.length);
    setPanOffset({ x: 0, y: 0 });
  };
  const nextImg = () => {
    setImgIndex((i) => (i + 1) % hotel.images.length);
    setPanOffset({ x: 0, y: 0 });
  };
  const openImageViewer = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setIsImageViewerOpen(true);
  };
  const closeImageViewer = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setIsImageViewerOpen(false);
  };
  const zoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 3));
  const zoomOut = () =>
    setZoomLevel((z) => {
      const nextZoom = Math.max(z - 0.25, 1);
      if (nextZoom === 1) setPanOffset({ x: 0, y: 0 });
      return nextZoom;
    });
  const beginDrag = (event) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: event.clientX - panOffset.x, y: event.clientY - panOffset.y });
  };
  const moveDrag = (event) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPanOffset({
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y,
    });
  };
  const endDrag = () => setIsDragging(false);

  const renderStars = (rating) =>
    [1, 2, 3, 4, 5].map((s) => <StarIcon key={s} filled={s <= Math.round(rating)} />);
  const reviews = hotel.reviews?.length
    ? hotel.reviews
    : [
        {
          author: hotel.latestReview.author,
          content: hotel.latestReview.content,
          raw_star: Math.round(hotel.rating),
        },
      ];
  const amenitiesToRender = isAmenitiesExpanded
    ? hotel.amenities
    : hotel.amenities.slice(0, INITIAL_AMENITIES_VISIBLE);
  const shouldShowAmenitiesToggle = hotel.amenities.length > INITIAL_AMENITIES_VISIBLE;

  return (
    <div className={styles.overlay} onClick={close}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>

        {/* Left: Image gallery */}
        <div className={styles.imageSection}>
          <img
            src={hotel.images[0]}
            alt={`${hotel.name} main`}
            className={styles.hotelImage}
            onClick={() => {
              setImgIndex(0);
              openImageViewer();
            }}
          />
          {hotel.images.length > 1 && (
            <div className={styles.thumbnailList}>
              {hotel.images.slice(1).map((image, index) => {
                const imageIndex = index + 1;
                return (
                  <img
                    key={imageIndex}
                    src={image}
                    alt={`${hotel.name} ${imageIndex + 1}`}
                    className={styles.thumbnailImage}
                    onClick={() => {
                      setImgIndex(imageIndex);
                      openImageViewer();
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Info panel */}
        <div className={styles.infoPanel}>
          <button className={styles.closeBtn} onClick={close}><IconClose /></button>

          <div className={styles.stickyTop}>
            {/* Header */}
            <div className={styles.header}>
              <h2 className={styles.hotelName}>{hotel.name}</h2>
              <div className={styles.ratingRow}>
                <div className={styles.stars}>{renderStars(hotel.rating)}</div>
                <span className={styles.ratingNum}>{hotel.rating}</span>
              </div>
              {hotel.ai_score !== undefined && (
                <p className={styles.aiScore}>AI score: {hotel.ai_score}</p>
              )}
              <div className={styles.address}>
                <IconLocation /><span>{hotel.address}</span>
              </div>
            </div>

            <div className={styles.tabRow}>
              {TAB_ITEMS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.tabPanel}>
            {activeTab === "overview" && (
              <>
                <p className={styles.sectionLabel}>Mo ta</p>
                <p className={styles.descriptionText}>
                  {hotel.description ??
                    `${hotel.name} nam tai vi tri thuan tien, phu hop cho ca du lich va cong tac. Khach san co khong gian sach se, dich vu than thien va de dang di chuyen den cac diem tham quan.`}
                </p>
                <div className={styles.bookingBox}>
                  <p className={styles.bookingTitle}>Check Availability</p>
                  <div className={styles.dateRow}>
                    <div className={styles.dateBox}>
                      <span className={styles.dateLabel}>Check In</span>
                      <span className={styles.dateValue}>{hotel.checkIn}</span>
                    </div>
                    <div className={styles.dateBox}>
                      <span className={styles.dateLabel}>Check Out</span>
                      <span className={styles.dateValue}>{hotel.checkOut}</span>
                    </div>
                  </div>
                </div>
                <p className={styles.sectionLabel}>Gia tien</p>
                <div className={styles.priceRow}>
                  <span className={styles.price}>{formatPrice(hotel.pricePerNight)}</span>
                  <span className={styles.perNight}>/ night</span>
                </div>
              </>
            )}

            {activeTab === "reviews" && (
              <>
                <p className={styles.sectionLabel}>Danh gia</p>
                <div className={styles.reviewSummary}>
                  <span className={styles.ratingNum}>{hotel.rating}</span>
                  <span className={styles.reviewCount}>/ 5</span>
                </div>
                {reviews.map((review, index) => (
                  <div key={`${review.author}-${index}`} className={styles.reviewBox}>
                    <div className={styles.reviewInner}>
                      <div className={styles.reviewAvatar}><IconUser /></div>
                      <div>
                        <p className={styles.reviewAuthor}>{review.author}</p>
                        <div className={styles.reviewRawStar}>
                          {renderStars(review.raw_star)}
                        </div>
                        <p className={styles.reviewContent}>{review.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {activeTab === "amenities" && (
              <>
                <p className={styles.sectionLabel}>Tien ich tien nghi</p>
                <div className={styles.amenities}>
                  {amenitiesToRender.map((a, index) => {
                    const amenity = resolveAmenity(a);
                    return (
                      <div key={`${amenity.label}-${index}`} className={styles.amenityItem}>
                        <div className={styles.amenityIcon}>{AMENITY_ICONS[amenity.icon] ?? <IconWifi />}</div>
                        <span className={styles.amenityLabel}>{amenity.label}</span>
                      </div>
                    );
                  })}
                </div>
                {shouldShowAmenitiesToggle && (
                  <button
                    type="button"
                    className={styles.amenitiesToggleBtn}
                    onClick={() => setIsAmenitiesExpanded((prev) => !prev)}
                  >
                    {isAmenitiesExpanded ? "Show less" : "Show more"}
                  </button>
                )}
                <p className={styles.sectionLabel}>Dia diem xung quanh</p>
                <ul className={styles.landmarks}>
                  {hotel.landmarks.map((lm) => (
                    <li key={lm.name} className={styles.landmarkItem}>
                      <span className={styles.landmarkName}>{lm.name}</span>
                      <span className={styles.landmarkDist}>{lm.distance}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
      {isImageViewerOpen && (
        <div className={styles.imageViewerOverlay} onClick={closeImageViewer}>
          <div
            className={styles.imageViewerContent}
            onClick={(e) => e.stopPropagation()}
            onMouseMove={moveDrag}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
          >
            <button className={styles.imageViewerCloseBtn} onClick={closeImageViewer}><IconClose /></button>
            {hotel.images.length > 1 && (
              <>
                <button className={`${styles.imageViewerNavBtn} ${styles.imageViewerNavBtnLeft}`} onClick={prevImg}>
                  <IconChevronLeft />
                </button>
                <button className={`${styles.imageViewerNavBtn} ${styles.imageViewerNavBtnRight}`} onClick={nextImg}>
                  <IconChevronRight />
                </button>
              </>
            )}
            <div className={`${styles.imageViewerCanvas} ${zoomLevel > 1 ? (isDragging ? styles.canvasDragging : styles.canvasZoomed) : ""}`}>
              <img
                src={hotel.images[imgIndex]}
                alt={`${hotel.name} large`}
                className={styles.imageViewerImage}
                onMouseDown={beginDrag}
                draggable={false}
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transition: isDragging ? "none" : "transform 0.2s ease",
                }}
              />
            </div>
            <div className={styles.zoomControls}>
              <button className={styles.zoomBtn} onClick={zoomOut} disabled={zoomLevel <= 1}>-</button>
              <span className={styles.zoomLabel}>{Math.round(zoomLevel * 100)}%</span>
              <button className={styles.zoomBtn} onClick={zoomIn} disabled={zoomLevel >= 3}>+</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}