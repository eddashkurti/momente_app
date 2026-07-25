export interface PhotoRecord {
  id: string;
  eventId: string;
  originalFileName: string;
  originalContentType: string;
  optimizedContentType: "image/jpeg";
  originalSize: number;
  optimizedSize: number;
  guestName: string;
  message: string;
  uploaderSessionId: string;
  uploadedAt: string;
  sequence: number;
  originalBlob?: Blob;
  optimizedBlob?: Blob;
  optimizedUrl?: string;
}

export type NewPhotoRecord = Omit<PhotoRecord, "id" | "uploadedAt" | "sequence">;

export interface PhotoStats {
  photoCount: number;
  contributorCount: number;
  lastUploadedAt: string | null;
}

export interface PhotoViewModel extends PhotoRecord {
  optimizedUrl: string;
}
