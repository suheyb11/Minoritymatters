// All database code for the website lives in this one file.
// We use SQLite (one file: data/minoritymatters.db) with plain SQL through "better-sqlite3".
// The tables are created automatically the first time the site starts, and filled with
// the content from the old website (see lib/seed.ts).

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { seedDatabase } from "./seed";

// ---------- Types (one per table) ----------

export type Setting = {
  id: number;
  heroTagline: string;
  introHeading: string;
  introSubtitle: string;
  introText: string;
  address: string;
  phone: string;
  email: string;
  pressEmail: string;
  charityNumber: string;
  donateUrl: string;
  tiktokUrl: string;
  xUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  aboutLead: string;
  aboutStory: string;
  vision: string;
  mission: string;
};

export type Service = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  intro: string;
  points: string; // one bullet per line
  outro: string; // paragraphs separated by a blank line
  icon: string;
  sortOrder: number;
  published: number; // 1 = visible, 0 = hidden
};

export type Value = {
  id: number;
  title: string;
  text: string;
  icon: string;
  sortOrder: number;
};

export type PressItem = {
  id: number;
  title: string;
  source: string;
  url: string;
  image: string;
  sortOrder: number;
};

export type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  body: string; // paragraphs separated by a blank line
  coverImage: string;
  author: string;
  published: number; // 1 = visible, 0 = draft
  publishedAt: string; // ISO date text
};

export type Funder = {
  id: number;
  name: string;
  logo: string;
  url: string;
  showLogo: number; // 1 = show logo on the home page
  sortOrder: number;
};

export type Message = {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  isRead: number;
  createdAt: string;
};

// ---------- Table definitions ----------

const SCHEMA = `
CREATE TABLE IF NOT EXISTS Setting (
  id INTEGER PRIMARY KEY,
  heroTagline TEXT NOT NULL DEFAULT '',
  introHeading TEXT NOT NULL DEFAULT '',
  introSubtitle TEXT NOT NULL DEFAULT '',
  introText TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  pressEmail TEXT NOT NULL DEFAULT '',
  charityNumber TEXT NOT NULL DEFAULT '',
  donateUrl TEXT NOT NULL DEFAULT '',
  tiktokUrl TEXT NOT NULL DEFAULT '',
  xUrl TEXT NOT NULL DEFAULT '',
  facebookUrl TEXT NOT NULL DEFAULT '',
  youtubeUrl TEXT NOT NULL DEFAULT '',
  aboutLead TEXT NOT NULL DEFAULT '',
  aboutStory TEXT NOT NULL DEFAULT '',
  vision TEXT NOT NULL DEFAULT '',
  mission TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS Service (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  intro TEXT NOT NULL DEFAULT '',
  points TEXT NOT NULL DEFAULT '',
  outro TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '/images/icons/promotion.svg',
  sortOrder INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS Value (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '',
  sortOrder INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS PressItem (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  sortOrder INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS Post (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  coverImage TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT 'Minority Matters',
  published INTEGER NOT NULL DEFAULT 1,
  publishedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Funder (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  logo TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  showLogo INTEGER NOT NULL DEFAULT 0,
  sortOrder INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS Message (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  isRead INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

// ---------- Open the database (only once) ----------

function openDatabase() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const database = new Database(path.join(dataDir, "minoritymatters.db"));
  database.pragma("journal_mode = WAL");
  database.exec(SCHEMA);

  // First run: copy in the content from the old website
  const row = database.prepare("SELECT COUNT(*) AS total FROM Setting").get() as { total: number };
  if (row.total === 0) {
    database.transaction(() => seedDatabase(database))();
  }
  return database;
}

// Keep one connection while developing (Next.js reloads files often)
const globalForDb = globalThis as unknown as { mmDb?: Database.Database };
export const db = globalForDb.mmDb ?? openDatabase();
globalForDb.mmDb = db;

// ---------- Read functions used by the pages ----------

export function getSettings() {
  return db.prepare("SELECT * FROM Setting WHERE id = 1").get() as Setting;
}

export function getServices(includeHidden = false) {
  const where = includeHidden ? "" : "WHERE published = 1";
  return db.prepare(`SELECT * FROM Service ${where} ORDER BY sortOrder, id`).all() as Service[];
}

export function getValues() {
  return db.prepare("SELECT * FROM Value ORDER BY sortOrder, id").all() as Value[];
}

export function getPress() {
  return db.prepare("SELECT * FROM PressItem ORDER BY sortOrder, id").all() as PressItem[];
}

export function getPosts(includeDrafts = false) {
  const where = includeDrafts ? "" : "WHERE published = 1";
  return db.prepare(`SELECT * FROM Post ${where} ORDER BY publishedAt DESC`).all() as Post[];
}

export function getPostBySlug(slug: string) {
  return db.prepare("SELECT * FROM Post WHERE slug = ? AND published = 1").get(slug) as Post | undefined;
}

export function getFunders() {
  return db.prepare("SELECT * FROM Funder ORDER BY sortOrder, id").all() as Funder[];
}

export function getMessages() {
  return db.prepare("SELECT * FROM Message ORDER BY createdAt DESC, id DESC").all() as Message[];
}

export function getRowById<T>(table: string, id: number) {
  return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id) as T | undefined;
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

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
