// Mock backend data for demo - transform with transformBackendResponse()

export const MOCK_BACKEND_DATA = {
  status_code: 200,
  message: "Success",
  data: [
    {
      property_token: "ChoQvfSB7-PX5cSIARoNL2cvMTF5bHE0bHh6ZBAC",
      name: "Khu nhà hoa hồng",
      gps_coordinates: { latitude: 10.86847972869873, longitude: 106.79678344726562 },
      price: 136681,
      images: [{ original_image: "https://via.placeholder.com/640x480?text=Hotel+Hoa+Hong" }],
      amenities: ["Đỗ xe miễn phí"],
      ai_score: 3.51,
      user_reviews: [{ reviewer_name: "Guest", review_text: "Good place", raw_stars: 4 }],
      address: "Binh Thanh District, HCM"
    },
    {
      property_token: "ChoIp-vPwaH4wODsARoNL2cvMTFiNjdzYjdnchAB",
      name: "Hotel Hoa Cúc Phương",
      gps_coordinates: { latitude: 10.890787099999999, longitude: 106.7786708 },
      price: 242182,
      images: [{ original_image: "https://via.placeholder.com/640x480?text=Hotel+Hoa+Cuc" }],
      amenities: ["Free Wi-Fi", "Free parking", "Air conditioning"],
      ai_score: 3.97,
      user_reviews: [{ reviewer_name: "Guest", review_text: "Great stay", raw_stars: 5 }],
      address: "District 11, HCM"
    },
    {
      property_token: "ChoIsOn_3dC5pfmrARoNL2cvMTFnajRrZ2d5ehAB",
      name: "Nhà nghỉ Thanh Tùng A2",
      gps_coordinates: { latitude: 10.879, longitude: 106.77081899999999 },
      price: 205627,
      images: [{ original_image: "https://via.placeholder.com/640x480?text=Nha+Nghi" }],
      amenities: ["Free parking"],
      ai_score: 4.17,
      user_reviews: [],
      address: "District 11, HCM"
    },
    {
      property_token: "ChoI_7DR0IvUnKSNARoNL2cvMTF2XzBreHhsORAB",
      name: "Happy Motel",
      gps_coordinates: { latitude: 10.8742, longitude: 106.85538779999999 },
      price: 180821,
      images: [{ original_image: "https://via.placeholder.com/640x480?text=Happy+Motel" }],
      amenities: ["WiFi", "Parking"],
      ai_score: 3.29,
      user_reviews: [],
      address: "Binh Thanh District, HCM"
    },
    {
      property_token: "ChkItoSJiI-jqtFUGg0vZy8xMWg1bWt6ejNrEAE",
      name: "Hotel Hương Thiên Phú",
      gps_coordinates: { latitude: 10.8605, longitude: 106.78049779999999 },
      price: 315000,
      images: [{ original_image: "https://via.placeholder.com/640x480?text=Hotel+Huong" }],
      amenities: ["Breakfast", "WiFi", "Parking"],
      ai_score: 4.06,
      user_reviews: [],
      address: "District 11, HCM"
    }
  ]
};
