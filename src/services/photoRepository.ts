import type { NewPhotoRecord, PhotoRecord, PhotoStats } from "../types/photo";

export interface PhotoRepository {
  listPhotos(): Promise<PhotoRecord[]>;
  addPhotos(records: NewPhotoRecord[]): Promise<PhotoRecord[]>;
  deletePhoto(id: string): Promise<void>;
  clearAll(): Promise<void>;
  getStats(): Promise<PhotoStats>;
  seedDemo(): Promise<void>;
}
