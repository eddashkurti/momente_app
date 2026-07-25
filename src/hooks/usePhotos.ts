import { useCallback, useEffect, useState } from "react";
import { photoRepository } from "../services";
import { subscribeToPhotoUpdates } from "../services/photoEvents";
import type { PhotoRecord, PhotoStats } from "../types/photo";

const emptyStats: PhotoStats = { photoCount: 0, contributorCount: 0, lastUploadedAt: null };

export function usePhotos(refreshIntervalMs?: number) {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [stats, setStats] = useState<PhotoStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [nextPhotos, nextStats] = await Promise.all([
        photoRepository.listPhotos(),
        photoRepository.getStats(),
      ]);
      setPhotos(nextPhotos);
      setStats(nextStats);
      setError(null);
    } catch (caught) {
      console.error(caught);
      setError("Fotografitë nuk mund të ngarkoheshin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return subscribeToPhotoUpdates(() => void refresh());
  }, [refresh]);

  useEffect(() => {
    if (!refreshIntervalMs) return;
    const timer = window.setInterval(() => void refresh(), refreshIntervalMs);
    return () => window.clearInterval(timer);
  }, [refresh, refreshIntervalMs]);

  return { photos, stats, loading, error, refresh };
}
