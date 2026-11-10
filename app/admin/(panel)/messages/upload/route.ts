// /admin/messages/upload?path=<folder>/<file>: saves one file the admin attaches to a reply (see ReplyForm).
// The path comes from prepareAttachments (app/admin/actions.ts); sendReply checks every file again before sending.

import { requireAdmin } from "@/lib/auth";
import { saveAttachment, ATTACH_SIZE, ATTACH_TYPES, attachmentExtension } from "@/lib/conversations";
import { ATTACH_PATH } from "@/lib/storage";

export async function PUT(request: Request) {
  await requireAdmin();
  const filePath = new URL(request.url).searchParams.get("path") || "";
  if (!ATTACH_PATH.test(filePath) || !ATTACH_TYPES.includes(attachmentExtension(filePath))) {
    return Response.json({ error: "file-type" }, { status: 400 });
  }
  if (Number(request.headers.get("content-length") || 0) > ATTACH_SIZE + 64 * 1024) {
    return Response.json({ error: "file-size" }, { status: 413 });
  }

  const bytes = Buffer.from(await request.arrayBuffer());
  if (bytes.length > ATTACH_SIZE) return Response.json({ error: "file-size" }, { status: 413 });
  await saveAttachment(filePath, bytes);
  return Response.json({ ok: true });
}
