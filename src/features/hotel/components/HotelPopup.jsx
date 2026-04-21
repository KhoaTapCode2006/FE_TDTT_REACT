import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/app/AppContext";
import { fmtPrice, fmtDate } from "@/utils/format";
import { AMENITY_META } from "@/constants/enums";
import Icon from "@/components/ui/Icon";
import styles from "./Hotel.module.css";

function HotelPopup({ hotel, onClose, embedded = false }) {
  const { dates } = useApp();
  const { checkIn, checkOut } = dates;
  const [slide, setSlide] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imgScale, setImgScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, panX: 0, panY: 0 });

  // Reset slide when hotel changes
  useEffect(() => {
    setSlide(0);
    setImageViewerOpen(false);
    setImgScale(1);
    setPan({ x: 0, y: 0 });
  }, [hotel?.id]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    return Math.max(1, Math.round((checkOut - checkIn) / 86400000));
  }, [checkIn, checkOut]);

  const total = useMemo(() => {
    return hotel ? hotel.pricePerNight * nights : 0;
  }, [hotel, nights]);

  useEffect(() => {
    if (imgScale <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [imgScale]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        if (imageViewerOpen) {
          setImageViewerOpen(false);
          setImgScale(1);
        } else {
          onClose?.();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, imageViewerOpen]);

  if (!hotel) {
    return null;
  }

  const images = hotel.images?.length ? hotel.images : ["https://via.placeholder.com/800x600?text=No+Image"];

  function handleMouseDown(event) {
    if (imgScale <= 1) return;
    event.preventDefault();
    dragRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  }

  function handleMouseMove(event) {
    if (!dragRef.current.dragging) return;
    setPan({
      x: dragRef.current.panX + (event.clientX - dragRef.current.startX),
      y: dragRef.current.panY + (event.clientY - dragRef.current.startY),
    });
  }

  function handleMouseUp() {
    dragRef.current.dragging = false;
  }

  function goPrev() {
    setSlide((current) => (current - 1 + images.length) % images.length);
    setImgScale(1);
  }

  function goNext() {
    setSlide((current) => (current + 1) % images.length);
    setImgScale(1);
  }

  function openImageViewer() {
    setImageViewerOpen(true);
    setImgScale(1);
    setPan({ x: 0, y: 0 });
  }

  function closeImageViewer() {
    setImageViewerOpen(false);
    setImgScale(1);
    setPan({ x: 0, y: 0 });
  }

  function zoomIn() {
    setImgScale(prev => Math.min(prev + 0.5, 3));
  }

  function zoomOut() {
    setImgScale(prev => Math.max(prev - 0.5, 1));
  }

  const visibleAmenities = (hotel.amenities || []).slice(0, 8);

  // Render stars
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Icon key={i} name="star" size={14} style={{ color: "#fbbf24" }} />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Icon key={i} name="star_half" size={14} style={{ color: "#fbbf24" }} />);
      } else {
        stars.push(<Icon key={i} name="star_border" size={14} style={{ color: "#d1d5db" }} />);
      }
    }
    return stars;
  };

  // Render the popup content
  const popupContent = (
    <>
      {/* Image Section */}
      <div className={styles.imageSection}>
        <img
          src={images[slide]}
          alt={`${hotel.name} ${slide + 1}`}
          className={styles.hotelImage}
          onClick={openImageViewer}
        />

        {/* Carousel Navigation */}
        {images.length > 1 && (
          <>
            <button className={`${styles.carouselBtn} ${styles.carouselBtnLeft}`} onClick={goPrev}>
              <Icon name="chevron_left" size={20} />
            </button>
            <button className={`${styles.carouselBtn} ${styles.carouselBtnRight}`} onClick={goNext}>
              <Icon name="chevron_right" size={20} />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {images.length > 1 && (
          <div className={styles.dots}>
            {images.map((_, index) => (
              <div
                key={index}
                className={`${styles.dot} ${index === slide ? styles.dotActive : ""}`}
                onClick={() => setSlide(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className={styles.infoPanel}>
        {!embedded && (
          <button className={styles.closeBtn} onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        )}

        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.hotelName}>{hotel.name}</h1>
          
          {/* Rating */}
          <div className={styles.ratingRow}>
            <div className={styles.stars}>
              {renderStars(hotel.rating)}
            </div>
            <span className={styles.ratingNum}>{hotel.rating}</span>
            <span className={styles.reviewCount}>({hotel.reviewCount} reviews)</span>
          </div>

          {/* Address */}
          <div className={styles.address}>
            <Icon name="location_on" size={16} />
            <span>{hotel.address}</span>
          </div>
        </div>

        {/* Price Section */}
        <div>
          <p className={styles.sectionLabel}>Giá phòng</p>
          <div className={styles.priceRow}>
            <span className={styles.price}>{fmtPrice(hotel.pricePerNight)}</span>
            <span className={styles.perNight}>/ đêm</span>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className={styles.twoCol}>
          {/* Amenities */}
          <div>
            <p className={styles.sectionLabel}>Tiện nghi</p>
            <div className={styles.amenities}>
              {visibleAmenities.map((amenity) => {
                const meta = AMENITY_META[amenity] || { icon: "check", label: amenity };
                return (
                  <div key={amenity} className={styles.amenityItem}>
                    <div className={styles.amenityIcon}>
                      <Icon name={meta.icon} size={20} />
                    </div>
                    <span className={styles.amenityLabel}>{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nearby Landmarks */}
          {hotel.nearbyLandmarks && hotel.nearbyLandmarks.length > 0 && (
            <div>
              <p className={styles.sectionLabel}>Địa điểm gần đây</p>
              <ul className={styles.landmarks}>
                {hotel.nearbyLandmarks.slice(0, 4).map((landmark, index) => (
                  <li key={index} className={styles.landmarkItem}>
                    <span className={styles.landmarkName}>{landmark.name}</span>
                    <span className={styles.landmarkDist}>{landmark.distance}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Latest Review */}
        {hotel.latestReview && (
          <div>
            <p className={styles.sectionLabel}>Đánh giá gần đây</p>
            <div className={styles.reviewBox}>
              <div className={styles.reviewInner}>
                <div className={styles.reviewAvatar}>
                  <Icon name="person" size={16} />
                </div>
                <div>
                  <p className={styles.reviewAuthor}>{hotel.latestReview.author}</p>
                  <p className={styles.reviewContent}>{hotel.latestReview.text}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Section */}
        <div className={styles.bookingBox}>
          <h3 className={styles.bookingTitle}>Chi tiết đặt phòng</h3>
          <div className={styles.dateRow}>
            <div className={styles.dateBox}>
              <span className={styles.dateLabel}>Nhận phòng</span>
              <span className={styles.dateValue}>{fmtDate(checkIn)}</span>
            </div>
            <div className={styles.dateBox}>
              <span className={styles.dateLabel}>Trả phòng</span>
              <span className={styles.dateValue}>{fmtDate(checkOut)}</span>
            </div>
          </div>
          <div style={{ marginTop: "12px", textAlign: "center" }}>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", marginBottom: "4px" }}>
              {nights} đêm • Tổng cộng
            </div>
            <div style={{ color: "#fff", fontSize: "18px", fontWeight: "800" }}>
              {fmtPrice(total)}
            </div>
          </div>
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
        <div className={styles.overlay} onClick={onClose}>
          <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
            {popupContent}
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {imageViewerOpen && (
        <div className={styles.imageViewerOverlay} onClick={closeImageViewer}>
          <div className={styles.imageViewerContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.imageViewerCloseBtn} onClick={closeImageViewer}>
              <Icon name="close" size={16} />
            </button>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button className={`${styles.imageViewerNavBtn} ${styles.imageViewerNavBtnLeft}`} onClick={goPrev}>
                  <Icon name="chevron_left" size={24} />
                </button>
                <button className={`${styles.imageViewerNavBtn} ${styles.imageViewerNavBtnRight}`} onClick={goNext}>
                  <Icon name="chevron_right" size={24} />
                </button>
              </>
            )}

            {/* Image Canvas */}
            <div 
              className={`${styles.imageViewerCanvas} ${imgScale > 1 ? styles.canvasZoomed : ""} ${dragRef.current.dragging ? styles.canvasDragging : ""}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                src={images[slide]}
                alt={`${hotel.name} ${slide + 1}`}
                className={styles.imageViewerImage}
                draggable={false}
                style={{
                  transform: `scale(${imgScale}) translate(${pan.x / imgScale}px, ${pan.y / imgScale}px)`,
                  transition: dragRef.current.dragging ? "none" : "transform 0.2s ease",
                }}
              />
            </div>

            {/* Zoom Controls */}
            <div className={styles.zoomControls}>
              <button 
                className={styles.zoomBtn} 
                onClick={zoomOut} 
                disabled={imgScale <= 1}
              >
                −
              </button>
              <span className={styles.zoomLabel}>{Math.round(imgScale * 100)}%</span>
              <button 
                className={styles.zoomBtn} 
                onClick={zoomIn} 
                disabled={imgScale >= 3}
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HotelPopup;
