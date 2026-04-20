import { createSlice } from "@reduxjs/toolkit";

const popupSlice = createSlice({
  name: "popup",
  initialState: {
    isOpen: false,
    hotel: null,
  },
  reducers: {
    openPopup: (state, action) => {
      state.isOpen = true;
      state.hotel = action.payload;
    },
    closePopup: (state) => {
      state.isOpen = false;
      state.hotel = null;
    },
  },
});

export const { openPopup, closePopup } = popupSlice.actions;
export default popupSlice.reducer;