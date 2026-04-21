export const AMENITY_META = {
  wifi:           { icon: "wifi",                  label: "WiFi" },
  pool:           { icon: "pool",                  label: "Hồ Bơi" },
  fitness_center: { icon: "fitness_center",        label: "Gym" },
  spa:            { icon: "spa",                   label: "Spa" },
  restaurant:     { icon: "restaurant",            label: "Nhà hàng" },
  bar:            { icon: "local_bar",             label: "Quầy bar" },
  breakfast:      { icon: "free_breakfast",        label: "Breakfast" },
  parking:        { icon: "local_parking",         label: "Parking" },
  ac:             { icon: "ac_unit",               label: "AC" },
  pet_friendly:   { icon: "pets",                  label: "Pet friendly" },
  laundry:        { icon: "local_laundry_service", label: "Laundry" },
  shuttle:        { icon: "airport_shuttle",        label: "Shuttle" },
  kitchen:        { icon: "kitchen",                label: "Kitchen" },
};

export const PROPERTY_TYPES = [
  "Khách sạn",
  "Penthouse",
  "Resort",
  "Villa",
  "Homestay",
  "Nhà nghỉ",
  "Chung cư",
];

// Filter-related constants
export const PRICE_PRESETS = [
  { label: "Dưới 1tr", min: null, max: 1000000 },
  { label: "1-5tr", min: 1000000, max: 5000000 },
  { label: "5-15tr", min: 5000000, max: 15000000 },
  { label: "15-50tr", min: 15000000, max: 50000000 },
  { label: "50-100tr", min: 50000000, max: 100000000 },
];

export const DEFAULT_FILTER_STATE = {
  starRating: null,
  types: [],
  amenities: [],
  priceMin: null,
  priceMax: null,
  availableOnly: false,
};

export const MOCK_HOTELS = [
  {
    id: "1",
    name: "The Azure Sanctuary",
    type: "Hotel",
    badge: "Premier Boutique",
    rating: 4.9,
    reviewCount: 2400,
    pricePerNight: 7500000,
    currency: "VND",
    address: "District 1, Ho Chi Minh City",
    lat: 10.7769,
    lng: 106.7009,
    amenities: ["pool", "spa", "wifi"],
    starRating: 5,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB8_Up820xTy9L7dCfBvhEMebEI2SbLeOcrnhDT6S65F7l2IeuTzFiU5Ku0P0Gh1ca1yAdXi5lpaT2F3VBFO5EWr8Fx3K1RVCxE5TJx-fwdzd_RAwQ_iT8jymVnuJAfw6Tasm0PdSsaBOKS3m0ilcS218QSbIc4LPN5LhgzsRp_Wgoj-G7SRopesItOitbFDZ1O-48wBZn23-z96FgSmxngMYTL20bIawlXIwsUHtNsDqtBEd4wzQ_BrG2EA9UnP5IN9eBFFqMgkSg",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCW0nryQUYa1dFi-wPdmEBZ-xEFW9BFdP2glZqi_jXvygP4MVTYXQcTQBhVompi_g8BUe7lj7J3JMGLRtvRezVmY_lr-NUwjT17CWFyuOzaaNMQCjqkwTEGnfDJJwQn6ksp4qy2vp9wZBKU5Ru6o8AWE0Km9oclaLlvx1EAwliKBYVOYiprenA_48dCyaTSn1k0UgG3R_Yb4-uXNv42WZ86QwtQcvwEwg8imEBXz6gFJ2ZwlAe3S-FhF238CWv0DOCu5Tqu-pG-z28",
    ],
    latestReview: {
      author: "Elena R.",
      text: "An absolute masterpiece of hospitality. The concierge service was impeccable.",
    },
    nearbyLandmarks: [
      { name: "Ben Thanh Market", distance: "0.4 km" },
      { name: "Reunification Palace", distance: "0.9 km" },
      { name: "Notre-Dame Cathedral", distance: "1.2 km" },
    ],
  },
  {
    id: "2",
    name: "The Gilded Manor",
    type: "Hotel",
    badge: null,
    rating: 4.7,
    reviewCount: 1850,
    pricePerNight: 4200000,
    currency: "VND",
    address: "District 3, Riverside",
    lat: 10.785,
    lng: 106.692,
    amenities: ["wifi", "fitness_center"],
    starRating: 4,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCdT-tkeqqMwu7a090Frmt7FtFibb_hp29IHEEbYoFLaAT-D9fHm_AkQVxOH-cYPMdUPo2FAz0N1ryQlWazhl75Ggcv-Ttw-fr15Po3caDasTcbvXwxj1j3g7-7IFOKRW9WsLk5bNOpCkpPx7X8ryM3zF1XhpQ5sKVIpSikNW6bDZRgnaa1WUsaPHtjB74_-_JM2Ba5tTNnaxfM3AApjqWEaJqx34rWyhnx1y_vdvyJr-NjwaWb8SuLviarCjhmi3rTdLPO0DVDp4A",
    ],
    latestReview: {
      author: "Markus T.",
      text: "The spa treatments are world-class. Truly a hidden gem in the city.",
    },
    nearbyLandmarks: [
      { name: "War Remnants Museum", distance: "0.6 km" },
      { name: "Tao Dan Park", distance: "1.1 km" },
    ],
  },
  {
    id: "3",
    name: "Saigon Pearl Villa",
    type: "Villa",
    badge: "Exclusive",
    rating: 4.8,
    reviewCount: 980,
    pricePerNight: 12000000,
    currency: "VND",
    address: "Binh Thanh District",
    lat: 10.795,
    lng: 106.715,
    amenities: ["pool", "wifi", "spa"],
    starRating: 5,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCW0nryQUYa1dFi-wPdmEBZ-xEFW9BFdP2glZqi_jXvygP4MVTYXQcTQBhVompi_g8BUe7lj7J3JMGLRtvRezVmY_lr-NUwjT17CWFyuOzaaNMQCjqkwTEGnfDJJwQn6ksp4qy2vp9wZBKU5Ru6o8AWE0Km9oclaLlvx1EAwliKBYVOYiprenA_48dCyaTSn1k0UgG3R_Yb4-uXNv42WZ86QwtQcvwEwg8imEBXz6gFJ2ZwlAe3S-FhF238CWv0DOCu5Tqu-pG-z28",
    ],
    latestReview: {
      author: "Sophie L.",
      text: "Private pool, stunning river views. Worth every dong. Will absolutely return.",
    },
    nearbyLandmarks: [
      { name: "Saigon River", distance: "0.2 km" },
      { name: "Landmark 81", distance: "0.5 km" },
    ],
  },
  {
    id: "4",
    name: "Grand Heritage Resort",
    type: "Resort",
    badge: "Heritage",
    rating: 4.6,
    reviewCount: 3100,
    pricePerNight: 9800000,
    currency: "VND",
    address: "District 5, Ho Chi Minh City",
    lat: 10.752,
    lng: 106.668,
    amenities: ["pool", "fitness_center", "wifi", "spa"],
    starRating: 5,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCdT-tkeqqMwu7a090Frmt7FtFibb_hp29IHEEbYoFLaAT-D9fHm_AkQVxOH-cYPMdUPo2FAz0N1ryQlWazhl75Ggcv-Ttw-fr15Po3caDasTcbvXwxj1j3g7-7IFOKRW9WsLk5bNOpCkpPx7X8ryM3zF1XhpQ5sKVIpSikNW6bDZRgnaa1WUsaPHtjB74_-_JM2Ba5tTNnaxfM3AApjqWEaJqx34rWyhnx1y_vdvyJr-NjwaWb8SuLviarCjhmi3rTdLPO0DVDp4A",
    ],
    latestReview: {
      author: "James W.",
      text: "Breathtaking colonial architecture. The breakfast spread is legendary.",
    },
    nearbyLandmarks: [
      { name: "Cho Lon Market", distance: "0.3 km" },
      { name: "Thien Hau Temple", distance: "0.5 km" },
    ],
  },
  {
    id: "5",
    name: "Sky Penthouse HCMC",
    type: "Penthouse",
    badge: "Sky Suite",
    rating: 4.95,
    reviewCount: 420,
    pricePerNight: 28000000,
    currency: "VND",
    address: "District 1, Bitexco Tower",
    lat: 10.7717,
    lng: 106.7042,
    amenities: ["pool", "wifi", "spa", "fitness_center"],
    starRating: 5,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB8_Up820xTy9L7dCfBvhEMebEI2SbLeOcrnhDT6S65F7l2IeuTzFiU5Ku0P0Gh1ca1yAdXi5lpaT2F3VBFO5EWr8Fx3K1RVCxE5TJx-fwdzd_RAwQ_iT8jymVnuJAfw6Tasm0PdSsaBOKS3m0ilcS218QSbIc4LPN5LhgzsRp_Wgoj-G7SRopesItOitbFDZ1O-48wBZn23-z96FgSmxngMYTL20bIawlXIwsUHtNsDqtBEd4wzQ_BrG2EA9UnP5IN9eBFFqMgkSg",
    ],
    latestReview: {
      author: "Anh N.",
      text: "360° city views from the private terrace. Absolutely unreal experience.",
    },
    nearbyLandmarks: [
      { name: "Bitexco Financial Tower", distance: "0.0 km" },
      { name: "Ben Thanh Market", distance: "0.6 km" },
    ],
  },
];
