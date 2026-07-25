import type { PhotoViewModel } from "../types/photo";

interface PhotoMosaicProps {
  photos: PhotoViewModel[];
  onOpen: (photo: PhotoViewModel) => void;
  limit?: number;
  compact?: boolean;
}

export default function PhotoMosaic({ photos, onOpen, limit, compact = false }: PhotoMosaicProps) {
  const displayed = typeof limit === "number" ? photos.slice(0, limit) : photos;
  return (
    <div className={`photo-mosaic${compact ? " photo-mosaic-compact" : ""}`}>
      {displayed.map((photo, index) => (
        <button
          className={`mosaic-item mosaic-pattern-${index % 7}`}
          key={photo.id}
          type="button"
          aria-label={`Hap fotografinë ${index + 1}`}
          onClick={() => onOpen(photo)}
        >
          <img src={photo.optimizedUrl} alt={photo.guestName ? `Fotografi nga ${photo.guestName}` : "Fotografi nga dasma"} />
        </button>
      ))}
    </div>
  );
}
