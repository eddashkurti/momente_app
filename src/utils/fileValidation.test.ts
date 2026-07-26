import { describe, expect, it } from "vitest";
import { validateSelectedFiles } from "./fileValidation";

function makeFile(name: string, size: number, type = "image/jpeg") {
  return new File([new Uint8Array(size)], name, { type, lastModified: 1 });
}

describe("validateSelectedFiles", () => {
  it("accepts supported image files", () => {
    const result = validateSelectedFiles([makeFile("photo.jpg", 1000)]);
    expect(result.valid).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it("accepts HEIC from iPhones even when the browser omits its MIME type", () => {
    const result = validateSelectedFiles([makeFile("IMG_1234.HEIC", 1000, "")]);
    expect(result.valid).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects unsupported formats", () => {
    const result = validateSelectedFiles([makeFile("photo.gif", 1000, "image/gif")]);
    expect(result.valid).toHaveLength(0);
    expect(result.errors[0]).toContain("nuk mbështetet");
  });

  it("limits the batch to five photos", () => {
    const files = Array.from({ length: 6 }, (_, index) => makeFile(`photo-${index}.jpg`, 1000 + index));
    const result = validateSelectedFiles(files);
    expect(result.valid).toHaveLength(5);
    expect(result.errors[0]).toContain("maksimumi 5");
  });
});
