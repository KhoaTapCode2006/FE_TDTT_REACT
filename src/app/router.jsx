import { Routes, Route, createBrowserRouter } from "react-router-dom";
import { LoginPage } from "@/pages/LoginPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}