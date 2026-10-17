// All database code for the website lives in this one file.
// We use Prisma (see prisma/schema.prisma). The database is Supabase (PostgreSQL).
// To fill an empty database with the starting content, run: npm run db:seed

import { PrismaClient, type Project } from "@prisma/client";


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

// ---------- Projects (the "Impact" pages) ----------

// The fixed list of project categories (the admin chooses one)
export const PROJECT_CATEGORIES = [
  "Education",
  "Youth activities",
  "Women & families",
  "Employability",
  "Welfare & advocacy",
  "Community events",
];

// Published projects, optionally only one period (for example "2025–26")
export async function getProjects(period?: string, includeHidden = false) {
  return prisma.project.findMany({
    where: { ...(period ? { period } : {}), ...(includeHidden ? {} : { published: true }) },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
}

export async function getProjectBySlug(slug: string) {
  return prisma.project.findFirst({ where: { slug, published: true } });
}

// The home page "Featured story": the featured project, or else the newest published one
export async function getFeaturedProject() {
  const featured = await prisma.project.findFirst({ where: { isFeatured: true, published: true } });
  return featured ?? prisma.project.findFirst({ where: { published: true }, orderBy: { id: "desc" } });
}

// The different periods, newest first ("2025–26" before "2024–25")
export async function getProjectPeriods() {
  const rows = await prisma.project.findMany({
    where: { published: true },
    select: { period: true },
    distinct: ["period"],
  });
  return rows
    .map((r) => r.period)
    .filter((p) => p)
    .sort()
    .reverse();
}

// "93|boys aged 11–16" (one per line) -> [{ number: "93", label: "boys aged 11–16" }]
export function toStats(text: string) {
  return toLines(text).map((line) => {
    const [number, ...label] = line.split("|");
    return { number: number.trim(), label: label.join("|").trim() };
  });
}

// The small set of facts a project card needs (cards are drawn in components/Motion.tsx)
export type ProjectCardData = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  period: string;
  peopleReached: number;
  coverImage: string;
  coverAlt: string;
  stat: { number: string; label: string } | null; // the first number, shown big on the card
};

export function toProjectCard(project: Project): ProjectCardData {
  // The cover's description comes from its line in the gallery, if it is there
  const cover = toGallery(project.gallery, project.title).find((g) => g.src === project.coverImage);
  return {
    slug: project.slug,
    title: project.title,
    category: project.category,
    summary: project.summary,
    period: project.period,
    peopleReached: project.peopleReached,
    coverImage: project.coverImage,
    coverAlt: cover?.alt ?? project.title,
    stat: toStats(project.stats)[0] ?? null,
  };
}

// Gallery lines: "path" or "path | description" -> [{ src, alt }]
export function toGallery(text: string, title: string) {
  const lines = toLines(text);
  return lines.map((line, i) => {
    const [src, ...alt] = line.split("|");
    return { src: src.trim(), alt: alt.join("|").trim() || `${title}, photo ${i + 1} of ${lines.length}` };
  });
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
