import { Expand, Pause, Play, QrCode } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import EmptyGallery from "../components/EmptyGallery";
import { eventConfig, isThankYouMode } from "../config/event";
import { usePhotos } from "../hooks/usePhotos";
import { usePhotoViewModels } from "../hooks/usePhotoViewModels";

export default function SlideshowPage() {
  const { photos, stats } = usePhotos(eventConfig.slideshow.refreshIntervalMs);
  const viewModels = usePhotoViewModels(photos);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const uploadUrl = useMemo(() => {
    const configuredUrl = (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined)?.replace(
      /\/$/,
      "",
    );
    return `${configuredUrl || window.location.origin}/`;
  }, []);
  const current = viewModels[index] ?? null;

  useEffect(() => {
    if (index >= viewModels.length && viewModels.length > 0) setIndex(0);
  }, [index, viewModels.length]);

  useEffect(() => {
    if (paused || viewModels.length === 0) return;
    const duration = showThankYou
      ? eventConfig.slideshow.thankYouDurationMs
      : featured
        ? eventConfig.slideshow.featuredDurationMs
        : eventConfig.slideshow.regularDurationMs;

    const timer = window.setTimeout(() => {
      if (showThankYou) {
        setShowThankYou(false);
        setIndex(0);
        setFeatured(false);
        return;
      }
      const next = index + 1;
      if (next >= viewModels.length) {
        if (isThankYouMode()) {
          setShowThankYou(true);
          return;
        }
        setIndex(0);
      } else {
        setIndex(next);
      }
      setFeatured(Math.random() < 0.2);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [featured, index, paused, showThankYou, viewModels.length]);

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === " ") {
        event.preventDefault();
        setPaused((value) => !value);
      }
      if (event.key === "ArrowRight" && viewModels.length) {
        setIndex((value) => (value + 1) % viewModels.length);
      }
      if (event.key === "ArrowLeft" && viewModels.length) {
        setIndex((value) => (value - 1 + viewModels.length) % viewModels.length);
      }
      if (event.key.toLowerCase() === "f") void document.documentElement.requestFullscreen?.();
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [viewModels.length]);

  if (!current && !showThankYou) {
    return (
      <main className="slideshow slideshow-empty">
        <div className="slideshow-brand">Momente <span>·</span> Enis & Agnesa</div>
        <EmptyGallery compact />
        <SlideshowQr uploadUrl={uploadUrl} />
      </main>
    );
  }

  return (
    <main className="slideshow">
      <div className="slideshow-brand">Momente <span>·</span> Enis & Agnesa</div>
      {showThankYou ? (
        <section className="thank-you-slide">
          <span>🤍</span>
          <h1>Faleminderit!</h1>
          <p>Ju falënderojmë që ishit pjesë e ditës sonë dhe ndatë këto momente me ne.</p>
          <strong>Enis & Agnesa</strong>
          <small>{eventConfig.dateDisplay}</small>
          <div className="thank-you-stats">{stats.photoCount} fotografi · {stats.contributorCount} kontribues</div>
        </section>
      ) : current ? (
        <>
          <div className="slideshow-photo-frame" key={current.id}>
            <img src={current.optimizedUrl} alt="Fotografi nga dasma" />
          </div>
          {(current.guestName || current.message) && (
            <div className="slideshow-caption">
              {current.guestName && <strong>{current.guestName}</strong>}
              {current.message && <p>“{current.message}”</p>}
            </div>
          )}
          {featured && <div className="featured-badge">Momenti i veçantë</div>}
        </>
      ) : null}

      <SlideshowQr uploadUrl={uploadUrl} />
      <div className="slideshow-controls">
        <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Vazhdo" : "Pauzo"}>
          {paused ? <Play /> : <Pause />}
        </button>
        <button type="button" onClick={() => void document.documentElement.requestFullscreen?.()} aria-label="Ekran i plotë">
          <Expand />
        </button>
      </div>
    </main>
  );
}

function SlideshowQr({ uploadUrl }: { uploadUrl: string }) {
  return (
    <aside className="slideshow-qr">
      <QRCodeSVG value={uploadUrl} size={108} bgColor="#fffaf3" fgColor="#28211c" level="M" />
      <div><QrCode size={16} /><strong>Skano dhe ndaj</strong><span>fotografitë e tua</span></div>
    </aside>
  );
}
