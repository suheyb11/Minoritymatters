import Link from "next/link";
import { prisma } from "@/lib/db";
import { getConversations, getConversation, emailKey, syncReplies, ATTACH_MAX, ATTACH_TYPES } from "@/lib/conversations";
import { getMailConfig, mailReady, replyToAddress } from "@/lib/mail";
import { markConversationUnread, deleteConversation, checkEmailReplies } from "../../actions";
import { ReasonBadge, ConfirmButton } from "@/components/AdminUI";
import { ReplyForm, LiveRefresh, ScrollToEnd } from "./MessagesUI";

// Checking the mailbox can take a few seconds
export const maxDuration = 60;

// Admin > Messages: an inbox. On the left every person who wrote (newest first); on the right the whole
// conversation with one person (?with=<email>): their messages, your replies, and a box to answer them.

const problems: Record<string, string> = {
  empty: "Please write your reply first.",
  long: "Your reply is too long. Please keep it under 10,000 characters.",
  files: `Please attach at most ${ATTACH_MAX} files.`,
  "file-size": "The files are too big: at most 10 MB each, and 20 MB together.",
  "file-type": "That kind of file cannot be sent. Please use PDF, Word, Excel, PowerPoint, text, photo or ZIP files.",
  "file-failed": "A file could not be uploaded. Please try again.",
  mail: "Your reply is saved here, but the email could not be sent. Please try again later, or reply from your own email.",
};

// "26 Oct, 21:54" this year, "26 Oct 2025" before
function when(date: Date) {
  const thisYear = date.toLocaleDateString("en-GB", { year: "numeric", timeZone: "Europe/London" }) === new Date().toLocaleDateString("en-GB", { year: "numeric", timeZone: "Europe/London" });
  return thisYear
    ? date.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" });
}

function size(bytes: number) {
  return bytes >= 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(bytes / 1024)) + " KB";
}

export default async function MessagesAdmin({
  searchParams,
}: {
  searchParams: Promise<{ with?: string; sent?: string; error?: string; checked?: string; deleted?: string }>;
}) {
  const params = await searchParams;
  const config = await getMailConfig();
  const ready = mailReady(config);

  // First copy any new email answers from the mailbox (at most once a minute). A problem is shown below.
  try {
    await syncReplies();
  } catch {
    // saved in MailConfig.imapError
  }

  const threads = await getConversations();
  const withEmail = emailKey(params.with || "");
  const thread = threads.find((t) => t.email === withEmail);
  const items = thread ? await getConversation(withEmail) : [];

  // Opening a conversation marks its messages as read
  if (thread && thread.unread) {
    await prisma.message.updateMany({ where: { id: { in: items.flatMap((i) => (i.type === "in" ? [i.message.id] : [])) } }, data: { isRead: true } });
    thread.unread = 0;
  }

  const phone = items.reduce((found, i) => (i.type === "in" && i.message.phone ? i.message.phone : found), "");
  const answersTo = await replyToAddress();
  const imapError = params.error === "imap" ? (await getMailConfig()).imapError || "unknown error" : "";

  return (
    <>
      <LiveRefresh />
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">Messages</h1>
        {ready && (
          <form action={checkEmailReplies}>
            <input type="hidden" name="with" value={withEmail} />
            <button className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-ink hover:bg-gray-100">Check for email replies</button>
          </form>
        )}
      </div>

      {params.error && problems[params.error] && (
        <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{problems[params.error]}</p>
      )}
      {imapError && (
        <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
          Could not check the mailbox for email replies: {imapError}. Check Email sending in Site settings, and that IMAP is on in Gmail.
        </p>
      )}
      {params.checked !== undefined && (
        <p className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800" role="status">
          {Number(params.checked) ? `${params.checked} new email ${Number(params.checked) === 1 ? "reply" : "replies"} added.` : "Checked the mailbox: no new email replies."}
        </p>
      )}
      {params.sent && thread && (
        <p className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800" role="status">Reply sent to {thread.email}.</p>
      )}
      {params.deleted && <p className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800">Deleted.</p>}

      {threads.length === 0 ? (
        <p className="rounded-2xl border border-gray-200 bg-white p-6 text-muted">No messages yet. Messages sent from the contact page will appear here.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white lg:grid lg:min-h-[70vh] lg:grid-cols-[22rem_1fr]">
          {/* ---------- Conversations (on phones only when none is open) ---------- */}
          <nav aria-label="Conversations" className={`${thread ? "hidden lg:block" : ""} border-gray-200 lg:max-h-[80vh] lg:overflow-y-auto lg:border-r`}>
            <ul className="divide-y divide-gray-200">
              {threads.map((t) => {
                const on = t.email === withEmail;
                return (
                  <li key={t.email}>
                    <Link
                      href={`/admin/messages?with=${encodeURIComponent(t.email)}`}
                      aria-current={on ? "true" : undefined}
                      className={`block px-4 py-4 transition-colors ${on ? "bg-pink-soft" : "hover:bg-mist"}`}
                    >
                      <span className="flex items-baseline justify-between gap-3">
                        <span className={`truncate text-ink ${t.unread ? "font-bold" : "font-semibold"}`}>{t.name}</span>
                        <span className="shrink-0 text-xs text-muted">{when(t.last)}</span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className={`min-w-0 flex-1 truncate text-sm ${t.unread ? "text-ink" : "text-muted"}`}>{t.preview}</span>
                        {t.unread > 0 && <span className="shrink-0 rounded-full bg-pink px-2 py-0.5 text-xs font-bold text-white">{t.unread}</span>}
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <ReasonBadge reason={t.reason} />
                        {t.count > 1 && <span className="text-xs text-muted">{t.count} messages</span>}
                        {t.replied && <span className="text-xs font-semibold text-green-700">Replied</span>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* ---------- One conversation ---------- */}
          <section className={`${thread ? "flex" : "hidden lg:flex"} min-w-0 flex-col`}>
            {!thread ? (
              <div className="m-auto p-10 text-center text-muted">
                <p className="font-display text-2xl font-bold text-ink">Choose a conversation</p>
                <p className="mt-2">Select a person on the left to read their messages and reply.</p>
              </div>
            ) : (
              <>
                <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 p-5">
                  <div className="min-w-0">
                    <Link href="/admin/messages" className="mb-2 inline-block text-sm font-semibold text-pink lg:hidden">
                      ← All conversations
                    </Link>
                    <h2 className="font-display text-2xl font-bold">{thread.name}</h2>
                    <p className="mt-1 text-sm text-muted">
                      <a href={`mailto:${thread.email}`} className="text-pink hover:underline">{thread.email}</a>
                      {phone && (
                        <>
                          {" · "}
                          <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:underline">{phone}</a>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <form action={markConversationUnread}>
                      <input type="hidden" name="with" value={thread.email} />
                      <button className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted hover:bg-mist">Mark as unread</button>
                    </form>
                    <form action={deleteConversation}>
                      <input type="hidden" name="with" value={thread.email} />
                      <ConfirmButton
                        label="Delete conversation"
                        message={`Delete the whole conversation with ${thread.name} (all messages and replies)? This cannot be undone.`}
                        className="rounded-full px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                      />
                    </form>
                  </div>
                </header>

                <ScrollToEnd className="flex-1 space-y-5 overflow-y-auto bg-mist/60 p-5 lg:max-h-[55vh]">
                  {items.map((i) =>
                    i.type === "in" ? (
                      <li key={"in" + i.message.id} className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white px-5 py-4 shadow-sm">
                          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                            <span className="font-semibold text-ink">{i.message.name}</span>
                            <ReasonBadge reason={i.message.reason} />
                            <span>· {when(i.message.createdAt)}</span>
                          </p>
                          <p className="mt-2 whitespace-pre-line leading-relaxed text-ink">{i.message.message}</p>
                        </div>
                      </li>
                    ) : (
                      <li key={"out" + i.reply.id} className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-pink-soft px-5 py-4 shadow-sm">
                          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                            <span className="font-semibold text-pink">You{i.reply.authorName ? ` (${i.reply.authorName})` : ""}</span>
                            <span>· {i.reply.subject}</span>
                            <span>· {when(i.reply.createdAt)}</span>
                          </p>
                          <p className="mt-2 whitespace-pre-line leading-relaxed text-ink">{i.reply.body}</p>
                          {i.files.length > 0 && (
                            <ul className="mt-3 flex flex-wrap gap-2">
                              {i.files.map((f, n) => (
                                <li key={n}>
                                  <a
                                    href={`/admin/messages/file?id=${i.reply.id}&n=${n}`}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink ring-1 ring-gray-200 hover:ring-pink"
                                  >
                                    📎 {f.name} <span className="font-normal text-muted">{size(f.size)}</span>
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                          {!i.reply.sent && <p className="mt-2 text-xs font-semibold text-red-700">Not sent: the email could not be delivered.</p>}
                        </div>
                      </li>
                    ),
                  )}
                </ScrollToEnd>

                {/* ---------- Reply ---------- */}
                {/* A new key after each reply empties the form; a new incoming message keeps what is being written */}
                <ReplyForm
                  key={`${thread.email}-${items.filter((i) => i.type === "out").length}`}
                  email={thread.email} name={thread.name} accept={ATTACH_TYPES.map((t) => "." + t).join(",")} max={ATTACH_MAX}>
                  Sent by email to {thread.email}.{" "}
                  {ready
                    ? "When they answer by email, their answer is added here too (and is in your mailbox)."
                    : `When they answer, it arrives in your normal mailbox${answersTo ? ` (${answersTo})` : ""}.`}
                </ReplyForm>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
