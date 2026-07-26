import { LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { usePhotos } from "../hooks/usePhotos";
import { usePhotoViewModels } from "../hooks/usePhotoViewModels";
import { deletePhotoAsOrganizer } from "../services/organizerApi";
import {
  completeNewOrganizerPassword,
  getOrganizerSession,
  type NewPasswordChallenge,
  signInOrganizer,
  signOutOrganizer,
} from "../services/organizerAuth";

export default function OrganizerPage() {
  const { photos, loading: photosLoading, error: photosError, refresh } = usePhotos();
  const viewModels = usePhotoViewModels(photos);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [challenge, setChallenge] = useState<NewPasswordChallenge | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getOrganizerSession()
      .then((session) => setAccessToken(session?.getAccessToken().getJwtToken() ?? null))
      .catch(() => setAccessToken(null))
      .finally(() => setCheckingSession(false));
  }, []);

  async function submitLogin(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await signInOrganizer(email, password);
      if (result.status === "NEW_PASSWORD_REQUIRED") {
        setChallenge(result.challenge);
        setPassword("");
      } else {
        setAccessToken(result.session.getAccessToken().getJwtToken());
        setPassword("");
      }
    } catch {
      setMessage("Emaili ose fjalëkalimi nuk është i saktë.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitNewPassword(event: FormEvent) {
    event.preventDefault();
    if (!challenge) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const session = await completeNewOrganizerPassword(challenge, newPassword);
      setAccessToken(session.getAccessToken().getJwtToken());
      setChallenge(null);
      setNewPassword("");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Fjalëkalimi nuk mund të ruhej.");
    } finally {
      setSubmitting(false);
    }
  }

  function logout() {
    signOutOrganizer();
    setAccessToken(null);
    setEmail("");
    setMessage(null);
  }

  async function removePhoto(photoId: string, filename: string) {
    if (!accessToken) return;
    const confirmed = window.confirm(
      `Ta fshijmë përgjithmonë fotografinë “${filename}”? Ky veprim nuk mund të zhbëhet.`,
    );
    if (!confirmed) return;

    setDeletingId(photoId);
    setMessage(null);
    try {
      await deletePhotoAsOrganizer(photoId, accessToken);
      await refresh();
      setMessage("Fotografia u fshi.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Fotografia nuk mund të fshihej.");
    } finally {
      setDeletingId(null);
    }
  }

  if (checkingSession) {
    return (
      <section className="page-container narrow-page organizer-page organizer-loading">
        Duke kontrolluar hyrjen…
      </section>
    );
  }

  if (!accessToken) {
    return (
      <section className="page-container narrow-page organizer-page">
        <div className="page-title">
          <ShieldCheck size={28} />
          <span className="eyebrow">Vetëm për organizatoren</span>
          <h1>Menaxho fotografitë</h1>
        </div>

        {challenge ? (
          <form className="organizer-login" onSubmit={submitNewPassword}>
            <p>Vendosni një fjalëkalim të ri për hyrjen e parë.</p>
            <label className="field">
              <span>Fjalëkalimi i ri</span>
              <input
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </label>
            <small>Të paktën 12 karaktere, me shkronjë të madhe, të vogël, numër dhe simbol.</small>
            <button className="button button-primary button-full" disabled={submitting}>
              {submitting ? "Duke ruajtur…" : "Ruaj fjalëkalimin"}
            </button>
          </form>
        ) : (
          <form className="organizer-login" onSubmit={submitLogin}>
            <label className="field">
              <span>Emaili</span>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Fjalëkalimi</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button className="button button-primary button-full" disabled={submitting}>
              {submitting ? "Duke hyrë…" : "Hyr"}
            </button>
          </form>
        )}
        {message && <p className="organizer-message" role="alert">{message}</p>}
      </section>
    );
  }

  return (
    <section className="page-container organizer-page">
      <div className="organizer-heading">
        <div className="page-title page-title-left">
          <span className="eyebrow">Zona e organizatores</span>
          <h1>Menaxho fotografitë</h1>
          <p>Fshini vetëm fotografitë që nuk duhet të shfaqen në galeri ose slideshow.</p>
        </div>
        <button className="button button-secondary" type="button" onClick={logout}>
          <LogOut size={17} /> Dil
        </button>
      </div>

      {message && <p className="organizer-message" role="status">{message}</p>}
      {photosError && <p className="organizer-message" role="alert">{photosError}</p>}
      {photosLoading ? (
        <div className="loading-grid" />
      ) : viewModels.length === 0 ? (
        <div className="empty-gallery"><p>Nuk ka fotografi për të menaxhuar.</p></div>
      ) : (
        <div className="organizer-photo-list">
          {viewModels.map((photo) => (
            <article key={photo.id}>
              <img src={photo.optimizedUrl} alt="" />
              <div>
                <strong>{photo.guestName || "Pa emër"}</strong>
                <span>{photo.originalFileName}</span>
                {photo.message && <p>{photo.message}</p>}
              </div>
              <button
                className="organizer-delete"
                type="button"
                disabled={deletingId === photo.id}
                onClick={() => void removePhoto(photo.id, photo.originalFileName)}
                aria-label={`Fshi ${photo.originalFileName}`}
              >
                <Trash2 size={19} />
                {deletingId === photo.id ? "Duke fshirë…" : "Fshi"}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
