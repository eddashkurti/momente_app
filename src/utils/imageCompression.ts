import imageCompression from "browser-image-compression";

export async function createOptimizedImage(file: File) {
  const optimized = await imageCompression(file, {
    maxSizeMB: 1.8,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.84,
    fileType: "image/jpeg",
    preserveExif: false,
  });

  return new Blob([optimized], { type: "image/jpeg" });
}
