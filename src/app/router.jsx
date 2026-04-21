import { Route, Routes } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import { usePopup } from "@/features/popup";

const demoHotel = {
  name: "Hotel Hoa Cuc Phuong",
  rating: 4.7,
  ai_score: 3.97,
  reviewCount: 1248,
  address: "7 Đường số 3 KDC 19 Tháng 8, KP tây B, Đông Hòa, Hồ Chí Minh, Vietnam",
  images: [
    "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEq-QXPJWZSF-6bc8rLOKhDi2tSHX9cYIOzDtIb6SmV6l4eSc-25WVcSroACAWJBaJVpUJDbjrverHo-x0_-RBGDnBkaOpveJINlH2LRsAlLshq5Tkk6-oLg7LALWg37In4nNlfBP3q1uA=s10000",
    "https://lh3.googleusercontent.com/gps-cs-s/APNQkAHDx0N81MKI8AxQG-xEhBAH0NWFGXVQ1rHKne45xOKI_Eq61Aepj-xCaBOA2ySqPhMSx1KPMyYHHTFPVpXqteOaBRz-MeNRxH3sYuZUiSrEBZ5FEB6pe2O54cVKs5V79TThOik-sg=s10000",
    "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGyYVkAClzGQixNzhTR83hz1SDvmlbNgHrlM6ZjjOwGGNvc0LTFCOHqB21ovi8cQVyxz9hIq_HeTixs_VZohIyEySpzmVUrybr_dhkYDyzE9ydz8JIRvdt_UPlue3T53BpOZ8ID=s10000",
    "https://images.trvl-media.com/lodging/100000000/99440000/99434000/99433915/4bf3de4a_z.jpg",
    "https://lh3.googleusercontent.com/gps-cs-s/APNQkAH3KiXrmI2fDjaj3KXihfc0LbXqjNCyTtSj95QAfIQ-mUK3FWmPLRDIxuQC7WbT2yR36ibOM52Syjhns8C-b2MMNsBYEpXBnsUvzjOgMzghDwBtJ_-fBiMXzTSlrHtgV067Vo_WmAwPR28=s10000",
    "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFBAFzRK6oGSmg1-L2YRPqGLas5wp93GV825zBoID_aT1yS-dnmpausEcWpkH5d_upXIBY8UnkpanY1BNnTwEAq2yAAVL53b7WQYeOMlurvZ15BmkgUCqdxRqNwsLEMTbt_DfIwnw=s10000",
    "https://lh3.googleusercontent.com/gps-cs-s/APNQkAFrxHj4wOeViCxaBpvAkIb5BRwD2p0RWrYzxZ-HSXtX4HFI1TGPjOQMTxS_Iqy-rAFlEQh34XHnqhIwCVzq7b5cBzQMRyTyFDOScGh_YsHyBeCDsMOiJ-DQvGCVBhnCxyXZuMtd8w=s10000",
    "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEQ30CuqpLMELGn5LSS9Gfzhygw1X65_ppnNciXQulcOeEoXh_HjFZ7dDNOs1Fsf0rdS1sJC1_5xAu-i5B7elJfy8ckAJoxebvFH-_XTQZ1DMMWDnsAKsE-8ZzadNF2R4jzHhAGO7DSxYht=s10000",
    "https://lh3.googleusercontent.com/gps-cs-s/APNQkAEd6gdQOmZDlfZcq4EZ6nkG6Lvl9EuOjzHlqUWBVpINKRwOIjhbaPf5lsNjeuNWQSe30Wqkp9ID6e3cjKiLqRicB1gY9XXXrbjVuHrlvlLPDyFjIRhpKyVOaQ4wU0ROseLnElL60UMFLQi2=s10000",
  ],
  amenities: [
    "Breakfast ($)",
    "Free Wi-Fi",
    "Free parking",
    "Air conditioning",
    "Pet-friendly",
    "Fitness center",
    "Room service",
    "Kitchen in some rooms",
    "Airport shuttle",
    "Full-service laundry",
    "Accessible",
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
  reviews: [
    {
      author: "Nguyen Minh Anh",
      raw_star: 5,
      content: "new orleans drury inn drury inn new orleans nice place stay price, walking distance mississippi river french quarter, complimentary breakfast extremely good offer free drinks snacks nachos fruit popcorn chips dip evening, desk staff friendly, rooftop pool small offered quite view city, hotel secure use key card access elevators, rooms clean small beds, stay, .",
    },
    {
      author: "Tran Quoc Bao",
      raw_star: 3,
      content: "slightly average not 4 star stretch certainly 3. room nice pieces furniture slightly tatty edges, nice balcony bit cold stay long certainly n't recommend going height summer idea air conditioning fan tv bed soft towels not 100 clean, positive note room large windows high ceilings quite impressive entry, staff friendly did n't real complaints stay, location good major attractions accesible foot used tram station bags, hotel fine wanted better value money,  ",
    },
    {
      author: "Le Thu Ha",
      raw_star: 5,
      content: "loved library hotel library hotel great location madison ave friendly staff lovely atmosphere, throughly enjoyed stay hope return.favourite features include ipod stand/charger super friendly desk staff rooftop bar course books room,  ",
    },
    {
      author: "Nguyen Van An",
      raw_star: 4,
      content: "clean modern priced ok is- main points 1. hotel actuallly quiet street, not far major attractions far ca n't hear commotion.2, hotel clean, 3. husband queen sized bed.4, having elevator definate plus.5, bar staff rude did not visit bar pizza late evening, just read n't best opted use outside resturants, 6. housekeeping little eager clean rooms 9:30 morning, hey cleaned, 7. bathroom spotless shower considerably large great 2, 8. brought bath towels glad did hotel towels rough, 9. staff friendly helpful city, 10. great supermarket bagel store corner, 11. blue bird coffee shop close proximity- favorite,  ",
    }
  ],
  checkIn: "14 : 00",
  checkOut: "12 : 00",
  pricePerNight: 242182,
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