import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { readImageSize } from "./image-size";

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

const makeTempFile = async (name: string, bytes: Buffer): Promise<string> => {
  // Repo-relative temp dir (not os.tmpdir()) so the test works on boxes with a
  // hard /tmp quota and stays self-cleaning.
  tempDir = await mkdtemp(path.join(process.cwd(), ".image-size-tmp-"));
  const filePath = path.join(tempDir, name);
  await writeFile(filePath, bytes);
  return filePath;
};

/** Builds a minimal JPEG: SOI, optional APP1/EXIF, SOF0, EOI. */
const buildJpeg = (width: number, height: number, exifBytes = 0): Buffer => {
  const parts: Buffer[] = [Buffer.from([0xff, 0xd8])]; // SOI
  if (exifBytes > 0) {
    const payload = Buffer.alloc(exifBytes, 0x45); // 'E' padding
    const app1 = Buffer.alloc(4);
    app1.writeUInt16BE(0xffe1, 0); // APP1 marker
    app1.writeUInt16BE(payload.length + 2, 2); // length incl. itself
    parts.push(app1, payload);
  }
  const sof = Buffer.alloc(19);
  sof.writeUInt16BE(0xffc0, 0); // SOF0
  sof.writeUInt16BE(17, 2); // length
  sof.writeUInt8(8, 4); // precision
  sof.writeUInt16BE(height, 5);
  sof.writeUInt16BE(width, 7);
  sof.writeUInt8(3, 9); // components
  parts.push(sof, Buffer.from([0xff, 0xd9])); // EOI
  return Buffer.concat(parts);
};

describe("readImageSize", () => {
  it("reads JPEG dimensions when an EXIF/APP segment extends past 64 bytes", async () => {
    // 200-byte EXIF segment pushes the SOF marker well past the old 64-byte cap.
    const filePath = await makeTempFile("exif.jpg", buildJpeg(1200, 630, 200));
    await expect(readImageSize(filePath)).resolves.toEqual({
      width: 1200,
      height: 630,
      type: "image/jpeg",
    });
  });

  it("reads JPEG dimensions with no EXIF segment", async () => {
    const filePath = await makeTempFile("plain.jpg", buildJpeg(800, 400));
    await expect(readImageSize(filePath)).resolves.toEqual({
      width: 800,
      height: 400,
      type: "image/jpeg",
    });
  });

  it("returns undefined for a truncated JPEG", async () => {
    const filePath = await makeTempFile("truncated.jpg", Buffer.from([0xff, 0xd8, 0xff]));
    await expect(readImageSize(filePath)).resolves.toBeUndefined();
  });

  it("returns undefined for an unsupported extension", async () => {
    const filePath = await makeTempFile("image.gif", Buffer.from([0x47, 0x49, 0x46]));
    await expect(readImageSize(filePath)).resolves.toBeUndefined();
  });
});
