import { describe, expect, it } from "vitest";
import { getSupportedContentType, validateSelectedFiles } from "./fileValidation";

const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const TIFF = [0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00];
const HEIC = [
  0x00, 0x00, 0x00, 0x18,
  0x66, 0x74, 0x79, 0x70,
  0x68, 0x65, 0x69, 0x63,
  0x00, 0x00, 0x00, 0x00,
  0x6d, 0x69, 0x66, 0x31,
];

function makeFile(name: string, bytes: number[], type = "image/jpeg", size = 1000) {
  return new File(
    [new Uint8Array(bytes), new Uint8Array(Math.max(0, size - bytes.length))],
    name,
    { type, lastModified: 1 },
  );
}

describe("validateSelectedFiles", () => {
  it("accepts a genuine image even when its extension and MIME type are unreliable", async () => {
    const file = makeFile("camera-upload.bin", PNG, "application/octet-stream");
    const result = await validateSelectedFiles([file]);
    expect(result.valid).toEqual([file]);
    expect(result.errors).toHaveLength(0);
    await expect(getSupportedContentType(file)).resolves.toBe("image/png");
  });

  it("accepts HEIC from iPhones when the browser omits its MIME type", async () => {
    const result = await validateSelectedFiles([makeFile("IMG_1234", HEIC, "")]);
    expect(result.valid).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
    await expect(getSupportedContentType(result.valid[0])).resolves.toBe("image/heic");
  });

  it("accepts TIFF based on file contents rather than a hardcoded extension list", async () => {
    const file = makeFile("camera-export", TIFF, "application/octet-stream");
    const result = await validateSelectedFiles([file]);
    expect(result.valid).toEqual([file]);
    await expect(getSupportedContentType(file)).resolves.toBe("image/tiff");
  });

  it("allows an uncommon raster image MIME type to reach the real decoder", async () => {
    const file = makeFile("photo.custom", [0x01, 0x02, 0x03, 0x04], "image/x-camera-raw");
    const result = await validateSelectedFiles([file]);
    expect(result.valid).toEqual([file]);
  });

  it("rejects a file that is clearly not an image", async () => {
    const result = await validateSelectedFiles([
      makeFile("document.pdf", [0x25, 0x50, 0x44, 0x46], "application/pdf"),
    ]);
    expect(result.valid).toHaveLength(0);
    expect(result.errors[0]).toContain("nuk është një fotografi");
  });

  it("rejects vector SVG uploads rather than decoding active image content", async () => {
    const result = await validateSelectedFiles([
      makeFile("graphic.svg", [0x3c, 0x73, 0x76, 0x67], "image/svg+xml"),
    ]);
    expect(result.valid).toHaveLength(0);
  });

  it("limits the batch to five photos", async () => {
    const files = Array.from(
      { length: 6 },
      (_, index) => makeFile(`photo-${index}.jpg`, JPEG, "image/jpeg", 1000 + index),
    );
    const result = await validateSelectedFiles(files);
    expect(result.valid).toHaveLength(5);
    expect(result.errors[0]).toContain("maksimumi 5");
  });
});
