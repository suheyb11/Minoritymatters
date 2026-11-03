// Admin login: email + password. Two kinds of people can log in at /admin/login:
//   Administrator    ADMIN_PASSWORD in .env (and ADMIN_EMAIL, if set). Can do everything, also Users and Email sending.
//   Website manager  added by the Administrator under Admin > Users (table AdminUser). All content, messages, bookings, site settings.
// After login we save a signed cookie "<user id>.<expires>.<signature>" (id 0 = the Administrator).
// The signature includes the password, so changing a password or removing a person logs them out everywhere.

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "mm_admin";

export type AdminUser = { id: number; name: string; email: string; isAdministrator: boolean };

function sign(text: string) {
  const secret = process.env.SESSION_SECRET || "dev-only-secret";
  return crypto.createHmac("sha256", secret).update(text).digest("hex");
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

export function normalEmail(email: string) {
  return email.trim().toLowerCase();
}

// ---------- Passwords of Website managers: "scrypt$<salt>$<hash>" ----------

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `scrypt$${salt}$${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

export function checkPassword(password: string, stored: string) {
  const [kind, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  return safeEqual(crypto.scryptSync(password, salt, 64).toString("hex"), hash);
}

// ---------- Who is logged in ----------

function administrator(): AdminUser {
  return { id: 0, name: "Administrator", email: process.env.ADMIN_EMAIL || "", isAdministrator: true };
}

// The secret part of each person that goes into the signature
async function keyOf(id: number) {
  if (id === 0) return process.env.ADMIN_PASSWORD ? "admin:" + process.env.ADMIN_PASSWORD : null;
  const user = await prisma.adminUser.findUnique({ where: { id } });
  return user ? "user:" + user.passwordHash : null;
}

// The logged-in person, or null. Read once per request (cache).
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const cookieStore = await cookies();
  const [idText, expires, signature] = (cookieStore.get(COOKIE_NAME)?.value || "").split(".");
  const id = Number(idText);
  if (!Number.isInteger(id) || id < 0 || !(Number(expires) > Date.now()) || !signature) return null;
  const key = await keyOf(id);
  if (!key || !safeEqual(signature, sign(`${id}.${expires}.${key}`))) return null;
  if (id === 0) return administrator();
  const user = await prisma.adminUser.findUnique({ where: { id } });
  return user && { id: user.id, name: user.name, email: user.email, isAdministrator: false };
});

export async function isLoggedIn() {
  return (await getAdmin()) !== null;
}

// Use at the top of every admin page / action
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

// Only the Administrator: Users and Email sending
export async function requireAdministrator() {
  const admin = await requireAdmin();
  if (!admin.isAdministrator) redirect("/admin");
  return admin;
}

// ---------- Log in / out ----------

export async function setSession(id: number, remember: boolean) {
  const key = await keyOf(id);
  if (!key) return;
  const days = remember ? 30 : 1;
  const expires = Date.now() + days * 24 * 60 * 60 * 1000;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${id}.${expires}.${sign(`${id}.${expires}.${key}`)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: days * 24 * 60 * 60,
  });
}

// Returns the person's id, or null when the email or password is wrong
export async function checkLogin(email: string, password: string) {
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  const adminEmail = normalEmail(process.env.ADMIN_EMAIL || "");
  // The Administrator: the ADMIN_PASSWORD, with ADMIN_EMAIL when that is set
  if (adminPassword && safeEqual(password, adminPassword) && (!adminEmail || normalEmail(email) === adminEmail)) return 0;

  const user = await prisma.adminUser.findUnique({ where: { email: normalEmail(email) } });
  if (user && checkPassword(password, user.passwordHash)) return user.id;
  return null;
}

export async function logOut() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
