"use server";

import { prisma } from "@/lib/db";

export type ContactState = { ok: boolean; error: string };

// Saves a contact form message. Admins read them under Admin > Messages.
export async function sendMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const website = String(formData.get("website") || ""); // hidden field: bots fill it, people don't

  if (website) return { ok: true, error: "" };
  if (!name || !email || !message) return { ok: false, error: "Please fill in your name, email and message." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Please enter a valid email address." };
  if (message.length > 5000) return { ok: false, error: "Your message is too long. Please keep it under 5,000 characters." };

  await prisma.message.create({
    data: {
      name: name.slice(0, 200),
      email: email.slice(0, 200),
      phone: phone.slice(0, 50),
      message,
    },
  });
  return { ok: true, error: "" };
}
