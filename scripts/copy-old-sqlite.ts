// ONE-TIME COPY: moves your content from the old database (data/minoritymatters.db, used before Prisma)
// into the Prisma database (DATABASE_URL in .env). The ids stay the same.
//
// better-sqlite3 is no longer part of the project, so install it just for this run:
//   npm i --no-save better-sqlite3
// Then run it once, after the first migration, INSTEAD of the seed:
//   npx prisma migrate dev --name init
//   npx tsx scripts/copy-old-sqlite.ts
// (This file is left out of the type check in tsconfig.json because better-sqlite3 is not installed.)
//
// WARNING: it deletes everything in the Prisma database first.

import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const oldFile = path.join(process.cwd(), "data", "minoritymatters.db");

// The old database saved dates as text, for example "2021-04-23T00:00:00.000Z" or "2024-05-01 10:30:00" (UTC)
function toDate(value: string) {
  if (value.includes("T")) return new Date(value);
  return new Date(value.replace(" ", "T") + "Z");
}

async function main() {
  if (!fs.existsSync(oldFile)) {
    console.log("No old database found at data/minoritymatters.db — nothing to copy.");
    return;
  }
  const old = new Database(oldFile, { readonly: true });

  // Read every table. "any" is fine here: this script only runs once.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const read = (table: string) => old.prepare(`SELECT * FROM ${table} ORDER BY id`).all() as any[];
  const settings = read("Setting");
  const services = read("Service");
  const values = read("Value");
  const press = read("PressItem");
  const posts = read("Post");
  const funders = read("Funder");
  const messages = read("Message");
  old.close();

  // Start with empty tables
  await prisma.message.deleteMany();
  await prisma.funder.deleteMany();
  await prisma.post.deleteMany();
  await prisma.pressItem.deleteMany();
  await prisma.value.deleteMany();
  await prisma.service.deleteMany();
  await prisma.setting.deleteMany();

  // Copy the rows. 0/1 becomes false/true and date text becomes a Date.
  for (const row of settings) await prisma.setting.create({ data: row });
  for (const row of services) await prisma.service.create({ data: { ...row, published: row.published === 1 } });
  for (const row of values) await prisma.value.create({ data: row });
  for (const row of press) await prisma.pressItem.create({ data: row });
  for (const row of posts) {
    await prisma.post.create({ data: { ...row, published: row.published === 1, publishedAt: toDate(row.publishedAt) } });
  }
  for (const row of funders) await prisma.funder.create({ data: { ...row, showLogo: row.showLogo === 1 } });
  for (const row of messages) {
    await prisma.message.create({ data: { ...row, isRead: row.isRead === 1, createdAt: toDate(row.createdAt) } });
  }

  console.log(
    `Copied: ${settings.length} settings, ${services.length} programmes, ${values.length} values, ${press.length} press items, ` +
      `${posts.length} posts, ${funders.length} funders, ${messages.length} messages.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
