import { useEffect, useMemo } from "react";
import type { PhotoRecord, PhotoViewModel } from "../types/photo";

export function usePhotoViewModels(photos: PhotoRecord[]): PhotoViewModel[] {
  const viewModels = useMemo(
    () =>
      photos.map((photo) => ({
        ...photo,
        optimizedUrl: URL.createObjectURL(photo.optimizedBlob),
        originalUrl: URL.createObjectURL(photo.originalBlob),
      })),
    [photos],
  );

  useEffect(
    () => () => {
      viewModels.forEach((photo) => {
        URL.revokeObjectURL(photo.optimizedUrl);
        URL.revokeObjectURL(photo.originalUrl);
      });
    },
    [viewModels],
  );

  return viewModels;
}
