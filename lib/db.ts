// All database code for the website lives in this one file.
// We use Prisma (see prisma/schema.prisma). Right now the database is SQLite (prisma/dev.db).
// To fill an empty database with the starting content, run: npm run db:seed

import { PrismaClient } from "@prisma/client";


// ---------- Open the database (only once) ----------

// Keep one Prisma client while developing (Next.js reloads files often)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ---------- Read functions used by the pages ----------

export async function getSettings() {
  const settings = await prisma.setting.findUnique({ where: { id: 1 } });
  if (!settings) throw new Error("No site settings found. Run: npm run db:seed");
  return settings;
}

export async function getServices(includeHidden = false) {
  return prisma.service.findMany({
    where: includeHidden ? {} : { published: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
}

export async function getValues() {
  return prisma.value.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
}

export async function getPress() {
  return prisma.pressItem.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
}

export async function getPosts(includeDrafts = false) {
  return prisma.post.findMany({
    where: includeDrafts ? {} : { published: true },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getPostBySlug(slug: string) {
  return prisma.post.findFirst({ where: { slug, published: true } });
}

export async function getFunders() {
  return prisma.funder.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
}

export async function getMessages() {
  return prisma.message.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
}

// ---------- Small text helpers ----------

// "Hello World!" -> "hello-world"
export function makeSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Split text into paragraphs (blank line = new paragraph)
export function toParagraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

// Split text into lines (one bullet per line)
export function toLines(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
