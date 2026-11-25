// File storage for songs, covers, artist photos and podcast audio.
//
// Production: Neon Object Storage (S3-compatible). Browsers upload straight to the bucket with a
// short-lived signed URL, and playback redirects to a signed download URL, so large files never
// pass through Netlify Functions. Netlify reserves the AWS_* variable names, so the Neon
// credentials are read from NEON_S3_* instead.
//
// Development without credentials: files are kept in ./.media on this machine instead.

import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const cfg = {
  endpoint: process.env.NEON_S3_ENDPOINT,
  region: process.env.NEON_S3_REGION || "us-east-1",
  accessKeyId: process.env.NEON_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEON_S3_SECRET_ACCESS_KEY,
  bucket: process.env.NEON_S3_BUCKET || "brisic-media",
};

export type StorageMode = "neon" | "local" | "off";
export const storageMode = (): StorageMode =>
  cfg.endpoint && cfg.accessKeyId && cfg.secretAccessKey ? "neon" : process.env.NODE_ENV !== "production" ? "local" : "off";

let client: S3Client | null = null;
const s3 = () =>
  (client ??= new S3Client({
    endpoint: cfg.endpoint,
    region: cfg.region,
    forcePathStyle: true, // Neon uses path-style addressing
    credentials: { accessKeyId: cfg.accessKeyId!, secretAccessKey: cfg.secretAccessKey! },
  }));

const LOCAL_DIR = path.join(process.cwd(), ".media");
const localPath = (key: string) => {
  const p = path.join(LOCAL_DIR, key);
  if (!p.startsWith(LOCAL_DIR + path.sep)) throw new Error("Bad key");
  return p;
};
const sign = (value: string) => createHmac("sha256", process.env.AUTH_SECRET || "dev").update(value).digest("hex");
export const verifyLocal = (value: string, sig: string) => {
  const a = Buffer.from(sign(value)), b = Buffer.from(sig || "");
  return a.length === b.length && timingSafeEqual(a, b);
};

/** What kinds of file can be uploaded, with their size limits. */
export const UPLOAD_RULES = {
  audio: { types: ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm", "audio/flac"], maxBytes: 80 * 1024 * 1024 },
  image: { types: ["image/jpeg", "image/png", "image/webp"], maxBytes: 6 * 1024 * 1024 },
} as const;
export type UploadKind = keyof typeof UPLOAD_RULES;

const EXT: Record<string, string> = {
  "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/aac": "aac", "audio/wav": "wav", "audio/x-wav": "wav",
  "audio/ogg": "ogg", "audio/webm": "webm", "audio/flac": "flac", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
};
export const newKey = (prefix: string, contentType: string) =>
  `${prefix}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}.${EXT[contentType] ?? "bin"}`;

/** A URL the browser PUTs the file to (expires in 30 minutes), plus headers it must send. */
export async function uploadUrl(key: string, contentType: string): Promise<{ url: string; headers: Record<string, string> }> {
  const mode = storageMode();
  if (mode === "neon") {
    const url = await getSignedUrl(s3(), new PutObjectCommand({ Bucket: cfg.bucket, Key: key, ContentType: contentType }), { expiresIn: 1800 });
    return { url, headers: { "Content-Type": contentType } };
  }
  if (mode === "local") {
    const exp = String(Date.now() + 1_800_000);
    return { url: `/api/dev-media?key=${encodeURIComponent(key)}&exp=${exp}&sig=${sign(key + exp)}`, headers: { "Content-Type": contentType } };
  }
  throw new Error("STORAGE_OFF");
}

/** Saves a dev upload to ./.media (development only). */
export async function writeLocal(key: string, body: Uint8Array) {
  const p = localPath(key);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, body);
}
export const localFile = (key: string) => localPath(key);

export async function exists(key: string) {
  const mode = storageMode();
  try {
    if (mode === "neon") { await s3().send(new HeadObjectCommand({ Bucket: cfg.bucket, Key: key })); return true; }
    if (mode === "local") { await stat(localPath(key)); return true; }
  } catch {}
  return false;
}

/** A short-lived URL to read a file (used behind /api/media redirects). */
export async function downloadUrl(key: string, contentType?: string) {
  if (storageMode() === "neon") {
    return getSignedUrl(s3(), new GetObjectCommand({ Bucket: cfg.bucket, Key: key, ResponseContentType: contentType }), { expiresIn: 3600 });
  }
  const exp = String(Date.now() + 3_600_000);
  return `/api/dev-media?key=${encodeURIComponent(key)}&exp=${exp}&sig=${sign(key + exp)}`;
}

export async function removeFile(key: string | null | undefined) {
  if (!key) return;
  try {
    if (storageMode() === "neon") await s3().send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }));
    else if (storageMode() === "local") await (await import("node:fs/promises")).unlink(localPath(key));
  } catch {
    // Already gone; nothing to do.
  }
}
