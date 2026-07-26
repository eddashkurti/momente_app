import {
  detectImageFormat,
  isHeifFamily,
  type DetectedImageFormat,
} from "./imageFormat";

const MAX_DIMENSION = 1920;
const MAX_OPTIMIZED_BYTES = 1.8 * 1024 * 1024;
const MAX_SOURCE_PIXELS = 80_000_000;

interface DecodedImage {
  image: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}

export class ImageProcessingError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string,
  ) {
    super(message);
    this.name = "ImageProcessingError";
  }
}

export async function createOptimizedImage(file: File) {
  const format = await detectImageFormat(file);
  const decoded = await decodeImage(file, format);
  assertSafeDimensions(decoded.width, decoded.height);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(decoded.width, decoded.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(decoded.width * scale));
  canvas.height = Math.max(1, Math.round(decoded.height * scale));

  try {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas is not available.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(decoded.image, 0, 0, canvas.width, canvas.height);

    let quality = 0.9;
    let optimized = await canvasToJpeg(canvas, quality);
    while (optimized.size > MAX_OPTIMIZED_BYTES && quality > 0.58) {
      quality -= 0.07;
      optimized = await canvasToJpeg(canvas, quality);
    }
    return optimized;
  } finally {
    decoded.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}

async function decodeImage(file: File, format: DetectedImageFormat | null) {
  if (isHeifFamily(format)) {
    try {
      return await decodeHeif(file);
    } catch (error) {
      throw new ImageProcessingError(
        `HEIC/HEIF decoding failed for ${file.name}: ${errorMessage(error)}`,
        "Fotografia HEIC/HEIF nuk mund të përpunohej. Ju lutemi provoni përsëri.",
      );
    }
  }

  if (format?.kind === "tiff") {
    try {
      return await decodeTiff(file);
    } catch (error) {
      throw new ImageProcessingError(
        `TIFF decoding failed for ${file.name}: ${errorMessage(error)}`,
        "Fotografia TIFF nuk mund të përpunohej. Ju lutemi provoni përsëri.",
      );
    }
  }

  try {
    return await decodeWithOrientation(file);
  } catch (browserError) {
    if (format?.kind === "avif") {
      try {
        return await decodeHeif(file);
      } catch (decoderError) {
        throw new ImageProcessingError(
          `AVIF decoding failed for ${file.name}: ${errorMessage(decoderError)}`,
          "Fotografia AVIF nuk mund të përpunohej. Ju lutemi provoni përsëri.",
        );
      }
    }
    throw new ImageProcessingError(
      `Image decoding failed for ${file.name}: ${errorMessage(browserError)}`,
      "Fotografia nuk mund të lexohej. Skedari mund të jetë i dëmtuar ose jo një imazh i vlefshëm.",
    );
  }
}

async function decodeHeif(file: File) {
  const { heicTo } = await import("heic-to/csp");
  const converted = await heicTo({
    blob: file,
    type: "image/jpeg",
    quality: 0.95,
  });
  return decodeWithOrientation(converted);
}

async function decodeTiff(file: File): Promise<DecodedImage> {
  const { decode } = await import("tiff");
  const originalBuffer = await file.arrayBuffer();
  const preview = inspectFirstTiffIfd(originalBuffer);
  assertSafeDimensions(preview.width, preview.height);

  // image-js/tiff intentionally accepts only top-left pixel ordering. Normalize
  // the metadata in a private copy, decode it, then apply the original orientation.
  const normalizedBuffer = normalizeFirstTiffOrientation(originalBuffer, preview);
  const [ifd] = decode(normalizedBuffer, { pages: [0] });
  if (!ifd) throw new Error("No displayable TIFF image was found.");
  assertSafeDimensions(ifd.width, ifd.height);

  const rgba = tiffToRgba(ifd);
  const source = rgbaCanvas(rgba, ifd.width, ifd.height);
  return orientCanvas(source, preview.orientation);
}

async function decodeWithOrientation(blob: Blob): Promise<DecodedImage> {
  if ("createImageBitmap" in globalThis) {
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
      assertSafeDimensions(bitmap.width, bitmap.height);
      return {
        image: bitmap,
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
    assertSafeDimensions(image.naturalWidth, image.naturalHeight);
    return {
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function rgbaCanvas(rgba: Uint8Array, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available.");
  const imageData = context.createImageData(width, height);
  imageData.data.set(rgba);
  context.putImageData(imageData, 0, 0);
  return canvas;
}

interface TiffIfdPreview {
  littleEndian: boolean;
  orientation: number;
  orientationValueOffset: number | null;
  width: number;
  height: number;
}

interface TiffDecodedPage {
  alpha: boolean;
  bitsPerSample: number;
  components: number;
  data: Uint8Array | Uint16Array | Float32Array | Float64Array;
  height: number;
  maxSampleValue: number;
  palette?: Array<[number, number, number]>;
  type: number;
  width: number;
}

function inspectFirstTiffIfd(buffer: ArrayBuffer): TiffIfdPreview {
  const view = new DataView(buffer);
  if (view.byteLength < 8) throw new Error("TIFF header is incomplete.");
  const byteOrder = view.getUint16(0, false);
  const littleEndian = byteOrder === 0x4949;
  if (!littleEndian && byteOrder !== 0x4d4d) throw new Error("Invalid TIFF byte order.");
  if (view.getUint16(2, littleEndian) !== 42) throw new Error("Invalid TIFF signature.");

  const ifdOffset = view.getUint32(4, littleEndian);
  assertTiffRange(view, ifdOffset, 2);
  const entryCount = view.getUint16(ifdOffset, littleEndian);
  if (entryCount > 512) throw new Error("TIFF metadata contains too many entries.");

  let width = 0;
  let height = 0;
  let orientation = 1;
  let orientationValueOffset: number | null = null;
  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = ifdOffset + 2 + index * 12;
    assertTiffRange(view, entryOffset, 12);
    const tag = view.getUint16(entryOffset, littleEndian);
    if (tag !== 256 && tag !== 257 && tag !== 274) continue;
    const type = view.getUint16(entryOffset + 2, littleEndian);
    const count = view.getUint32(entryOffset + 4, littleEndian);
    if (count !== 1 || (type !== 3 && type !== 4)) {
      throw new Error("Invalid TIFF presentation metadata.");
    }
    const valueOffset = entryOffset + 8;
    const value = type === 3
      ? view.getUint16(valueOffset, littleEndian)
      : view.getUint32(valueOffset, littleEndian);
    if (tag === 256) width = value;
    if (tag === 257) height = value;
    if (tag === 274) {
      orientation = value;
      orientationValueOffset = valueOffset;
    }
  }
  if (!width || !height || orientation < 1 || orientation > 8) {
    throw new Error("TIFF dimensions or orientation are invalid.");
  }
  return { littleEndian, orientation, orientationValueOffset, width, height };
}

function normalizeFirstTiffOrientation(
  buffer: ArrayBuffer,
  preview: TiffIfdPreview,
) {
  if (preview.orientation === 1 || preview.orientationValueOffset === null) return buffer;
  const copy = buffer.slice(0);
  new DataView(copy).setUint16(
    preview.orientationValueOffset,
    1,
    preview.littleEndian,
  );
  return copy;
}

function tiffToRgba(ifd: TiffDecodedPage) {
  const { alpha, components, data, height, palette, type, width } = ifd;
  if (data.length !== width * height * components) {
    throw new Error("TIFF pixel data is incomplete.");
  }
  if (components < 1 || components > 4) {
    throw new Error("Unsupported TIFF channel layout.");
  }

  const rgba = new Uint8Array(width * height * 4);
  const max = Number.isFinite(ifd.maxSampleValue) && ifd.maxSampleValue > 0
    ? ifd.maxSampleValue
    : ifd.bitsPerSample === 1
      ? 1
      : 2 ** Math.min(ifd.bitsPerSample, 16) - 1;
  const sample = (value: number) => Math.round(Math.max(0, Math.min(1, value / max)) * 255);

  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const source = pixel * components;
    const target = pixel * 4;
    if (type === 3 && palette) {
      const color = palette[Math.round(data[source])];
      if (!color) throw new Error("TIFF palette index is invalid.");
      // TIFF ColorMap entries are always stored on a 16-bit scale.
      rgba[target] = Math.round((color[0] / 65_535) * 255);
      rgba[target + 1] = Math.round((color[1] / 65_535) * 255);
      rgba[target + 2] = Math.round((color[2] / 65_535) * 255);
    } else if (components >= 3) {
      rgba[target] = sample(data[source]);
      rgba[target + 1] = sample(data[source + 1]);
      rgba[target + 2] = sample(data[source + 2]);
    } else {
      const grey = sample(data[source]);
      rgba[target] = grey;
      rgba[target + 1] = grey;
      rgba[target + 2] = grey;
    }
    rgba[target + 3] = alpha ? sample(data[source + components - 1]) : 255;
  }
  return rgba;
}

function assertTiffRange(view: DataView, offset: number, length: number) {
  if (
    !Number.isSafeInteger(offset)
    || !Number.isSafeInteger(length)
    || offset < 0
    || length < 0
    || offset + length > view.byteLength
  ) {
    throw new Error("TIFF metadata points outside the file.");
  }
}

function orientCanvas(source: HTMLCanvasElement, orientation: number): DecodedImage {
  if (orientation < 2 || orientation > 8) {
    return {
      image: source,
      width: source.width,
      height: source.height,
      close: () => clearCanvas(source),
    };
  }

  const swapsDimensions = orientation >= 5;
  const canvas = document.createElement("canvas");
  canvas.width = swapsDimensions ? source.height : source.width;
  canvas.height = swapsDimensions ? source.width : source.height;
  const context = canvas.getContext("2d");
  if (!context) {
    clearCanvas(source);
    throw new Error("Canvas is not available.");
  }

  switch (orientation) {
    case 2:
      context.transform(-1, 0, 0, 1, source.width, 0);
      break;
    case 3:
      context.transform(-1, 0, 0, -1, source.width, source.height);
      break;
    case 4:
      context.transform(1, 0, 0, -1, 0, source.height);
      break;
    case 5:
      context.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      context.transform(0, 1, -1, 0, source.height, 0);
      break;
    case 7:
      context.transform(0, -1, -1, 0, source.height, source.width);
      break;
    case 8:
      context.transform(0, -1, 1, 0, 0, source.width);
      break;
  }
  context.drawImage(source, 0, 0);
  clearCanvas(source);
  return {
    image: canvas,
    width: canvas.width,
    height: canvas.height,
    close: () => clearCanvas(canvas),
  };
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

function assertSafeDimensions(width: number, height: number) {
  if (
    !Number.isSafeInteger(width)
    || !Number.isSafeInteger(height)
    || width < 1
    || height < 1
    || width * height > MAX_SOURCE_PIXELS
  ) {
    throw new Error("Image dimensions are invalid or exceed the safe processing limit.");
  }
}

function clearCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 0;
  canvas.height = 0;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
