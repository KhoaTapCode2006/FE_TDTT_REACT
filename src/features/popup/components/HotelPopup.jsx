import { useState } from "react";
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

const AMENITY_ICONS = { pool: <IconPool />, spa: <IconSpa />, wifi: <IconWifi /> };

const formatPrice = (price) => new Intl.NumberFormat("vi-VN").format(price) + " VND";

export default function HotelPopup() {
  const { isOpen, hotel, close } = usePopup();
  const [imgIndex, setImgIndex] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  return (
    <div className={styles.overlay} onClick={close}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>

        {/* Left: Image carousel */}
        <div className={styles.imageSection}>
          <img
            src={hotel.images[imgIndex]}
            alt={hotel.name}
            className={styles.hotelImage}
            onClick={openImageViewer}
          />
          {hotel.images.length > 1 && (
            <>
              <button className={`${styles.carouselBtn} ${styles.carouselBtnLeft}`} onClick={prevImg}>
                <IconChevronLeft />
              </button>
              <button className={`${styles.carouselBtn} ${styles.carouselBtnRight}`} onClick={nextImg}>
                <IconChevronRight />
              </button>
              <div className={styles.dots}>
                {hotel.images.map((_, i) => (
                  <span
                    key={i}
                    className={`${styles.dot} ${i === imgIndex ? styles.dotActive : ""}`}
                    onClick={() => {
                      setImgIndex(i);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: Info panel */}
        <div className={styles.infoPanel}>
          <button className={styles.closeBtn} onClick={close}><IconClose /></button>

          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.hotelName}>{hotel.name}</h2>
            <div className={styles.ratingRow}>
              <div className={styles.stars}>{renderStars(hotel.rating)}</div>
              <span className={styles.ratingNum}>{hotel.rating}</span>
              <span className={styles.reviewCount}>({hotel.reviewCount.toLocaleString()} reviews)</span>
            </div>
            <div className={styles.address}>
              <IconLocation /><span>{hotel.address}</span>
            </div>
          </div>

          {/* Amenities + Landmarks */}
          <div className={styles.twoCol}>
            <div>
              <p className={styles.sectionLabel}>Featured Amenities</p>
              <div className={styles.amenities}>
                {hotel.amenities.map((a) => (
                  <div key={a.label} className={styles.amenityItem}>
                    <div className={styles.amenityIcon}>{AMENITY_ICONS[a.icon] ?? <IconWifi />}</div>
                    <span className={styles.amenityLabel}>{a.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className={styles.sectionLabel}>Nearby Landmarks</p>
              <ul className={styles.landmarks}>
                {hotel.landmarks.map((lm) => (
                  <li key={lm.name} className={styles.landmarkItem}>
                    <span className={styles.landmarkName}>{lm.name}</span>
                    <span className={styles.landmarkDist}>{lm.distance}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Review */}
          <div className={styles.reviewBox}>
            <p className={styles.sectionLabel}>Latest Review</p>
            <div className={styles.reviewInner}>
              <div className={styles.reviewAvatar}><IconUser /></div>
              <div>
                <p className={styles.reviewAuthor}>{hotel.latestReview.author}</p>
                <p className={styles.reviewContent}>{hotel.latestReview.content}</p>
              </div>
            </div>
          </div>

          {/* Booking */}
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

          {/* Price */}
          <div className={styles.priceRow}>
            <span className={styles.price}>{formatPrice(hotel.pricePerNight)}</span>
            <span className={styles.perNight}>/ night</span>
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