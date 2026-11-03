// How the website sends email (replies from Admin > Messages, contact form copies, booking notices, tests).
//
// The charity's email is Google Workspace. With "Email sending" filled in (Admin > Site settings, Administrator only),
// every email goes out through Google's mail server (SMTP) from the charity's own address, for example
// info@minoritymatters.org.uk. Google signs it, so it reaches the inbox, and a copy appears in that mailbox's "Sent" folder.
// Without it, emails go through Resend when RESEND_API_KEY is set in .env (the old booking notice), or not at all.
//
// The settings are the one MailConfig row. The App password is kept encrypted with SESSION_SECRET, not as plain text.

import crypto from "crypto";
import nodemailer from "nodemailer";
import { prisma, SITE_URL } from "@/lib/db";

export type Attachment = { filename: string; content: Buffer };
export type Mail = { to: string; subject: string; text: string; replyTo?: string; attachments?: Attachment[] };

export const EMAIL_PATTERN = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

export async function getMailConfig() {
  return (await prisma.mailConfig.findUnique({ where: { id: 1 } })) ?? (await prisma.mailConfig.create({ data: { id: 1 } }));
}

export type MailConfig = Awaited<ReturnType<typeof getMailConfig>>;

export function mailReady(config: MailConfig) {
  return EMAIL_PATTERN.test(config.user) && config.pass !== "";
}

// The address emails come from: "Send as", or else the Google account
export function senderAddress(config: MailConfig) {
  return EMAIL_PATTERN.test(config.fromAddress) ? config.fromAddress : config.user;
}

// ---------- The App password, encrypted (AES-256-GCM) ----------

function key() {
  return crypto.createHash("sha256").update(process.env.SESSION_SECRET || "dev-only-secret").digest();
}

export function encrypt(text: string) {
  if (!text) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return "enc:" + Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64");
}

export function decrypt(text: string) {
  if (!text.startsWith("enc:")) return text;
  try {
    const raw = Buffer.from(text.slice(4), "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
  } catch {
    return ""; // SESSION_SECRET changed: the password must be entered again
  }
}

// ---------- Sending ----------

// The name in "Reply-To" or "From" without line breaks or brackets, so it can't add extra email headers
export function headerName(name: string) {
  return name.replace(/[\r\n<>"]/g, "").trim();
}

// Sends one email. Returns true when it went out; never throws (the error is saved in MailConfig.lastError).
export async function sendMail(mail: Mail) {
  const config = await getMailConfig();
  try {
    if (mailReady(config)) {
      const transport = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        requireTLS: config.port !== 465,
        auth: { user: config.user, pass: decrypt(config.pass) },
        connectionTimeout: 15000,
        socketTimeout: 20000,
      });
      await transport.sendMail({
        from: { name: "Minority Matters", address: senderAddress(config) },
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        replyTo: mail.replyTo,
        attachments: mail.attachments,
      });
    } else if (process.env.RESEND_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.BOOKING_FROM_EMAIL || "Minority Matters website <onboarding@resend.dev>",
          to: mail.to,
          subject: mail.subject,
          text: mail.text,
          reply_to: mail.replyTo,
          attachments: mail.attachments?.map((a) => ({ filename: a.filename, content: a.content.toString("base64") })),
        }),
      });
      if (!response.ok) throw new Error(`Resend: ${response.status} ${(await response.text()).slice(0, 200)}`);
    } else {
      throw new Error("Email sending is not set up (Admin > Site settings > Email sending).");
    }
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Email failed", message);
    await prisma.mailConfig.update({ where: { id: 1 }, data: { lastError: message.slice(0, 500) } });
    return false;
  }
}

// The address people's email answers go to: the "Contact form email", or else the website's email
export async function replyToAddress() {
  const settings = await prisma.setting.findUnique({ where: { id: 1 } });
  const address = (settings?.contactNotifyEmail || "").trim() || (settings?.email || "").trim();
  return EMAIL_PATTERN.test(address) ? address : "";
}

export function adminUrl(path = "") {
  return `${SITE_URL}/admin${path}`;
}
