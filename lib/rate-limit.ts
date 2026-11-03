// "Too many tries": at most `limit` uses of a form per visitor in 10 minutes (contact form, admin login).
// Only a hash of the visitor's IP address is kept, and only for an hour.

import crypto from "crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

const WINDOW = 10 * 60 * 1000;

export async function tooMany(action: string, limit: number) {
  const list = await headers();
  const ip = (list.get("x-forwarded-for") || "").split(",")[0].trim() || list.get("x-real-ip") || "";
  const secret = process.env.SESSION_SECRET || "dev-only-secret";
  const key = action + ":" + crypto.createHash("sha256").update(ip + secret).digest("hex").slice(0, 32);

  const count = await prisma.rateHit.count({ where: { key, createdAt: { gte: new Date(Date.now() - WINDOW) } } });
  if (count >= limit) return true;
  await prisma.rateHit.create({ data: { key } });
  // Now and then, forget old tries
  if (Math.random() < 0.05) await prisma.rateHit.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 60 * 60 * 1000) } } });
  return false;
}
