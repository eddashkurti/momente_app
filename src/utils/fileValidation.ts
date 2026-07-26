import { eventConfig } from "../config/event";
import {
  canAttemptImageDecode,
  detectImageFormat,
  getOriginalUploadContentType,
} from "./imageFormat";

export interface FileValidationResult {
  valid: File[];
  errors: string[];
}

export async function validateSelectedFiles(
  files: File[],
  alreadySelected: File[] = [],
): Promise<FileValidationResult> {
  const errors: string[] = [];
  const availableSlots = eventConfig.upload.maxFiles - alreadySelected.length;
  const candidates = files.slice(0, Math.max(availableSlots, 0));

  if (files.length > availableSlots) {
    errors.push(`Mund të zgjidhni maksimumi ${eventConfig.upload.maxFiles} fotografi në një ngarkim.`);
  }

  const existingKeys = new Set(alreadySelected.map(fileKey));
  const valid: File[] = [];
  for (const file of candidates) {
    const key = fileKey(file);
    if (existingKeys.has(key)) {
      errors.push(`${file.name} është zgjedhur tashmë.`);
      continue;
    }
    existingKeys.add(key);

    if (file.size === 0) {
      errors.push(`${file.name}: skedari është bosh.`);
      continue;
    }

    if (file.size > eventConfig.upload.maxFileSizeBytes) {
      errors.push(`${file.name}: fotografia është më e madhe se 10 MB.`);
      continue;
    }

    const detected = await detectImageFormat(file);
    if (!canAttemptImageDecode(file, detected)) {
      errors.push(`${file.name}: skedari nuk është një fotografi e vlefshme.`);
      continue;
    }
    valid.push(file);
  }

  return { valid, errors };
}

export async function getSupportedContentType(file: File) {
  const detected = await detectImageFormat(file);
  return canAttemptImageDecode(file, detected)
    ? getOriginalUploadContentType(file, detected)
    : null;
}

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}
