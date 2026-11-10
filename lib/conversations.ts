// Conversations in Admin > Messages: every contact form message and every reply sent from the admin,
// grouped by the person's email address, like an email inbox.
//
// Email answers: when someone answers a reply by email, the answer arrives in the charity's Google mailbox (info@…).
// syncReplies() reads that mailbox (IMAP, with the same Google account and App password as "Email sending") and adds
// those answers to the person's conversation as messages with the reason "Email reply".
// Only emails FROM people we already answered are copied; everything else in the mailbox is left alone.
// The mailbox is opened read-only, so nothing there is marked as read, moved or deleted.
// It runs when Admin > Messages is open (at most once a minute) and with the "Check for email replies" button.

import crypto from "crypto";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { Message, Reply } from "@prisma/client";
import { prisma } from "@/lib/db";
import { saveAttachment, readAttachment, removeAttachments } from "@/lib/storage";
import { getMailConfig, mailReady, senderAddress, decrypt, EMAIL_PATTERN } from "@/lib/mail";

export const EMAIL_REPLY = "Email reply";

export function emailKey(email: string) {
  return email.trim().toLowerCase();
}

// ---------- Reading conversations ----------

export type Thread = {
  email: string;
  name: string;
  last: Date;
  unread: number;
  count: number;
  preview: string;
  reason: string;
  replied: boolean;
};

// All conversations, newest activity first
export async function getConversations() {
  const messages = await prisma.message.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
  const replies = await prisma.reply.findMany({ orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
  const threads = new Map<string, Thread>();
  for (const m of messages) {
    const key = emailKey(m.email);
    if (!key) continue;
    if (!threads.has(key)) {
      threads.set(key, { email: key, name: m.name, last: m.createdAt, unread: 0, count: 0, preview: m.message, reason: m.reason, replied: false });
    }
    const t = threads.get(key)!;
    t.count++;
    if (!m.isRead) t.unread++;
  }
  for (const r of replies) {
    const t = threads.get(r.email);
    if (!t) continue;
    t.replied = true;
    if (r.createdAt >= t.last) {
      t.last = r.createdAt;
      t.preview = "You: " + r.body;
    }
  }
  return [...threads.values()].sort((a, b) => b.last.getTime() - a.last.getTime());
}

export type ReplyFile = { name: string; path: string; size: number };

export type ConversationItem = { type: "in"; message: Message } | { type: "out"; reply: Reply; files: ReplyFile[] };

// Reply.files is JSON text: [{ name, path, size }]
export function replyFiles(reply: Reply): ReplyFile[] {
  try {
    const list = JSON.parse(reply.files || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// One conversation, oldest first
export async function getConversation(email: string) {
  const key = emailKey(email);
  if (!key) return [];
  const messages = await prisma.message.findMany({ where: { email: key } }); // MySQL compares text without case
  const replies = await prisma.reply.findMany({ where: { email: key } });
  const items: (ConversationItem & { at: Date })[] = [
    ...messages.map((message) => ({ type: "in" as const, message, at: message.createdAt })),
    ...replies.map((reply) => ({ type: "out" as const, reply, files: replyFiles(reply), at: reply.createdAt })),
  ];
  return items.sort((a, b) => a.at.getTime() - b.at.getTime());
}

// A short fingerprint of the inbox: it changes when a message or reply is added, deleted or (un)read.
// The Messages page asks for it every 15 seconds and reloads its content when it changed.
export async function inboxStamp() {
  const [messages, replies, unread] = await Promise.all([
    prisma.message.aggregate({ _count: true, _max: { id: true } }),
    prisma.reply.aggregate({ _count: true, _max: { id: true } }),
    prisma.message.count({ where: { isRead: false } }),
  ]);
  const text = JSON.stringify([messages, replies, unread]);
  return crypto.createHash("md5").update(text).digest("hex").slice(0, 12);
}

// ---------- Files sent with a reply ----------
// Kept in STORAGE_DIR/attachments (never public, see lib/storage.ts): only the admin can download them,
// through /admin/messages/file. The browser uploads them one by one to /admin/messages/upload.

export const ATTACH_MAX = 5;
export const ATTACH_SIZE = 10 * 1024 * 1024; // each file
export const ATTACH_TOTAL = 20 * 1024 * 1024; // together (Gmail accepts emails up to 25 MB)
export const ATTACH_TYPES = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp", "rtf", "txt", "csv", "jpg", "jpeg", "png", "gif", "webp", "heic", "zip"];

// "My report (final).pdf" -> "My-report-final.pdf"
export function safeFileName(name: string) {
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const base = name.replace(/\.[^.]*$/, "").normalize("NFKD").replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "file";
  return ext ? `${base}.${ext}` : base;
}

export function attachmentExtension(name: string) {
  return name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
}

export { saveAttachment, readAttachment, removeAttachments };

export async function deleteReplyFiles(replies: Reply[]) {
  const paths = replies.flatMap((r) => replyFiles(r).map((f) => f.path));
  if (paths.length) await removeAttachments(paths);
}

// ---------- Copying email answers into conversations ----------

// The answer only: everything from the quoted earlier email ("On … wrote:", "> …", Outlook's "From:") is cut off
export function stripQuoted(text: string) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    const next = (lines[i + 1] || "").trim();
    if (/^On .{5,200}wrote:$/i.test(t)) break; // Gmail, Apple Mail
    if (/^On .{5,200}/i.test(t) && /wrote:$/i.test(next) && (t + next).length < 300) break; // the same on two lines
    if (/^-{2,}\s*(Original Message|Your message of)/i.test(t)) break; // Outlook, and our own quote
    if (/^_{10,}$/.test(t)) break; // Outlook's line
    if (/^From: .+/i.test(t) && /^(Sent|Date): /i.test(next)) break; // Outlook's header block
    if (t.startsWith(">")) continue; // a quoted line
    out.push(lines[i].trimEnd());
  }
  return out.join("\n").trim().replace(/\n{3,}/g, "\n\n");
}

function htmlToText(html: string) {
  return html
    .replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(br|\/p|\/div|\/li|\/tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Returns the number of answers added. Throws when the mailbox can't be read (the error is saved too).
// Without `force` it does nothing when the mailbox was checked less than a minute ago.
export async function syncReplies(force = false) {
  let config = await getMailConfig();
  if (!mailReady(config)) return 0;

  // At most once a minute: only the request that moves lastSyncAt forward does the work
  const minuteAgo = new Date(Date.now() - 60 * 1000);
  const claimed = await prisma.mailConfig.updateMany({
    where: { id: 1, ...(force ? {} : { OR: [{ lastSyncAt: null }, { lastSyncAt: { lt: minuteAgo } }] }) },
    data: { lastSyncAt: new Date() },
  });
  if (!claimed.count) return 0;
  config = await getMailConfig();

  // People who wrote through the website in the last 6 months, with when they first wrote
  const since = new Date(Date.now() - 183 * 24 * 60 * 60 * 1000);
  const people = new Map<string, { since: Date; name: string }>();
  const messages = await prisma.message.findMany({
    where: { createdAt: { gte: since }, reason: { not: EMAIL_REPLY } },
    orderBy: { createdAt: "asc" },
  });
  for (const m of messages) {
    const key = emailKey(m.email);
    if (EMAIL_PATTERN.test(key) && !people.has(key)) people.set(key, { since: new Date(m.createdAt.getTime() - 24 * 60 * 60 * 1000), name: m.name });
  }
  // Only people we have answered can answer back, and never our own address
  const answered = new Set((await prisma.reply.findMany({ select: { email: true }, distinct: ["email"] })).map((r) => r.email));
  const own = emailKey(senderAddress(config));
  for (const key of people.keys()) if (!answered.has(key) || key === own || key === emailKey(config.user)) people.delete(key);
  if (!people.size) return 0;

  const seen = new Set(config.seen.split("\n").filter(Boolean));
  let added = 0;
  const client = new ImapFlow({
    host: config.host === "smtp.gmail.com" ? "imap.gmail.com" : config.host.replace(/^smtp\./, "imap."),
    port: 993,
    secure: true,
    auth: { user: config.user, pass: decrypt(config.pass) },
    logger: false,
    connectionTimeout: 15000,
  });
  client.on("error", () => {}); // a dropped connection is reported by the awaited calls below
  try {
    await client.connect();
    // The "All Mail" folder (special-use \All), so answers are found even after they were archived; else the inbox
    const folder = (await client.list()).find((f) => f.specialUse === "\\All")?.path || "INBOX";
    const lock = await client.getMailboxLock(folder, { readOnly: true });
    try {
      const started = Date.now();
      for (const [email, person] of people) {
        if (Date.now() - started > 20000) break; // stop before the server's time limit; the rest comes next time
        const uids = (await client.search({ from: email, since: person.since }, { uid: true })) || [];
        for (const uid of uids) {
          const key = `${folder}:${uid}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const message = await client.fetchOne(String(uid), { source: true }, { uid: true });
          if (message && message.source && (await addEmailReply(email, person.name, message.source))) added++;
        }
      }
    } finally {
      lock.release();
    }
    await client.logout();
    await prisma.mailConfig.update({ where: { id: 1 }, data: { imapError: "", seen: [...seen].slice(-5000).join("\n") } });
  } catch (error) {
    client.close();
    const message = error instanceof Error ? error.message : String(error);
    await prisma.mailConfig.update({ where: { id: 1 }, data: { imapError: message.slice(0, 500), seen: [...seen].slice(-5000).join("\n") } });
    throw new Error(message);
  }
  return added;
}

// Adds one email answer to the person's conversation (once: the email's Message-ID is remembered)
async function addEmailReply(email: string, name: string, source: Buffer) {
  const mail = await simpleParser(source);
  const messageId = (mail.messageId || "").trim();
  if (messageId && (await prisma.message.findFirst({ where: { messageId }, select: { id: true } }))) return false;
  const body = mail.text || (typeof mail.html === "string" ? htmlToText(mail.html) : "");
  const text = stripQuoted(body).slice(0, 20000);
  if (!text) return false;
  await prisma.message.create({
    data: {
      name,
      email,
      message: text,
      reason: EMAIL_REPLY,
      isRead: false,
      subject: (mail.subject || "").slice(0, 300),
      messageId,
      createdAt: mail.date && !isNaN(mail.date.getTime()) ? mail.date : new Date(),
    },
  });
  return true;
}
