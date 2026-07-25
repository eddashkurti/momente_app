import { ArrowRight, Camera, Images } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import EmptyGallery from "../components/EmptyGallery";
import PhotoModal from "../components/PhotoModal";
import PhotoMosaic from "../components/PhotoMosaic";
import StatsPanel from "../components/StatsPanel";
import { eventConfig } from "../config/event";
import { usePhotos } from "../hooks/usePhotos";
import { usePhotoViewModels } from "../hooks/usePhotoViewModels";
import type { PhotoViewModel } from "../types/photo";

export default function HomePage() {
  const { photos, stats, loading } = usePhotos();
  const viewModels = usePhotoViewModels(photos);
  const recent = [...viewModels].reverse().slice(0, 6);
  const [selected, setSelected] = useState<PhotoViewModel | null>(null);

  return (
    <>
      <section className="hero page-container">
        <div className="invitation-card">
          <span className="hero-kicker">Mirë se vini në dasmën e</span>
          <h1>{eventConfig.couple.first} <em>&</em> {eventConfig.couple.second}</h1>
          <div className="hero-date"><span />{eventConfig.dateDisplay}<span /></div>
          <p>Ndani momentet tuaja dhe shikoni kujtimet që po krijohen gjatë kësaj dite të veçantë.</p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" to="/upload">
              <Camera size={19} /> Ndaj momentet e tua
            </Link>
            <Link className="button button-secondary button-large" to="/gallery">
              <Images size={19} /> Shiko galerinë
            </Link>
          </div>
        </div>
      </section>

      <section className="page-container home-stats">
        <StatsPanel stats={stats} />
      </section>

      <section className="page-container recent-section">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">Momente të fundit</span>
            <h2>Fotografitë e ndara së fundmi</h2>
          </div>
          {photos.length > 0 && (
            <Link className="text-link" to="/gallery">Shiko të gjitha <ArrowRight size={17} /></Link>
          )}
        </div>
        {loading ? <div className="loading-grid" /> : recent.length ? (
          <PhotoMosaic photos={recent} onOpen={setSelected} compact />
        ) : (
          <EmptyGallery compact />
        )}
      </section>
      <PhotoModal photo={selected} onClose={() => setSelected(null)} />
    </>
  );
}
