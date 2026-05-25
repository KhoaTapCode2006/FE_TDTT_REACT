import { useEffect, useState } from "react";
import { usePopup } from "../hooks/usePopup";
import { useApp } from "@/app/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { fmtPrice, fmtDate } from "@/utils/format";
import SaveToListModal from "@/components/profile/SaveToListModal";
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
  pet_friendly: <IconPaw />,
  fitness_center: <IconDumbbell />,
  restaurant: <IconRoomService />,
  kitchen: <IconKitchen />,
  shuttle: <IconShuttle />,
  laundry: <IconLaundry />,
  accessible: <IconAccessible />,
};

const resolveAmenity = (amenity) => {
  if (typeof amenity === "string") {
    // Check if it's already a normalized amenity key
    if (AMENITY_ICONS[amenity]) {
      return { label: getAmenityLabel(amenity), icon: amenity };
    }
    
    // Try to match with normalized keys
    const normalized = amenity.toLowerCase();
    if (normalized.includes("breakfast") || normalized.includes("ăn sáng")) return { label: amenity, icon: "breakfast" };
    if (normalized.includes("parking") || normalized.includes("đỗ xe")) return { label: amenity, icon: "parking" };
    if (normalized.includes("air conditioning") || normalized.includes("điều hòa") || normalized.includes("ac")) return { label: amenity, icon: "ac" };
    if (normalized.includes("pet") || normalized.includes("thú cưng")) return { label: amenity, icon: "pet_friendly" };
    if (normalized.includes("fitness") || normalized.includes("gym")) return { label: amenity, icon: "fitness_center" };
    if (normalized.includes("restaurant") || normalized.includes("nhà hàng")) return { label: amenity, icon: "restaurant" };
    if (normalized.includes("kitchen") || normalized.includes("bếp")) return { label: amenity, icon: "kitchen" };
    if (normalized.includes("shuttle") || normalized.includes("đưa đón")) return { label: amenity, icon: "shuttle" };
    if (normalized.includes("laundry") || normalized.includes("giặt ủi")) return { label: amenity, icon: "laundry" };
    if (normalized.includes("accessible")) return { label: amenity, icon: "accessible" };
    if (normalized.includes("wi-fi") || normalized.includes("wifi")) return { label: amenity, icon: "wifi" };
    if (normalized.includes("pool") || normalized.includes("hồ bơi") || normalized.includes("bể bơi")) return { label: amenity, icon: "pool" };
    if (normalized.includes("spa")) return { label: amenity, icon: "spa" };
    return { label: amenity, icon: "wifi" }; // Default fallback
  }

  return amenity;
};

const getAmenityLabel = (amenityKey) => {
  const labels = {
    wifi: "WiFi",
    pool: "Hồ Bơi",
    spa: "Spa",
    breakfast: "Breakfast",
    parking: "Parking",
    ac: "AC",
    pet_friendly: "Pet Friendly",
    fitness_center: "Gym",
    restaurant: "Nhà hàng",
    kitchen: "Kitchen",
    shuttle: "Shuttle",
    laundry: "Laundry",
    accessible: "Accessible"
  };
  return labels[amenityKey] || amenityKey;
};

const formatPrice = (price) => fmtPrice(price);

const TAB_ITEMS = [
  { id: "overview", label: "Mô tả & Giá" },
  { id: "reviews", label: "Đánh giá" },
  { id: "amenities", label: "Tiện nghi & Gần đây" },
];

/**
 * HotelPopup component displays detailed hotel information in a modal
 * @param {Object} props - Component props
 * @param {Object} props.hotel - Hotel data object (propHotel)
 * @param {Function} props.onClose - Close handler (propOnClose)
 * @param {boolean} [props.embedded=false] - Embedded mode flag
 * @param {Object} [props.bookingDates] - Optional booking dates
 * @param {Date} props.bookingDates.checkIn - Check-in date
 * @param {Date} props.bookingDates.checkOut - Check-out date
 */
export default function HotelPopup({ hotel: propHotel, onClose: propOnClose, embedded = false, bookingDates }) {
  // Use either prop-based or hook-based approach
  const hookData = usePopup();
  const { dates } = useApp();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Use bookingDates if provided, otherwise fall back to dates from AppContext
  const displayDates = bookingDates || dates;
  
  const isOpen = propHotel ? true : hookData.isOpen;
  const hotel = propHotel || hookData.hotel;
  const close = propOnClose || hookData.close;

  const INITIAL_AMENITIES_VISIBLE = 6;
  const [imgIndex, setImgIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [isAmenitiesExpanded, setIsAmenitiesExpanded] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab("overview");
      setIsAmenitiesExpanded(false);
      setImgIndex(0);
    }
  }, [isOpen, hotel?.name]);

  if (!isOpen || !hotel) return null;

  const handleSaveClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    console.log('Save button clicked!', { isAuthenticated, hotel: hotel?.name });
    
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      navigate('/auth/login');
      return;
    }
    
    console.log('Opening SaveToListModal');
    setShowSaveModal(true);
  };

  // Ensure images array exists
  const images = hotel.images?.length ? hotel.images : ["https://via.placeholder.com/640x480?text=No+Image"];

  const prevImg = () => {
    setImgIndex((i) => (i - 1 + images.length) % images.length);
    setPanOffset({ x: 0, y: 0 });
  };
  const nextImg = () => {
    setImgIndex((i) => (i + 1) % images.length);
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

  // Prepare reviews data
  const reviews = hotel.reviews?.length
    ? hotel.reviews
    : hotel.latestReview
    ? [
        {
          author: hotel.latestReview.author,
          content: hotel.latestReview.text,
          raw_star: Math.round(hotel.rating),
        },
      ]
    : [];

  // Prepare amenities data
  const hotelAmenities = hotel.amenities || [];
  const amenitiesToRender = isAmenitiesExpanded
    ? hotelAmenities
    : hotelAmenities.slice(0, INITIAL_AMENITIES_VISIBLE);
  const shouldShowAmenitiesToggle = hotelAmenities.length > INITIAL_AMENITIES_VISIBLE;

  // Prepare landmarks data
  const landmarks = hotel.nearbyLandmarks || [];

  const popupContent = (
    <>
      {/* Left: Image gallery */}
      <div className={styles.imageSection}>
        <img
          src={images[0]}
          alt={`${hotel.name} main`}
          className={styles.hotelImage}
          onClick={() => {
            setImgIndex(0);
            openImageViewer();
          }}
        />
        {images.length > 1 && (
          <div className={styles.thumbnailList}>
            {images.slice(1).map((image, index) => {
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
        {!embedded && (
          <button className={styles.closeBtn} onClick={close}><IconClose /></button>
        )}

        <div className={styles.stickyTop}>
          {/* Header */}
          <div className={styles.header}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className={styles.hotelName}>{hotel.name}</h2>
                <div className={styles.ratingRow}>
                  <div className={styles.stars}>{renderStars(hotel.rating)}</div>
                  <span className={styles.ratingNum}>{hotel.rating}</span>
                </div>
                {(hotel.ai_score !== undefined && hotel.ai_score !== null) && (
                  <div className={styles.aiScoreRow}>
                    <span className={styles.aiScore}>AI Score: {Number(hotel.ai_score).toFixed(1)}</span>
                  </div>
                )}
                <div className={styles.address}>
                  <IconLocation /><span>{hotel.address}</span>
                </div>
              </div>
              
              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveClick}
                className="flex-none p-3 rounded-full hover:bg-surface-container transition-colors group"
                title="Lưu vào danh sách"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary group-hover:scale-110 transition-transform">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
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
              <p className={styles.sectionLabel}>Mô tả</p>
              <p className={styles.descriptionText}>
                {hotel.description ??
                  `${hotel.name} nằm tại vị trí thuận tiện, phù hợp cho cả du lịch và công tác. Khách sạn có không gian sạch sẽ, dịch vụ thân thiện và dễ dàng di chuyển đến các điểm tham quan.`}
              </p>
              
              {/* Book Now Button */}
              <button
                className="w-full mt-4 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                onClick={() => {
                  // TODO: Navigate to booking page or open booking modal
                  console.log('Booking hotel:', hotel.id);
                  alert('Tính năng đặt phòng đang được phát triển');
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Đặt Phòng
              </button>
              
              <div className={styles.bookingBox}>
                <p className={styles.bookingTitle}>Check Availability</p>
                <div className={styles.dateRow}>
                  <div className={styles.dateBox}>
                    <span className={styles.dateLabel}>Check In</span>
                    <span className={styles.dateValue}>{displayDates.checkIn ? fmtDate(displayDates.checkIn) : "Select date"}</span>
                  </div>
                  <div className={styles.dateBox}>
                    <span className={styles.dateLabel}>Check Out</span>
                    <span className={styles.dateValue}>{displayDates.checkOut ? fmtDate(displayDates.checkOut) : "Select date"}</span>
                  </div>
                </div>
              </div>
              <p className={styles.sectionLabel}>Giá tiền</p>
              <div className={styles.priceRow}>
                <span className={styles.price}>{formatPrice(hotel.pricePerNight)}</span>
                <span className={styles.perNight}>/ night</span>
              </div>
            </>
          )}

          {activeTab === "reviews" && (
            <>
              <p className={styles.sectionLabel}>Đánh giá</p>
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
                        {renderStars(review.raw_star || hotel.rating)}
                      </div>
                      <p className={styles.reviewContent}>{review.content || review.text}</p>
                    </div>
                  </div>
                </div>
              ))}
              {reviews.length === 0 && (
                <p className={styles.descriptionText}>Chưa có đánh giá nào.</p>
              )}
            </>
          )}

          {activeTab === "amenities" && (
            <>
              <p className={styles.sectionLabel}>Tiện ích tiện nghi</p>
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
              <p className={styles.sectionLabel}>Địa điểm xung quanh</p>
              <ul className={styles.landmarks}>
                {landmarks.map((lm, index) => (
                  <li key={`${lm.name}-${index}`} className={styles.landmarkItem}>
                    <span className={styles.landmarkName}>{lm.name}</span>
                    <span className={styles.landmarkDist}>{lm.distance}</span>
                  </li>
                ))}
                {landmarks.length === 0 && (
                  <li className={styles.landmarkItem}>
                    <span className={styles.landmarkName}>Không có thông tin địa điểm gần đây</span>
                  </li>
                )}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Main Popup */}
      {embedded ? (
        // Embedded mode: render content directly without overlay
        <div className={styles.popup} style={{ position: 'relative', maxWidth: 'none', width: '100%', height: '100%' }}>
          {popupContent}
        </div>
      ) : (
        // Standalone mode: render with overlay
        <div className={styles.overlay} onClick={close}>
          <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
            {popupContent}
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
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
            {images.length > 1 && (
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
                src={images[imgIndex]}
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

      {/* Save to List Modal */}
      <SaveToListModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        hotel={hotel}
      />
    </>
  );
}