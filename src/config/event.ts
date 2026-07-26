export const eventConfig = {
  appName: "Momente",
  eventId: "enis-agnesa-2026",
  couple: {
    first: "Enis",
    second: "Agnesa",
    display: "Enis & Agnesa",
  },
  dateISO: "2026-08-08",
  dateDisplay: "08.08.2026",
  galleryClosesAt: "2026-08-11T23:59:59+02:00",
  thankYouModeStartsAt: "2026-08-09T00:00:00+02:00",
  upload: {
    maxFiles: 5,
    maxFileSizeBytes: 10 * 1024 * 1024,
    acceptedTypes: [
      "image/jpeg", "image/png", "image/webp", "image/heic",
      "image/heif", "image/avif", "image/gif", "image/bmp",
    ],
    acceptedExtensions: [
      ".jpg", ".jpeg", ".jfif", ".png", ".webp",
      ".heic", ".heif", ".avif", ".gif", ".bmp",
    ],
    maxNameLength: 40,
    maxMessageLength: 120,
  },
  slideshow: {
    regularDurationMs: 9000,
    featuredDurationMs: 14000,
    refreshIntervalMs: 15000,
    thankYouDurationMs: 12000,
  },
  footer:
    "Momente u krijua me 🤍 nga Edda për Enisin dhe Agnesën.",
} as const;

export function isGalleryOpen(now = new Date()) {
  return now.getTime() <= new Date(eventConfig.galleryClosesAt).getTime();
}

export function isThankYouMode(now = new Date()) {
  const forced = new URLSearchParams(window.location.search).get("thankyou") === "1";
  return forced || now.getTime() >= new Date(eventConfig.thankYouModeStartsAt).getTime();
}
