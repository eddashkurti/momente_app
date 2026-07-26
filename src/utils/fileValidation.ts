import { eventConfig } from "../config/event";

export interface FileValidationResult {
  valid: File[];
  errors: string[];
}

export function validateSelectedFiles(files: File[], alreadySelected: File[] = []): FileValidationResult {
  const errors: string[] = [];
  const availableSlots = eventConfig.upload.maxFiles - alreadySelected.length;
  const candidates = files.slice(0, Math.max(availableSlots, 0));

  if (files.length > availableSlots) {
    errors.push(`Mund të zgjidhni maksimumi ${eventConfig.upload.maxFiles} fotografi në një ngarkim.`);
  }

  const existingKeys = new Set(alreadySelected.map(fileKey));
  const valid = candidates.filter((file) => {
    const key = fileKey(file);
    if (existingKeys.has(key)) {
      errors.push(`${file.name} është zgjedhur tashmë.`);
      return false;
    }
    existingKeys.add(key);

    if (!getSupportedContentType(file)) {
      errors.push(`${file.name}: formati nuk mbështetet.`);
      return false;
    }

    if (file.size === 0) {
      errors.push(`${file.name}: skedari është bosh.`);
      return false;
    }

    if (file.size > eventConfig.upload.maxFileSizeBytes) {
      errors.push(`${file.name}: fotografia është më e madhe se 10 MB.`);
      return false;
    }

    return true;
  });

  return { valid, errors };
}

export function getSupportedContentType(file: File) {
  const mime = file.type.toLowerCase().split(";")[0].trim();
  const extension = file.name.match(/\.([^.]+)$/)?.[1]?.toLowerCase();
  const canonicalByMime: Record<string, string> = {
    "image/jpeg": "image/jpeg",
    "image/jpg": "image/jpeg",
    "image/pjpeg": "image/jpeg",
    "image/png": "image/png",
    "image/x-png": "image/png",
    "image/webp": "image/webp",
    "image/heic": "image/heic",
    "image/heif": "image/heif",
    "image/avif": "image/avif",
    "image/gif": "image/gif",
    "image/bmp": "image/bmp",
    "image/x-ms-bmp": "image/bmp",
  };
  const canonicalByExtension: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    jfif: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
    avif: "image/avif",
    gif: "image/gif",
    bmp: "image/bmp",
  };
  const canonical = canonicalByMime[mime] ?? (extension ? canonicalByExtension[extension] : null);
  return canonical && eventConfig.upload.acceptedTypes.includes(canonical as never) ? canonical : null;
}

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}
