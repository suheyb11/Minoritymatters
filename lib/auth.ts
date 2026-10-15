// Very simple admin login: one password, stored in .env as ADMIN_PASSWORD.
// After login we save a signed cookie. Every admin page and action checks it.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";

const COOKIE_NAME = "mm_admin";

// The cookie value is a hash of the password + secret, so it cannot be guessed.
function expectedToken() {
  const secret = process.env.SESSION_SECRET || "dev-only-secret";
  const password = process.env.ADMIN_PASSWORD || "";
  return crypto.createHmac("sha256", secret).update(password).digest("hex");
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

export async function isLoggedIn() {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value || "";
  return safeEqual(value, expectedToken());
}

// Use at the top of every admin page / action
export async function requireAdmin() {
  if (!(await isLoggedIn())) redirect("/admin/login");
}

export async function checkPasswordAndLogIn(password: string) {
  const realPassword = process.env.ADMIN_PASSWORD || "";
  if (!realPassword || !safeEqual(password, realPassword)) return false;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return true;
}

export async function logOut() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
