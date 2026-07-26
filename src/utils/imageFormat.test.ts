import { describe, expect, it } from "vitest";
import { detectImageFormatFromBytes } from "./imageFormat";

function bytes(values: number[]) {
  return new Uint8Array(values);
}

function ftyp(majorBrand: string, compatibleBrand = "mif1") {
  return bytes([
    0x00, 0x00, 0x00, 0x18,
    0x66, 0x74, 0x79, 0x70,
    ...majorBrand.split("").map((char) => char.charCodeAt(0)),
    0x00, 0x00, 0x00, 0x00,
    ...compatibleBrand.split("").map((char) => char.charCodeAt(0)),
  ]);
}

describe("detectImageFormatFromBytes", () => {
  it.each([
    ["jpeg", [0xff, 0xd8, 0xff, 0xe1]],
    ["png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    ["gif", [..."GIF89a"].map((char) => char.charCodeAt(0))],
    ["bmp", [0x42, 0x4d, 0x00, 0x00]],
    ["tiff", [0x49, 0x49, 0x2a, 0x00]],
    ["jpeg-xl", [0xff, 0x0a, 0x00, 0x00]],
    ["jpeg-2000", [0xff, 0x4f, 0xff, 0x51]],
    ["qoi", [..."qoif"].map((char) => char.charCodeAt(0))],
    ["psd", [..."8BPS"].map((char) => char.charCodeAt(0))],
  ])("detects %s from its real signature", (kind, signature) => {
    expect(detectImageFormatFromBytes(bytes(signature))?.kind).toBe(kind);
  });

  it("detects WebP from its RIFF container", () => {
    expect(
      detectImageFormatFromBytes(
        bytes([...["R", "I", "F", "F"], 0, 0, 0, 0, ...["W", "E", "B", "P"]].map(
          (value) => typeof value === "string" ? value.charCodeAt(0) : value,
        )),
      )?.kind,
    ).toBe("webp");
  });

  it("distinguishes HEIC, HEIF, and AVIF by ISO base-media brands", () => {
    expect(detectImageFormatFromBytes(ftyp("heic"))?.kind).toBe("heic");
    expect(detectImageFormatFromBytes(ftyp("mif1"))?.kind).toBe("heif");
    expect(detectImageFormatFromBytes(ftyp("avif"))?.kind).toBe("avif");
  });

  it("returns null for an unknown signature", () => {
    expect(detectImageFormatFromBytes(bytes([0x01, 0x02, 0x03, 0x04]))).toBeNull();
  });
});
