import { useEffect, useMemo } from "react";
import type { PhotoRecord, PhotoViewModel } from "../types/photo";

export function usePhotoViewModels(photos: PhotoRecord[]): PhotoViewModel[] {
  const viewModels = useMemo(
    () =>
      photos.map((photo) => ({
        ...photo,
        optimizedUrl:
          photo.optimizedUrl ??
          (photo.optimizedBlob ? URL.createObjectURL(photo.optimizedBlob) : ""),
      })),
    [photos],
  );

  useEffect(
    () => () => {
      viewModels.forEach((photo) => {
        if (!photo.optimizedUrl?.startsWith("http")) {
          URL.revokeObjectURL(photo.optimizedUrl);
        }
      });
    },
    [viewModels],
  );

  return viewModels;
}
