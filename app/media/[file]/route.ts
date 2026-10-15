// Serves images uploaded from the admin panel (saved in the /uploads folder).
// Example: /media/1712345-ab12cd.jpg

import fs from "fs";
import path from "path";

const types: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const fileName = path.basename(file); // stops "../" tricks
  const filePath = path.join(process.cwd(), "uploads", fileName);
  const type = types[path.extname(fileName).toLowerCase()];

  if (!type || !fs.existsSync(filePath)) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(fs.readFileSync(filePath), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
