// All database code for the website lives in this one file.
// We use Prisma (see prisma/schema.prisma). The database is Supabase (PostgreSQL).
// To fill an empty database with the starting content, run: npm run db:seed

import { PrismaClient, type Project, type Event, type Prisma } from "@prisma/client";


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

// ---------- Events (/events) ----------

// The fixed list of audiences (used in the admin select and the filter chips on /events)
export const EVENT_AUDIENCES = ["Everyone", "Families", "Girls", "Boys", "Young women", "Mothers", "Parents", "Professionals"];

// The website's full address, for links in calendar files and search engine data
export const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

// An event is "upcoming" until it ends (or until it starts, when it has no end time)
function upcomingWhere(now: Date): Prisma.EventWhereInput {
  return { OR: [{ endsAt: { gte: now } }, { endsAt: null, startsAt: { gte: now } }] };
}

// The opposite: the event has ended. (Written out, because "NOT upcoming" would skip events with no end time:
// in SQL, comparing an empty endsAt gives "unknown" instead of false.)
function pastWhere(now: Date): Prisma.EventWhereInput {
  return { OR: [{ endsAt: { lt: now } }, { endsAt: null, startsAt: { lt: now } }] };
}

export function isFinished(event: Pick<Event, "startsAt" | "endsAt">) {
  return (event.endsAt ?? event.startsAt) < new Date();
}

export async function getUpcomingEvents(audience?: string) {
  return prisma.event.findMany({
    where: { published: true, ...upcomingWhere(new Date()), ...(audience ? { audience } : {}) },
    orderBy: { startsAt: "asc" },
  });
}

export async function getPastEvents(limit: number) {
  return prisma.event.findMany({
    where: { published: true, ...pastWhere(new Date()) },
    orderBy: { startsAt: "desc" },
    take: limit,
  });
}

export async function getEventBySlug(slug: string) {
  return prisma.event.findFirst({ where: { slug, published: true } });
}

// Published events linked to an Impact project, oldest first
export async function getEventsForProject(projectSlug: string) {
  return prisma.event.findMany({ where: { projectSlug, published: true }, orderBy: { startsAt: "asc" } });
}

// For Admin > Projects: how many events are linked to each project, and their attended places.
// { "girls-swimming": { events: 6, attended: 43 } }
export async function getEventStatsByProject() {
  const events = await prisma.event.findMany({
    where: { projectSlug: { not: "" } },
    select: { projectSlug: true, bookings: { where: { status: "attended" }, select: { adults: true, children: true } } },
  });
  const stats: Record<string, { events: number; attended: number }> = {};
  for (const e of events) {
    stats[e.projectSlug] ??= { events: 0, attended: 0 };
    stats[e.projectSlug].events += 1;
    stats[e.projectSlug].attended += e.bookings.reduce((sum, b) => sum + b.adults + b.children, 0);
  }
  return stats;
}

export async function getNextEvent() {
  return prisma.event.findFirst({ where: { published: true, ...upcomingWhere(new Date()) }, orderBy: { startsAt: "asc" } });
}

// Places taken = adults + children of confirmed and attended bookings.
// Pass "db" to count inside a transaction (see app/(site)/events/actions.ts).
export async function getPlacesTaken(eventId: number, db: Prisma.TransactionClient = prisma) {
  const sum = await db.booking.aggregate({
    where: { eventId, status: { in: ["confirmed", "attended"] } },
    _sum: { adults: true, children: true },
  });
  return (sum._sum.adults ?? 0) + (sum._sum.children ?? 0);
}

// Places per event and status, for many events at once: { 12: { confirmed: 18, waitlist: 3, ... } }
export async function getBookingTotals(eventIds: number[]) {
  const rows = await prisma.booking.groupBy({
    by: ["eventId", "status"],
    where: { eventId: { in: eventIds } },
    _sum: { adults: true, children: true },
  });
  const totals: Record<number, Record<string, number>> = {};
  for (const row of rows) {
    totals[row.eventId] ??= {};
    totals[row.eventId][row.status] = (row._sum.adults ?? 0) + (row._sum.children ?? 0);
  }
  return totals;
}

// Places left, or null when there is no limit (or when booking is not done through our form)
export function placesLeft(event: Pick<Event, "capacity" | "bookingType">, taken: number) {
  if (event.capacity === null || event.bookingType !== "form") return null;
  return Math.max(0, event.capacity - taken);
}

// "11–16", "11+", "up to 16" or ""
export function ageRange(event: Pick<Event, "ageMin" | "ageMax">) {
  const { ageMin, ageMax } = event;
  if (ageMin !== null && ageMax !== null) return `${ageMin}–${ageMax}`;
  if (ageMin !== null) return `${ageMin}+`;
  if (ageMax !== null) return `up to ${ageMax}`;
  return "";
}

// ---------- Dates in London time ----------
// The server may run in another time zone (Vercel uses UTC), so we always say "Europe/London".

const LONDON = "Europe/London";

function london(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: LONDON, ...options }).format(date);
}

// "Sat 14 Feb 2027" (built from parts, because en-GB would add a comma after the weekday)
export function formatEventDay(date: Date) {
  const weekday = london(date, { weekday: "short" });
  return `${weekday} ${london(date, { day: "numeric", month: "short", year: "numeric" })}`;
}

// "11:00"
export function formatTime(date: Date) {
  return london(date, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

// "Sat 14 Feb 2027 · 11:00–14:00" (or "Sat 14 Feb 2027 · 11:00 – Sun 15 Feb 2027 · 16:00" over two days)
export function formatEventDate(startsAt: Date, endsAt: Date | null) {
  const start = `${formatEventDay(startsAt)} · ${formatTime(startsAt)}`;
  if (!endsAt) return start;
  if (formatEventDay(endsAt) === formatEventDay(startsAt)) return `${start}–${formatTime(endsAt)}`;
  return `${start} – ${formatEventDay(endsAt)} · ${formatTime(endsAt)}`;
}

// The numbers of a date in London: { year: 2027, month: 2, day: 14, hour: 11, minute: 0 }
function londonParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

// Date -> "2027-02-14T11:00" in London time (the value a <input type="datetime-local"> needs)
export function toLondonInput(date: Date | null) {
  if (!date) return "";
  const p = londonParts(date);
  const two = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${two(p.month)}-${two(p.day)}T${two(p.hour)}:${two(p.minute)}`;
}

// "2027-02-14T11:00" typed in London time -> the right moment in time (saved in the database as UTC).
// London is UTC+0 in winter and UTC+1 in summer, so we work out the difference for that date.
export function fromLondonInput(value: string) {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const asUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const offset = (date: Date) => {
    const p = londonParts(date);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - Math.floor(date.getTime() / 60000) * 60000;
  };
  let date = new Date(asUtc - offset(new Date(asUtc)));
  date = new Date(asUtc - offset(date)); // check again, in case the clocks change between the two guesses
  return date;
}

// The small set of facts an event card needs (cards are drawn in components/Motion.tsx)
export type EventCardData = {
  slug: string;
  title: string;
  startsAtIso: string;
  day: string; // "14"
  month: string; // "Feb"
  monthHeading: string; // "February 2027"
  dateLine: string; // "Sat 14 Feb 2027 · 11:00–14:00"
  location: string;
  audience: string;
  audienceLine: string; // "Girls 11–16"
  price: string;
  placesLeft: number | null;
  coverImage: string;
};

export function toEventCard(event: Event, taken: number): EventCardData {
  return {
    slug: event.slug,
    title: event.title,
    startsAtIso: event.startsAt.toISOString(),
    day: london(event.startsAt, { day: "numeric" }),
    month: london(event.startsAt, { month: "short" }),
    monthHeading: london(event.startsAt, { month: "long", year: "numeric" }),
    dateLine: formatEventDate(event.startsAt, event.endsAt),
    location: event.location,
    audience: event.audience,
    audienceLine: `${event.audience} ${ageRange(event)}`.trim(),
    price: event.price,
    placesLeft: placesLeft(event, taken),
    coverImage: event.coverImage,
  };
}
