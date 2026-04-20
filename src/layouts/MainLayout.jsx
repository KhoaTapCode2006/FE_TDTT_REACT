import { HotelPopup } from "@/features/popup";

export default function MainLayout({ children }) {
  return (
    <>
      {children}
      <HotelPopup /> {/* render ở đây, quản lý state qua Redux */}
    </>
  );
}