import { configureStore } from "@reduxjs/toolkit";
import { popupReducer } from "@/features/popup";

const store = configureStore({
  reducer: {
    popup: popupReducer,
  },
});

export default store;