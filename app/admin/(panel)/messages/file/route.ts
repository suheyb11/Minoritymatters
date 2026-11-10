// /admin/messages/file?id=<reply>&n=<file>: downloads one file sent with a reply.
// The files are private (STORAGE_DIR/attachments, see lib/storage.ts): only a logged-in admin gets them.

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { readAttachment, replyFiles } from "@/lib/conversations";

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const reply = await prisma.reply.findUnique({ where: { id: Number(url.searchParams.get("id")) || 0 } });
  const file = reply ? replyFiles(reply)[Number(url.searchParams.get("n"))] : undefined;
  const bytes = file ? await readAttachment(file.path) : null;
  if (!file || !bytes) return new Response("File not found", { status: 404 });

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${file.name.replace(/[^A-Za-z0-9_.-]/g, "_")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
