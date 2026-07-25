import { Camera } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import EmptyGallery from "../components/EmptyGallery";
import PhotoModal from "../components/PhotoModal";
import PhotoMosaic from "../components/PhotoMosaic";
import StatsPanel from "../components/StatsPanel";
import { isGalleryOpen } from "../config/event";
import { usePhotos } from "../hooks/usePhotos";
import { usePhotoViewModels } from "../hooks/usePhotoViewModels";
import type { PhotoViewModel } from "../types/photo";

export default function GalleryPage() {
  const { photos, stats, loading, error } = usePhotos(15000);
  const viewModels = usePhotoViewModels(photos);
  const [selected, setSelected] = useState<PhotoViewModel | null>(null);

  if (!isGalleryOpen()) {
    return (
      <section className="page-container narrow-page closed-state">
        <span className="eyebrow">Galeria</span>
        <h1>Galeria publike është mbyllur.</h1>
        <p>Faleminderit që ndatë dhe ruajtët këto momente me çiftin.</p>
      </section>
    );
  }

  return (
    <section className="page-container gallery-page">
      <div className="gallery-heading">
        <div className="page-title page-title-left">
          <span className="eyebrow">Galeria e përbashkët</span>
          <h1>Momentet e Enisit dhe Agnesës</h1>
          <p>Fotografitë shfaqen sipas radhës së ngarkimit. Hapeni një fotografi për ta parë dhe shkarkuar origjinalin.</p>
        </div>
        <Link className="button button-primary" to="/upload"><Camera size={18} /> Ndaj fotografi</Link>
      </div>
      <StatsPanel stats={stats} />
      {error && <div className="error-list"><p>{error}</p></div>}
      {loading ? <div className="loading-grid loading-grid-large" /> : viewModels.length ? (
        <PhotoMosaic photos={viewModels} onOpen={setSelected} />
      ) : (
        <EmptyGallery />
      )}
      <PhotoModal photo={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
