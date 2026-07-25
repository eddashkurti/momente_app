import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { eventConfig } from "../config/event";
import type { NewPhotoRecord, PhotoRecord, PhotoStats } from "../types/photo";
import type { PhotoRepository } from "./photoRepository";
import { emitPhotosUpdated } from "./photoEvents";

interface MomenteDB extends DBSchema {
  photos: {
    key: string;
    value: PhotoRecord;
    indexes: { "by-sequence": number; "by-uploaded-at": string };
  };
}

class LocalPhotoRepository implements PhotoRepository {
  private dbPromise: Promise<IDBPDatabase<MomenteDB>>;

  constructor() {
    this.dbPromise = openDB<MomenteDB>("momente-local-db", 1, {
      upgrade(db: IDBPDatabase<MomenteDB>) {
        const store = db.createObjectStore("photos", { keyPath: "id" });
        store.createIndex("by-sequence", "sequence");
        store.createIndex("by-uploaded-at", "uploadedAt");
      },
    });
  }

  async listPhotos() {
    const db = await this.dbPromise;
    return (await db.getAllFromIndex("photos", "by-sequence")).sort(
      (a, b) => a.sequence - b.sequence,
    );
  }

  async addPhotos(records: NewPhotoRecord[]) {
    const db = await this.dbPromise;
    const existing = await db.getAllFromIndex("photos", "by-sequence");
    let sequence = existing.length ? Math.max(...existing.map((photo) => photo.sequence)) + 1 : 1;
    const baseTime = Date.now();
    const created: PhotoRecord[] = records.map((record, index) => ({
      ...record,
      id: crypto.randomUUID(),
      uploadedAt: new Date(baseTime + index).toISOString(),
      sequence: sequence++,
    }));

    const tx = db.transaction("photos", "readwrite");
    await Promise.all([...created.map((record) => tx.store.put(record)), tx.done]);
    emitPhotosUpdated();
    return created;
  }

  async deletePhoto(id: string) {
    const db = await this.dbPromise;
    await db.delete("photos", id);
    emitPhotosUpdated();
  }

  async clearAll() {
    const db = await this.dbPromise;
    await db.clear("photos");
    emitPhotosUpdated();
  }

  async getStats(): Promise<PhotoStats> {
    const photos = await this.listPhotos();
    return {
      photoCount: photos.length,
      contributorCount: new Set(photos.map((photo) => photo.uploaderSessionId)).size,
      lastUploadedAt: photos.at(-1)?.uploadedAt ?? null,
    };
  }

  async seedDemo() {
    const current = await this.listPhotos();
    if (current.length > 0) return;

    const names = ["Arta", "Lina", "Dion", "Sara", "Blerim", "Era", "Nora", "Leart"];
    const messages = [
      "Urime për një jetë plot dashuri 🤍",
      "Qofshi gjithmonë kaq të lumtur!",
      "Një kujtim nga dita juaj e veçantë.",
      "Me shumë dashuri për ju të dy.",
      "Urime Enis dhe Agnesa!",
      "Gëzuar fillimin e kësaj aventure.",
      "Dashuri dhe lumturi pa fund.",
      "Një natë që do ta kujtojmë gjatë.",
    ];

    const records: NewPhotoRecord[] = [];
    for (let index = 1; index <= 8; index += 1) {
      const response = await fetch(`/demo/photo-${index}.jpg`);
      const blob = await response.blob();
      records.push({
        eventId: eventConfig.eventId,
        originalFileName: `demo-${index}.jpg`,
        originalContentType: "image/jpeg",
        optimizedContentType: "image/jpeg",
        originalSize: blob.size,
        optimizedSize: blob.size,
        guestName: names[index - 1],
        message: messages[index - 1],
        uploaderSessionId: `demo-${Math.ceil(index / 2)}`,
        originalBlob: blob,
        optimizedBlob: blob,
      });
    }
    await this.addPhotos(records);
  }
}

export const localPhotoRepository = new LocalPhotoRepository();
