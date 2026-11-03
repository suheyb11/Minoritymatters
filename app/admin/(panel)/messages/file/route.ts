// /admin/messages/file?id=<reply>&n=<file>: downloads one file sent with a reply.
// The files are in a private Storage bucket; a logged-in admin gets a link that works for one minute.

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { attachmentStorage, replyFiles } from "@/lib/conversations";

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const reply = await prisma.reply.findUnique({ where: { id: Number(url.searchParams.get("id")) || 0 } });
  const file = reply ? replyFiles(reply)[Number(url.searchParams.get("n"))] : undefined;
  if (!file) return new Response("File not found", { status: 404 });

  const { data, error } = await (await attachmentStorage()).createSignedUrl(file.path, 60, { download: file.name });
  if (error || !data) return new Response("File not found", { status: 404 });
  return Response.redirect(data.signedUrl, 302);
}
