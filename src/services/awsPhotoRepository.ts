import { eventConfig } from "../config/event";
import type { NewPhotoRecord, PhotoRecord, PhotoStats } from "../types/photo";
import { emitPhotosUpdated } from "./photoEvents";
import type { PhotoRepository } from "./photoRepository";

interface ApiPhoto {
  photoId: string;
  optimizedUrl: string;
  originalFileName: string;
  originalContentType: string;
  originalSize: number;
  optimizedSize: number;
  guestName: string;
  message: string;
  uploadedAt: string;
  sequence: number;
}

interface ListResponse {
  photos: ApiPhoto[];
  stats: PhotoStats;
  nextCursor: string | null;
}

interface PresignUpload {
  clientId: string;
  photoId: string;
  originalUploadUrl: string;
  optimizedUploadUrl: string;
}

interface ApiErrorBody {
  error?: { message?: string };
}

const uploadAttempts = 3;

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "");
const configuredEventId =
  (import.meta.env.VITE_EVENT_ID as string | undefined) || eventConfig.eventId;

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error("VITE_API_BASE_URL is required when VITE_STORAGE_MODE=aws.");
  }
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(body.error?.message || `API request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

function toPhotoRecord(photo: ApiPhoto): PhotoRecord {
  return {
    id: photo.photoId,
    eventId: configuredEventId,
    originalFileName: photo.originalFileName,
    originalContentType: photo.originalContentType,
    optimizedContentType: "image/jpeg",
    originalSize: photo.originalSize,
    optimizedSize: photo.optimizedSize,
    guestName: photo.guestName,
    message: photo.message,
    uploaderSessionId: "",
    uploadedAt: photo.uploadedAt,
    sequence: photo.sequence,
    optimizedUrl: photo.optimizedUrl,
  };
}

async function uploadBlob(url: string, contentType: string, body: Blob) {
  let lastStatus: number | null = null;
  for (let attempt = 1; attempt <= uploadAttempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: { "content-type": contentType },
        body,
      });
      if (response.ok) return;
      lastStatus = response.status;
      if (response.status >= 400 && response.status < 500) break;
    } catch {
      // Temporary mobile-network interruptions are retried below.
    }
    if (attempt < uploadAttempts) {
      await new Promise((resolve) => globalThis.setTimeout(resolve, attempt * 600));
    }
  }
  throw new Error(
    lastStatus
      ? `Photo upload failed (${lastStatus}).`
      : "Photo upload failed because the connection was interrupted.",
  );
}

class AwsPhotoRepository implements PhotoRepository {
  private stats: PhotoStats = {
    photoCount: 0,
    contributorCount: 0,
    lastUploadedAt: null,
  };

  async listPhotos() {
    const photos: PhotoRecord[] = [];
    let cursor: string | null = null;
    do {
      const params = new URLSearchParams({ limit: "100" });
      if (cursor) params.set("cursor", cursor);
      const page: ListResponse = await apiRequest(
        `/api/events/${encodeURIComponent(configuredEventId)}/photos?${params}`,
      );
      photos.push(...page.photos.map(toPhotoRecord));
      this.stats = page.stats;
      cursor = page.nextCursor;
    } while (cursor);
    return photos;
  }

  async addPhotos(records: NewPhotoRecord[]) {
    const files = records.map((record) => ({
      clientId: crypto.randomUUID(),
      originalFileName: record.originalFileName,
      originalContentType: record.originalContentType,
      originalSize: record.originalSize,
      optimizedContentType: record.optimizedContentType,
      optimizedSize: record.optimizedSize,
    }));
    const presigned = await apiRequest<{ uploads: PresignUpload[] }>(
      `/api/events/${encodeURIComponent(configuredEventId)}/uploads/presign`,
      { method: "POST", body: JSON.stringify({ files }) },
    );
    for (const [index, upload] of presigned.uploads.entries()) {
      const record = records[index];
      if (!record.originalBlob || !record.optimizedBlob) {
        throw new Error("Photo blobs are required for upload.");
      }
      await Promise.all([
        uploadBlob(upload.originalUploadUrl, record.originalContentType, record.originalBlob),
        uploadBlob(upload.optimizedUploadUrl, "image/jpeg", record.optimizedBlob),
      ]);
    }
    await apiRequest(`/api/events/${encodeURIComponent(configuredEventId)}/submissions`, {
      method: "POST",
      body: JSON.stringify({
        photos: presigned.uploads.map((upload, index) => ({
          photoId: upload.photoId,
          guestName: records[index].guestName,
          message: records[index].message,
          uploaderSessionId: records[index].uploaderSessionId,
        })),
      }),
    });
    emitPhotosUpdated();
    const all = await this.listPhotos();
    const createdIds = new Set(presigned.uploads.map((upload) => upload.photoId));
    return all.filter((photo) => createdIds.has(photo.id));
  }

  async getOriginalDownloadUrl(id: string) {
    const result = await apiRequest<{ downloadUrl: string }>(
      `/api/events/${encodeURIComponent(configuredEventId)}/photos/${encodeURIComponent(id)}/download`,
      { method: "POST", body: "{}" },
    );
    return result.downloadUrl;
  }

  async getStats() {
    const page: ListResponse = await apiRequest(
      `/api/events/${encodeURIComponent(configuredEventId)}/photos?limit=1`,
    );
    this.stats = page.stats;
    return this.stats;
  }

  async deletePhoto() {
    throw new Error("Production deletion requires the authenticated organizer tool.");
  }

  async clearAll() {
    throw new Error("Bulk deletion is unavailable in AWS mode.");
  }

  async seedDemo() {
    throw new Error("Demo seeding is unavailable in AWS mode.");
  }
}

export const awsPhotoRepository = new AwsPhotoRepository();
