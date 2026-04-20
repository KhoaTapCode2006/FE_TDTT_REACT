import axios from "axios";
import { normalizeHotelResult } from "@/utils/format";

const DISCOVER_ENDPOINT = "http://localhost:8010/proxy/api/v1/discover";

export async function searchHotels({ location, checkIn, checkOut, guests, priceRange = {}, radius = 3000 }) {
  const childrenAges = (guests?.childrenAges || [])
    .map((age) => Math.round(age))
    .filter((age) => age >= 1 && age <= 17);

  const { minPrice = 0, maxPrice = 9999999 } = priceRange;

  const payload = {
    language: "vi",
    address: location,
    check_in: (checkIn || new Date()).toISOString(),
    check_out: (checkOut || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)).toISOString(),
    min_price: Math.round(minPrice ?? 0),
    max_price: Math.round(maxPrice ?? 9999999),
    radius,
    children: childrenAges,
    adults: guests?.adults ?? 2,
    personality: "string",
  };

  try {
    const response = await axios.post(DISCOVER_ENDPOINT, payload, {
      headers: { "Content-Type": "application/json" },
    });

    const data = response.data;
    const inner = data?.data || data?.hotels || data?.results || [];
    const rawItems = Array.isArray(inner)
      ? inner
      : inner && Array.isArray(inner.hotels)
      ? inner.hotels
      : inner && Array.isArray(inner.results)
      ? inner.results
      : [];

    return rawItems.map((item) => normalizeHotelResult(item, location));
  } catch (error) {
    console.error("searchHotels error:", error);
    throw error;
  }
}
