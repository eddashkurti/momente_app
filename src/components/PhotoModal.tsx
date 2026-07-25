import { Download, X } from "lucide-react";
import { useEffect } from "react";
import type { PhotoViewModel } from "../types/photo";
import { formatFileSize, formatUploadDate } from "../utils/format";

interface PhotoModalProps {
  photo: PhotoViewModel | null;
  onClose: () => void;
}

export default function PhotoModal({ photo, onClose }: PhotoModalProps) {
  useEffect(() => {
    if (!photo) return;
    const handler = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", handler);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handler);
    };
  }, [photo, onClose]);

  if (!photo) return null;
  const currentPhoto = photo;

  function downloadOriginal() {
    const link = document.createElement("a");
    link.href = currentPhoto.originalUrl;
    link.download = currentPhoto.originalFileName || `momente-${currentPhoto.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <div className="photo-modal" role="dialog" aria-modal="true" aria-label="Fotografia e hapur">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="Mbyll fotografinë" />
      <div className="modal-panel">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Mbyll">
          <X />
        </button>
        <div className="modal-image-wrap">
          <img src={photo.optimizedUrl} alt="Fotografia e zgjedhur" />
        </div>
        <div className="modal-details">
          {(photo.guestName || photo.message) && (
            <div className="modal-caption">
              {photo.guestName && <strong>{photo.guestName}</strong>}
              {photo.message && <p>“{photo.message}”</p>}
            </div>
          )}
          <div className="modal-meta">
            <span>{formatUploadDate(photo.uploadedAt)}</span>
            <span>Origjinali: {formatFileSize(photo.originalSize)}</span>
          </div>
          <button className="button button-primary button-full" type="button" onClick={downloadOriginal}>
            <Download size={18} /> Shkarko origjinalin
          </button>
        </div>
      </div>
    </div>
  );
}
