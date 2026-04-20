import { Route, Routes } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import { usePopup } from "@/features/popup";

const demoHotel = {
  name: "La Siesta Hoi An Resort",
  rating: 4.7,
  reviewCount: 1248,
  address: "132 Hung Vuong, Hoi An, Quang Nam",
  images: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
  ],
  amenities: [
    { icon: "pool", label: "Infinity Pool" },
    { icon: "spa", label: "Spa & Massage" },
    { icon: "wifi", label: "Free High-speed WiFi" },
  ],
  landmarks: [
    { name: "Hoi An Ancient Town", distance: "1.1 km" },
    { name: "An Bang Beach", distance: "4.9 km" },
    { name: "Da Nang Intl Airport", distance: "28 km" },
  ],
  latestReview: {
    author: "Nguyen Minh Anh",
    content: "Phong dep, nhan vien than thien, buffet sang rat ngon.",
  },
  checkIn: "20 Apr 2026",
  checkOut: "21 Apr 2026",
  pricePerNight: 2350000,
};

function HomePage() {
  const { open } = usePopup();

  return (
    <MainLayout>
      <div style={{ padding: 24 }}>
        <button
          type="button"
          onClick={() => open(demoHotel)}
          style={{ padding: "10px 16px", borderRadius: 10, cursor: "pointer" }}
        >
          Mo popup xem thong tin khach san
        </button>
      </div>
    </MainLayout>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}

// Ghi chú tích hợp với map:
// Ở tính năng bản đồ, chỉ cần gọi `open(hotelData)` từ `usePopup()` khi click marker/map-item.
// State popup là global (Redux), nên click vào item trên map sẽ mở cùng HotelPopup này.