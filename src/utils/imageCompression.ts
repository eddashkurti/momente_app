const MAX_DIMENSION = 1920;
const MAX_OPTIMIZED_BYTES = 1.8 * 1024 * 1024;

export async function createOptimizedImage(file: File) {
  const source = isHeic(file) ? await convertHeic(file) : file;
  const decoded = await decodeWithOrientation(source);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(decoded.width, decoded.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(decoded.width * scale));
  canvas.height = Math.max(1, Math.round(decoded.height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    decoded.close();
    throw new Error("Canvas is not available.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(decoded.image, 0, 0, canvas.width, canvas.height);
  decoded.close();

  let quality = 0.86;
  let optimized = await canvasToJpeg(canvas, quality);
  while (optimized.size > MAX_OPTIMIZED_BYTES && quality > 0.58) {
    quality -= 0.07;
    optimized = await canvasToJpeg(canvas, quality);
  }

  canvas.width = 0;
  canvas.height = 0;
  return optimized;
}

async function convertHeic(file: File) {
  const { default: heic2any } = await import("heic2any");
  const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.94 });
  return Array.isArray(converted) ? converted[0] : converted;
}

async function decodeWithOrientation(blob: Blob) {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
      return {
        image: bitmap as CanvasImageSource,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // Older Safari versions use the HTML image fallback below.
    }
  }

  const url = URL.createObjectURL(blob);
  try {
    const image = await loadImage(url);
    return {
      image: image as CanvasImageSource,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The image could not be decoded."));
    image.src = url;
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("JPEG conversion failed."))),
      "image/jpeg",
      quality,
    );
  });
}

function isHeic(file: File) {
  return /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}
