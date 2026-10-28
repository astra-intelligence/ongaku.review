import { open } from "node:fs/promises";
import path from "node:path";

export interface ImageSize {
  width: number;
  height: number;
  /** MIME type, e.g. `image/png`. */
  type: string;
}

const mimeByExtension: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

const readPrefix = async (filePath: string, bytes: number): Promise<Buffer> => {
  const handle = await open(filePath, "r");
  try {
    const buffer = Buffer.alloc(bytes);
    const { bytesRead } = await handle.read(buffer, 0, bytes, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
};

const pngSize = (data: Buffer): { width: number; height: number } | undefined => {
  if (data.length < 24 || data.toString("ascii", 1, 4) !== "PNG") return undefined;
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
};

/**
 * Scans a JPEG file's marker segments incrementally until the SOF marker that
 * carries the pixel dimensions. Unlike a fixed-size prefix read, this keeps
 * working when an APP/EXIF segment extends past the first 64 bytes (common for
 * camera/editor thumbnails), so valid JPEGs never lose their dimensions.
 */
const jpegSize = async (
  filePath: string,
): Promise<{ width: number; height: number } | undefined> => {
  const handle = await open(filePath, "r");
  try {
    const readAt = async (position: number, length: number): Promise<Buffer | undefined> => {
      const buffer = Buffer.alloc(length);
      const { bytesRead } = await handle.read(buffer, 0, length, position);
      return bytesRead === length ? buffer : undefined;
    };
    const header = await readAt(0, 2);
    if (!header || header[0] !== 0xff || header[1] !== 0xd8) return undefined;
    let offset = 2;
    // Safety bound: a well-formed JPEG reaches its SOF marker well within 1 MiB.
    const maxOffset = 1024 * 1024;
    while (offset < maxOffset) {
      const markerBuf = await readAt(offset, 2);
      if (!markerBuf || markerBuf[0] !== 0xff) return undefined;
      const marker = markerBuf[1];
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
        offset += 2;
        continue;
      }
      const lengthBuf = await readAt(offset + 2, 2);
      if (!lengthBuf) return undefined;
      const length = lengthBuf.readUInt16BE(0);
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        const sof = await readAt(offset + 4, 5);
        if (!sof) return undefined;
        return { height: sof.readUInt16BE(1), width: sof.readUInt16BE(3) };
      }
      offset += 2 + length;
    }
    return undefined;
  } finally {
    await handle.close();
  }
};

const webpSize = (data: Buffer): { width: number; height: number } | undefined => {
  if (data.length < 30 || data.toString("ascii", 0, 4) !== "RIFF") return undefined;
  if (data.toString("ascii", 8, 12) !== "WEBP") return undefined;
  const chunk = data.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    // 1 byte flags, 3 bytes reserved, then 24-bit little-endian canvas dims.
    const width = 1 + data.readUIntLE(24, 3);
    const height = 1 + data.readUIntLE(27, 3);
    return { width, height };
  }
  if (chunk === "VP8 " && data.length >= 30) {
    // Lossy key frame: 3-byte start code, then 16-bit little-endian dims.
    if (data[23] !== 0x9d || data[24] !== 0x01 || data[25] !== 0x2a) return undefined;
    const width = data.readUInt16LE(26) & 0x3fff;
    const height = data.readUInt16LE(28) & 0x3fff;
    return { width, height };
  }
  if (chunk === "VP8L" && data.length >= 25 && data[20] === 0x2f) {
    const bits = data.readUInt32LE(21);
    const width = 1 + (bits & 0x3fff);
    const height = 1 + ((bits >> 14) & 0x3fff);
    return { width, height };
  }
  return undefined;
};

/**
 * Reads the pixel dimensions and MIME type of a PNG/JPEG/WebP image without a
 * full decode. Returns `undefined` for unsupported or truncated files.
 */
export async function readImageSize(filePath: string): Promise<ImageSize | undefined> {
  const type = mimeByExtension[path.extname(filePath).toLowerCase()];
  if (!type) return undefined;
  if (type === "image/jpeg") {
    const size = await jpegSize(filePath);
    return size ? { ...size, type } : undefined;
  }
  const data = await readPrefix(filePath, 64);
  const size = type === "image/png" ? pngSize(data) : webpSize(data);
  return size ? { ...size, type } : undefined;
}
