// /media/<file>: the images uploaded in the admin (kept in STORAGE_DIR/media, see lib/storage.ts).
// The file names never change (a new upload gets a new name), so browsers may keep them for a year.

import fs from "fs/promises";
import path from "path";
import { MEDIA_DIR, MEDIA_NAME, contentTypeFor } from "@/lib/storage";

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const type = contentTypeFor(path.extname(file));
  if (!MEDIA_NAME.test(file) || file.startsWith(".") || !type) return new Response("Not found", { status: 404 });

  try {
    const bytes = await fs.readFile(path.join(MEDIA_DIR, file));
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
        // An SVG could contain a script: never run it
        ...(type === "image/svg+xml" ? { "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox" } : {}),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
