import { Check, Images, RotateCcw, Send, XCircle } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import FloatingHearts from "../components/FloatingHearts";
import SelectedPhotos from "../components/SelectedPhotos";
import UploadDropzone from "../components/UploadDropzone";
import { eventConfig, isGalleryOpen } from "../config/event";
import { useUploadPhotos } from "../hooks/useUploadPhotos";
import { validateSelectedFiles } from "../utils/fileValidation";

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [guestName, setGuestName] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [showHearts, setShowHearts] = useState(false);
  const { upload, progress, stage, uploading, reset } = useUploadPhotos();
  const galleryOpen = isGalleryOpen();

  function addFiles(next: File[]) {
    const result = validateSelectedFiles(next, files);
    setFiles((current) => [...current, ...result.valid]);
    setErrors(result.errors);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!files.length) {
      setErrors(["Zgjidhni të paktën një fotografi."]);
      return;
    }

    setErrors([]);
    try {
      const count = await upload({ files, guestName, message });
      setSuccessCount(count);
      setShowHearts(true);
      window.setTimeout(() => setShowHearts(false), 1800);
      setFiles([]);
      setGuestName("");
      setMessage("");
    } catch (caught) {
      console.error(caught);
      setErrors(["Ngarkimi dështoi. Provoni përsëri."]);
    }
  }

  function startAnother() {
    setSuccessCount(0);
    reset();
  }

  if (!galleryOpen) {
    return (
      <section className="page-container narrow-page closed-state">
        <span className="eyebrow">Momente</span>
        <h1>Ngarkimet janë mbyllur.</h1>
        <p>Faleminderit që ndatë fotografitë tuaja me Enisin dhe Agnesën.</p>
      </section>
    );
  }

  return (
    <section className="page-container narrow-page upload-page">
      <FloatingHearts active={showHearts} />
      <div className="page-title">
        <span className="eyebrow">Ndaj një kujtim</span>
        <h1>Ngarko fotografitë e tua</h1>
      </div>

      {successCount > 0 ? (
        <div className="success-card">
          <div className="success-icon"><Check /></div>
          <span className="eyebrow">Faleminderit</span>
          <h2>{successCount === 1 ? "Fotografia u nda me sukses." : `${successCount} fotografi u ndanë me sukses.`}</h2>
          <p>Momentet tuaja tani janë pjesë e galerisë dhe radhës së slideshow-it.</p>
          <div className="success-actions">
            <button className="button button-secondary" type="button" onClick={startAnother}>
              <RotateCcw size={18} /> Ngarko të tjera
            </button>
            <Link className="button button-primary" to="/gallery">
              <Images size={18} /> Shiko galerinë
            </Link>
          </div>
        </div>
      ) : (
        <form className="upload-form" onSubmit={submit}>
          <UploadDropzone disabled={uploading || files.length >= eventConfig.upload.maxFiles} onFiles={addFiles} />
          <SelectedPhotos files={files} disabled={uploading} onRemove={(index) => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} />

          <div className="form-grid">
            <label className="field">
              <span>Emri <small>opsional</small></span>
              <input
                value={guestName}
                maxLength={eventConfig.upload.maxNameLength}
                disabled={uploading}
                placeholder="P.sh. Arta"
                onChange={(event: ChangeEvent<HTMLInputElement>) => setGuestName(event.target.value)}
              />
              <small>{guestName.length}/{eventConfig.upload.maxNameLength}</small>
            </label>
            <label className="field field-wide">
              <span>Mesazhi për çiftin <small>opsional</small></span>
              <textarea
                value={message}
                maxLength={eventConfig.upload.maxMessageLength}
                rows={4}
                disabled={uploading}
                placeholder="Shkruani një urim të shkurtër…"
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setMessage(event.target.value)}
              />
              <small>{message.length}/{eventConfig.upload.maxMessageLength}</small>
            </label>
          </div>

          {errors.length > 0 && (
            <div className="error-list" role="alert">
              <XCircle size={20} />
              <div>{errors.map((error) => <p key={error}>{error}</p>)}</div>
            </div>
          )}

          {uploading && (
            <div className="upload-progress" aria-live="polite">
              <div className="progress-label"><span>{stage}</span><strong>{progress}%</strong></div>
              <div className="progress-track"><div style={{ width: `${progress}%` }} /></div>
            </div>
          )}

          <p className="privacy-note">Duke ngarkuar fotografi, pranoni që ato të shfaqen në ekranin e dasmës dhe në galerinë e përbashkët.</p>
          <button className="button button-primary button-large button-full" type="submit" disabled={uploading || files.length === 0}>
            <Send size={18} /> {uploading ? "Po ndahen momentet…" : `Ndaj ${files.length || ""} ${files.length === 1 ? "fotografi" : "fotografi"}`}
          </button>
        </form>
      )}
    </section>
  );
}
