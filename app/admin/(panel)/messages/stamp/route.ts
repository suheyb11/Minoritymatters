// /admin/messages/stamp: a short fingerprint of the inbox. The Messages page asks for it every 15 seconds
// (MessagesUI.tsx) and refreshes when it changed. New email answers are copied first (at most once a minute).

import { getAdmin } from "@/lib/auth";
import { inboxStamp, syncReplies } from "@/lib/conversations";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  if (!(await getAdmin())) return Response.json({ stamp: "" }, { status: 401 });
  try {
    await syncReplies();
  } catch {
    // saved in MailConfig.imapError, shown on the Messages page
  }
  return Response.json({ stamp: await inboxStamp() }, { headers: { "Cache-Control": "no-store" } });
}
