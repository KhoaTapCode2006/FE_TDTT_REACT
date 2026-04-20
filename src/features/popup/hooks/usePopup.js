import { useDispatch, useSelector } from "react-redux";
import { openPopup, closePopup } from "../popup.store";

export function usePopup() {
  const dispatch = useDispatch();
  const { isOpen, hotel } = useSelector((state) => state.popup);

  return {
    isOpen,
    hotel,
    open: (hotelData) => dispatch(openPopup(hotelData)),
    close: () => dispatch(closePopup()),
  };
}