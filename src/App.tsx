import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import UploadPage from "./pages/UploadPage";
import GalleryPage from "./pages/GalleryPage";
import SlideshowPage from "./pages/SlideshowPage";
import NotFoundPage from "./pages/NotFoundPage";
import DevAdminPage from "./pages/DevAdminPage";
import OrganizerPage from "./pages/OrganizerPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/organizer" element={<OrganizerPage />} />
        {import.meta.env.DEV && <Route path="/dev-admin" element={<DevAdminPage />} />}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="/slideshow" element={<SlideshowPage />} />
    </Routes>
  );
}
