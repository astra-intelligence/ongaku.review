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

const jpegSize = (data: Buffer): { width: number; height: number } | undefined => {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) return undefined;
  let offset = 2;
  while (offset + 9 < data.length) {
    if (data[offset] !== 0xff) return undefined;
    const marker = data[offset + 1];
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }
    const length = data.readUInt16BE(offset + 2);
    if (offset + length + 2 > data.length) return undefined;
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: data.readUInt16BE(offset + 5), width: data.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return undefined;
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
  const data = await readPrefix(filePath, 64);
  const size =
    type === "image/png" ? pngSize(data) : type === "image/jpeg" ? jpegSize(data) : webpSize(data);
  return size ? { ...size, type } : undefined;
}
