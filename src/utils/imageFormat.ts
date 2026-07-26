export type ImageFormatKind =
  | "jpeg"
  | "png"
  | "webp"
  | "gif"
  | "bmp"
  | "tiff"
  | "heic"
  | "heif"
  | "avif"
  | "jpeg-xl"
  | "jpeg-2000"
  | "qoi"
  | "psd"
  | "ico";

export interface DetectedImageFormat {
  kind: ImageFormatKind;
  mimeType: string;
  extension: string;
}

const FORMAT_DETAILS: Record<ImageFormatKind, Omit<DetectedImageFormat, "kind">> = {
  jpeg: { mimeType: "image/jpeg", extension: ".jpg" },
  png: { mimeType: "image/png", extension: ".png" },
  webp: { mimeType: "image/webp", extension: ".webp" },
  gif: { mimeType: "image/gif", extension: ".gif" },
  bmp: { mimeType: "image/bmp", extension: ".bmp" },
  tiff: { mimeType: "image/tiff", extension: ".tiff" },
  heic: { mimeType: "image/heic", extension: ".heic" },
  heif: { mimeType: "image/heif", extension: ".heif" },
  avif: { mimeType: "image/avif", extension: ".avif" },
  "jpeg-xl": { mimeType: "image/jxl", extension: ".jxl" },
  "jpeg-2000": { mimeType: "image/jp2", extension: ".jp2" },
  qoi: { mimeType: "image/qoi", extension: ".qoi" },
  psd: { mimeType: "image/vnd.adobe.photoshop", extension: ".psd" },
  ico: { mimeType: "image/x-icon", extension: ".ico" },
};

const GENERIC_BINARY_TYPES = new Set(["", "application/octet-stream", "binary/octet-stream"]);

export async function detectImageFormat(blob: Blob) {
  const prefix = new Uint8Array(await blob.slice(0, 4096).arrayBuffer());
  return detectImageFormatFromBytes(prefix);
}

export function detectImageFormatFromBytes(bytes: Uint8Array): DetectedImageFormat | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return details("jpeg");
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return details("png");
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return details("webp");
  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") return details("gif");
  if (ascii(bytes, 0, 2) === "BM") return details("bmp");
  if (
    startsWith(bytes, [0x49, 0x49, 0x2a, 0x00])
    || startsWith(bytes, [0x4d, 0x4d, 0x00, 0x2a])
  ) {
    return details("tiff");
  }
  if (startsWith(bytes, [0xff, 0x0a])) return details("jpeg-xl");
  if (startsWith(bytes, [0x00, 0x00, 0x00, 0x0c, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a])) {
    return details("jpeg-xl");
  }
  if (
    startsWith(bytes, [0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20, 0x0d, 0x0a, 0x87, 0x0a])
    || startsWith(bytes, [0xff, 0x4f, 0xff, 0x51])
  ) {
    return details("jpeg-2000");
  }
  if (ascii(bytes, 0, 4) === "qoif") return details("qoi");
  if (ascii(bytes, 0, 4) === "8BPS") return details("psd");
  if (startsWith(bytes, [0x00, 0x00, 0x01, 0x00])) return details("ico");

  const isoFormat = detectIsoBaseMediaFormat(bytes);
  return isoFormat ? details(isoFormat) : null;
}

export function canAttemptImageDecode(file: File, detected: DetectedImageFormat | null) {
  if (detected) return true;
  const mime = normalizeMime(file.type);
  return GENERIC_BINARY_TYPES.has(mime) || (mime.startsWith("image/") && mime !== "image/svg+xml");
}

export function getOriginalUploadContentType(
  file: File,
  detected: DetectedImageFormat | null,
) {
  if (detected) return detected.mimeType;
  const mime = normalizeMime(file.type);
  return mime.startsWith("image/") && mime !== "image/svg+xml"
    ? mime
    : "application/octet-stream";
}

export function isHeifFamily(format: DetectedImageFormat | null) {
  return format?.kind === "heic" || format?.kind === "heif";
}

function detectIsoBaseMediaFormat(bytes: Uint8Array): "heic" | "heif" | "avif" | null {
  if (ascii(bytes, 4, 4) !== "ftyp") return null;
  const brands = new Set<string>();
  for (let offset = 8; offset + 4 <= Math.min(bytes.length, 80); offset += 4) {
    brands.add(ascii(bytes, offset, 4));
  }
  if (brands.has("avif") || brands.has("avis")) return "avif";
  if (["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs"].some((brand) => brands.has(brand))) {
    return "heic";
  }
  if (brands.has("mif1") || brands.has("msf1")) return "heif";
  return null;
}

function details(kind: ImageFormatKind): DetectedImageFormat {
  return { kind, ...FORMAT_DETAILS[kind] };
}

function normalizeMime(value: string) {
  return value.toLowerCase().split(";")[0].trim();
}

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function ascii(bytes: Uint8Array, offset: number, length: number) {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}
