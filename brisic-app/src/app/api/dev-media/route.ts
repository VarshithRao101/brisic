// Development-only stand-in for object storage: accepts signed PUT uploads and serves files
// (with Range support for audio seeking) from ./.media. Disabled in production.
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { localFile, storageMode, verifyLocal, writeLocal } from "@/lib/storage";

const allowed = (url: URL) => {
  const key = url.searchParams.get("key") ?? "";
  const exp = url.searchParams.get("exp") ?? "";
  if (storageMode() !== "local" || !key || Number(exp) < Date.now() || !verifyLocal(key + exp, url.searchParams.get("sig") ?? "")) return null;
  return key;
};

export async function PUT(req: Request) {
  const key = allowed(new URL(req.url));
  if (!key) return new Response("Forbidden", { status: 403 });
  await writeLocal(key, new Uint8Array(await req.arrayBuffer()));
  return new Response(null, { status: 200 });
}

const TYPES: Record<string, string> = { mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac", wav: "audio/wav", ogg: "audio/ogg", webm: "audio/webm", flac: "audio/flac", jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export async function GET(req: Request) {
  const key = allowed(new URL(req.url));
  if (!key) return new Response("Forbidden", { status: 403 });
  const file = localFile(key);
  let size: number;
  try { size = (await stat(file)).size; } catch { return new Response("Not found", { status: 404 }); }
  const type = TYPES[key.split(".").pop() ?? ""] ?? "application/octet-stream";
  const range = req.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    const stream = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
    return new Response(stream, { status: 206, headers: { "Content-Type": type, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes" } });
  }
  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new Response(stream, { headers: { "Content-Type": type, "Content-Length": String(size), "Accept-Ranges": "bytes" } });
}
