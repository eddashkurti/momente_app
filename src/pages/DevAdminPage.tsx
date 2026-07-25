import { Database, Trash2 } from "lucide-react";
import { photoRepository } from "../services";
import { usePhotos } from "../hooks/usePhotos";
import { usePhotoViewModels } from "../hooks/usePhotoViewModels";

export default function DevAdminPage() {
  const { photos } = usePhotos();
  const viewModels = usePhotoViewModels(photos);

  return (
    <section className="page-container dev-admin">
      <div className="page-title page-title-left">
        <span className="eyebrow">Vetëm në development</span>
        <h1>Kontrollet lokale</h1>
        <p>Kjo faqe nuk përfshihet si rrugë në build-in e prodhimit. Autentikimi real do të shtohet në fazën AWS.</p>
      </div>
      <div className="dev-actions">
        <button className="button button-primary" type="button" onClick={() => void photoRepository.seedDemo()}><Database size={18} /> Mbush me fotografi demo</button>
        <button className="button button-danger" type="button" onClick={() => void photoRepository.clearAll()}><Trash2 size={18} /> Fshi të gjitha</button>
      </div>
      <div className="dev-photo-list">
        {viewModels.map((photo) => (
          <article key={photo.id}>
            <img src={photo.optimizedUrl} alt="" />
            <div><strong>{photo.guestName || "Pa emër"}</strong><span>{photo.originalFileName}</span></div>
            <button type="button" onClick={() => void photoRepository.deletePhoto(photo.id)} aria-label="Fshi"><Trash2 /></button>
          </article>
        ))}
      </div>
    </section>
  );
}
