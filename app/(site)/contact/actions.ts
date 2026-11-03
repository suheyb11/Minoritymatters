"use server";

import { prisma } from "@/lib/db";
import { REASONS } from "@/lib/reasons";
import { tooMany } from "@/lib/rate-limit";
import { sendMail, headerName, adminUrl, EMAIL_PATTERN } from "@/lib/mail";

export type ContactState = { ok: boolean; error: string };

// Saves a contact form message. Admins read them under Admin > Messages.
export async function sendMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const reason = String(formData.get("reason") || REASONS[0]);
  const website = String(formData.get("website") || ""); // hidden field: bots fill it, people don't

  if (website) return { ok: true, error: "" };
  // At most 10 messages per visitor in 10 minutes, so the inbox can't be flooded
  if (await tooMany("contact", 10)) return { ok: false, error: "Too many messages from your connection. Please wait a few minutes and try again." };
  if (!REASONS.includes(reason)) return { ok: false, error: "Please choose a reason from the list." };
  if (!name || !email || !message) return { ok: false, error: "Please fill in your name, email and message." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Please enter a valid email address." };
  if (message.length > 5000) return { ok: false, error: "Your message is too long. Please keep it under 5,000 characters." };

  await prisma.message.create({
    data: {
      name: name.slice(0, 200),
      email: email.slice(0, 200),
      phone: phone.slice(0, 50),
      message,
      reason,
    },
  });
  await notifyCharity(name, email, phone, reason, message);
  return { ok: true, error: "" };
}

// Email the charity a copy of the message. Only when "Contact form email" is filled in under Site settings.
// "Reply" in the email program answers the person who wrote. A failed email never loses the message:
// it is always saved under Messages first.
async function notifyCharity(name: string, email: string, phone: string, reason: string, message: string) {
  const settings = await prisma.setting.findUnique({ where: { id: 1 } });
  const to = (settings?.contactNotifyEmail || "").trim();
  if (!EMAIL_PATTERN.test(to)) return;
  const lines = ["New message from the website contact form.", "", "Name: " + name, "Email: " + email];
  if (phone) lines.push("Phone: " + phone);
  lines.push("Reason: " + reason, "", message, "", "All messages: " + adminUrl("/messages"));
  await sendMail({
    to,
    subject: `Website message (${reason}): ${headerName(name)}`,
    text: lines.join("\n"),
    replyTo: `${headerName(name)} <${email}>`,
  });
}
