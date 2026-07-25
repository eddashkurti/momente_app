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

    if (!eventConfig.upload.acceptedTypes.includes(file.type as never)) {
      const isHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
      errors.push(
        isHeic
          ? `${file.name}: formati HEIC nuk mbështetet ende. Zgjidhni JPG, PNG ose WebP.`
          : `${file.name}: formati nuk mbështetet.`,
      );
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

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}
