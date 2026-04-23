import { useApp } from "@/app/AppContext";

export function usePopup() {
  const { activeHotel, setActiveHotel } = useApp();

  return {
    isOpen: !!activeHotel,
    hotel: activeHotel,
    close: () => setActiveHotel(null),
  };
}