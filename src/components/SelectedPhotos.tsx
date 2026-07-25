import { Trash2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { formatFileSize } from "../utils/format";

interface SelectedPhotosProps {
  files: File[];
  disabled?: boolean;
  onRemove: (index: number) => void;
}

export default function SelectedPhotos({ files, disabled, onRemove }: SelectedPhotosProps) {
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  if (!files.length) return null;

  return (
    <section className="selected-section">
      <div className="section-heading-row">
        <div>
          <span className="eyebrow">Të zgjedhura</span>
          <h2>{files.length} nga 5 fotografi</h2>
        </div>
      </div>
      <div className="selected-grid">
        {files.map((file, index) => (
          <article className="selected-card" key={`${file.name}-${file.lastModified}`}>
            <img src={previews[index]} alt={`Parapamje e ${file.name}`} />
            <div className="selected-card-info">
              <strong title={file.name}>{file.name}</strong>
              <span>{formatFileSize(file.size)}</span>
            </div>
            <button type="button" disabled={disabled} onClick={() => onRemove(index)} aria-label={`Hiq ${file.name}`}>
              <Trash2 size={17} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
