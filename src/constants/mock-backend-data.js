// Mock backend data for demo - matches backend DiscoverHotel schema with snake_case
// This data should be transformed using transformDiscoverHotel() before use in frontend

export const MOCK_BACKEND_DATA = {
  status_code: 200,
  message: "Success",
  data: [
    {
      property_token: "ChoQvfSB7-PX5cSIARoNL2cvMTF5bHE0bHh6ZBAC",
      name: "Khu nhà hoa hồng",
      description: "Cozy guesthouse with beautiful rose garden, perfect for couples and families",
      link: "https://example.com/hotel/khu-nha-hoa-hong",
      address: "123 Nguyen Thi Minh Khai, Binh Thanh District, HCM",
      phone: "+84 28 1234 5678",
      gps_coordinates: { 
        latitude: 10.86847972869873, 
        longitude: 106.79678344726562,
        geohash: "w3gvk2e8"
      },
      nearby_places: [
        {
          category: "Restaurant",
          name: "Pho 24",
          thumbnail: "https://via.placeholder.com/150x150?text=Pho24",
          description: "Famous Vietnamese noodle restaurant",
          gps_coordinates: { latitude: 10.869, longitude: 106.797, geohash: "w3gvk2e9" },
          transportations: [
            { type: "walking", distance: "200m", duration: "3 min" }
          ]
        }
      ],
      check_in_time: "14:00",
      check_out_time: "12:00",
      price: 136681,
      deal: "10% off for bookings over 3 nights",
      booking_sources: [
        {
          source: "Agoda",
          logo: "https://via.placeholder.com/100x50?text=Agoda",
          link: "https://agoda.com/hotel123",
          price: 136681
        },
        {
          source: "Booking.com",
          logo: "https://via.placeholder.com/100x50?text=Booking",
          link: "https://booking.com/hotel123",
          price: 140000
        }
      ],
      images: [
        { 
          thumbnail: "https://via.placeholder.com/150x150?text=Hotel+Hoa+Hong",
          original_image: "https://via.placeholder.com/640x480?text=Hotel+Hoa+Hong" 
        },
        { 
          thumbnail: "https://via.placeholder.com/150x150?text=Room",
          original_image: "https://via.placeholder.com/640x480?text=Room" 
        }
      ],
      amenities: ["Đỗ xe miễn phí", "WiFi", "Điều hòa"],
      raw_rating: 4.2,
      user_reviews: [
        { text: "Good place, clean rooms", raw_stars: 4 },
        { text: "Nice location, friendly staff", raw_stars: 5 }
      ],
      ai_sentiment: {
        ai_score: 3.51,
        ai_score_expiration_date: "2024-12-31T23:59:59Z",
        trust_weight: 0.85,
        analyzed_reviews: [
          {
            text: "Good place, clean rooms",
            raw_stars: 4,
            sentiment_score: 0.75,
            trust_weight: 0.9,
            adjusted_stars: 4.1
          }
        ]
      },
      ai_summary: {
        ai_summary_expiration_date: "2024-12-31T23:59:59Z",
        overview: "A charming guesthouse with excellent location and friendly service",
        pros: ["Clean rooms", "Good location", "Friendly staff"],
        cons: ["Limited parking", "No elevator"],
        notes: "Best for short stays"
      },
      last_updated: "2024-01-15T10:30:00Z"
    },
    {
      property_token: "ChoIp-vPwaH4wODsARoNL2cvMTFiNjdzYjdnchAB",
      name: "Hotel Hoa Cúc Phương",
      description: "Modern hotel with excellent amenities in the heart of District 11",
      link: "https://example.com/hotel/hoa-cuc-phuong",
      address: "456 Lac Long Quan, District 11, HCM",
      phone: "+84 28 2345 6789",
      gps_coordinates: { 
        latitude: 10.890787099999999, 
        longitude: 106.7786708,
        geohash: "w3gvk3f1"
      },
      nearby_places: [
        {
          category: "Shopping",
          name: "Dam Sen Market",
          thumbnail: "https://via.placeholder.com/150x150?text=Market",
          description: "Local market with fresh produce",
          gps_coordinates: { latitude: 10.891, longitude: 106.779, geohash: "w3gvk3f2" },
          transportations: [
            { type: "walking", distance: "500m", duration: "7 min" }
          ]
        }
      ],
      check_in_time: "14:00",
      check_out_time: "11:00",
      price: 242182,
      deal: null,
      booking_sources: [
        {
          source: "Agoda",
          logo: "https://via.placeholder.com/100x50?text=Agoda",
          link: "https://agoda.com/hotel456",
          price: 242182
        }
      ],
      images: [
        { 
          thumbnail: "https://via.placeholder.com/150x150?text=Hotel+Hoa+Cuc",
          original_image: "https://via.placeholder.com/640x480?text=Hotel+Hoa+Cuc" 
        }
      ],
      amenities: ["WiFi", "Free parking", "Air conditioning", "Breakfast included"],
      raw_rating: 4.5,
      user_reviews: [
        { text: "Great stay, highly recommended", raw_stars: 5 },
        { text: "Excellent service", raw_stars: 4 }
      ],
      ai_sentiment: {
        ai_score: 3.97,
        ai_score_expiration_date: "2024-12-31T23:59:59Z",
        trust_weight: 0.92,
        analyzed_reviews: [
          {
            text: "Great stay, highly recommended",
            raw_stars: 5,
            sentiment_score: 0.95,
            trust_weight: 0.95,
            adjusted_stars: 5.0
          }
        ]
      },
      ai_summary: {
        ai_summary_expiration_date: "2024-12-31T23:59:59Z",
        overview: "Excellent hotel with modern facilities and great service",
        pros: ["Modern rooms", "Great breakfast", "Helpful staff", "Good value"],
        cons: ["Busy street", "Limited parking"],
        notes: "Ideal for business travelers"
      },
      last_updated: "2024-01-16T08:15:00Z"
    },
    {
      property_token: "ChoIsOn_3dC5pfmrARoNL2cvMTFnajRrZ2d5ehAB",
      name: "Nhà nghỉ Thanh Tùng A2",
      description: "Budget-friendly guesthouse with basic amenities",
      link: "https://example.com/hotel/thanh-tung-a2",
      address: "789 Tran Hung Dao, District 11, HCM",
      phone: "+84 28 3456 7890",
      gps_coordinates: { 
        latitude: 10.879, 
        longitude: 106.77081899999999,
        geohash: "w3gvk2d5"
      },
      nearby_places: [],
      check_in_time: "13:00",
      check_out_time: "12:00",
      price: 205627,
      deal: null,
      booking_sources: [
        {
          source: "Local booking",
          logo: null,
          link: null,
          price: 205627
        }
      ],
      images: [
        { 
          thumbnail: "https://via.placeholder.com/150x150?text=Nha+Nghi",
          original_image: "https://via.placeholder.com/640x480?text=Nha+Nghi" 
        }
      ],
      amenities: ["Parking"],
      raw_rating: 3.8,
      user_reviews: [],
      ai_sentiment: {
        ai_score: 4.17,
        ai_score_expiration_date: "2024-12-31T23:59:59Z",
        trust_weight: 0.65,
        analyzed_reviews: []
      },
      ai_summary: null,
      last_updated: "2024-01-14T15:20:00Z"
    },
    {
      property_token: "ChoI_7DR0IvUnKSNARoNL2cvMTF2XzBreHhsORAB",
      name: "Happy Motel",
      description: "Simple motel with convenient location",
      link: "https://example.com/hotel/happy-motel",
      address: "321 Xo Viet Nghe Tinh, Binh Thanh District, HCM",
      phone: "+84 28 4567 8901",
      gps_coordinates: { 
        latitude: 10.8742, 
        longitude: 106.85538779999999,
        geohash: "w3gvk4h2"
      },
      nearby_places: [
        {
          category: "Park",
          name: "Gia Dinh Park",
          thumbnail: "https://via.placeholder.com/150x150?text=Park",
          description: "Beautiful park for morning walks",
          gps_coordinates: { latitude: 10.875, longitude: 106.856, geohash: "w3gvk4h3" },
          transportations: [
            { type: "walking", distance: "300m", duration: "5 min" }
          ]
        }
      ],
      check_in_time: "14:00",
      check_out_time: "12:00",
      price: 180821,
      deal: "Free breakfast for 2-night stays",
      booking_sources: [
        {
          source: "Direct booking",
          logo: null,
          link: "https://happymotel.com",
          price: 180821
        }
      ],
      images: [
        { 
          thumbnail: "https://via.placeholder.com/150x150?text=Happy+Motel",
          original_image: "https://via.placeholder.com/640x480?text=Happy+Motel" 
        }
      ],
      amenities: ["WiFi", "Parking"],
      raw_rating: 3.5,
      user_reviews: [],
      ai_sentiment: {
        ai_score: 3.29,
        ai_score_expiration_date: "2024-12-31T23:59:59Z",
        trust_weight: 0.70,
        analyzed_reviews: []
      },
      ai_summary: {
        ai_summary_expiration_date: "2024-12-31T23:59:59Z",
        overview: "Basic motel with good location",
        pros: ["Convenient location", "Affordable"],
        cons: ["Basic facilities", "Small rooms"],
        notes: "Good for budget travelers"
      },
      last_updated: "2024-01-13T12:45:00Z"
    },
    {
      property_token: "ChkItoSJiI-jqtFUGg0vZy8xMWg1bWt6ejNrEAE",
      name: "Hotel Hương Thiên Phú",
      description: "Comfortable hotel with excellent breakfast and service",
      link: "https://example.com/hotel/huong-thien-phu",
      address: "654 Ly Thuong Kiet, District 11, HCM",
      phone: "+84 28 5678 9012",
      gps_coordinates: { 
        latitude: 10.8605, 
        longitude: 106.78049779999999,
        geohash: "w3gvk2f8"
      },
      nearby_places: [
        {
          category: "Restaurant",
          name: "Banh Mi Huynh Hoa",
          thumbnail: "https://via.placeholder.com/150x150?text=BanhMi",
          description: "Famous banh mi shop",
          gps_coordinates: { latitude: 10.861, longitude: 106.781, geohash: "w3gvk2f9" },
          transportations: [
            { type: "walking", distance: "150m", duration: "2 min" }
          ]
        }
      ],
      check_in_time: "14:00",
      check_out_time: "12:00",
      price: 315000,
      deal: "Complimentary airport transfer",
      booking_sources: [
        {
          source: "Agoda",
          logo: "https://via.placeholder.com/100x50?text=Agoda",
          link: "https://agoda.com/hotel789",
          price: 315000
        },
        {
          source: "Booking.com",
          logo: "https://via.placeholder.com/100x50?text=Booking",
          link: "https://booking.com/hotel789",
          price: 320000
        }
      ],
      images: [
        { 
          thumbnail: "https://via.placeholder.com/150x150?text=Hotel+Huong",
          original_image: "https://via.placeholder.com/640x480?text=Hotel+Huong" 
        },
        { 
          thumbnail: "https://via.placeholder.com/150x150?text=Breakfast",
          original_image: "https://via.placeholder.com/640x480?text=Breakfast" 
        }
      ],
      amenities: ["Breakfast", "WiFi", "Parking", "Air conditioning", "Room service"],
      raw_rating: 4.6,
      user_reviews: [],
      ai_sentiment: {
        ai_score: 4.06,
        ai_score_expiration_date: "2024-12-31T23:59:59Z",
        trust_weight: 0.88,
        analyzed_reviews: []
      },
      ai_summary: {
        ai_summary_expiration_date: "2024-12-31T23:59:59Z",
        overview: "Great hotel with excellent breakfast and friendly staff",
        pros: ["Delicious breakfast", "Clean rooms", "Good location", "Helpful staff"],
        cons: ["Street noise", "No gym"],
        notes: "Perfect for families"
      },
      last_updated: "2024-01-17T09:30:00Z"
    }
  ]
};
