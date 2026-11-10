// RESTORE: puts every row from backup/data.json into the database that DATABASE_URL (in .env) points to.
// The ids stay the same. Run it with: npm run data:import
// backup/data.json comes from npm run data:export, or from npm run data:from-supabase (moving to Hostinger).
//
// The database must be empty (only the tables made by prisma migrate deploy), so nothing is overwritten by accident.

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DATE_FIELDS = ["createdAt", "publishedAt", "startsAt", "endsAt", "bookingClosesAt", "lastSyncAt"];

// Dates were saved as ISO text: turn them back into Date objects. Reply.files is stored as JSON text.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fix(rows: any[] = []) {
  return rows.map((row) => {
    const out = { ...row };
    for (const key of DATE_FIELDS) if (typeof out[key] === "string") out[key] = new Date(out[key]);
    if ("files" in out && typeof out.files !== "string") out.files = JSON.stringify(out.files ?? []);
    return out;
  });
}

async function main() {
  const file = path.join(process.cwd(), "backup", "data.json");
  if (!fs.existsSync(file)) throw new Error("backup/data.json not found. Run npm run data:export (or data:from-supabase) first.");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));

  const existing = (await prisma.setting.count()) + (await prisma.service.count()) + (await prisma.post.count()) + (await prisma.event.count());
  if (existing > 0) throw new Error("This database already has content. Empty it first, then try again.");

  // In this order: a Booking needs its Event
  await prisma.setting.createMany({ data: fix(data.Setting) });
  await prisma.service.createMany({ data: fix(data.Service) });
  await prisma.project.createMany({ data: fix(data.Project) });
  await prisma.value.createMany({ data: fix(data.Value) });
  await prisma.pressItem.createMany({ data: fix(data.PressItem) });
  await prisma.post.createMany({ data: fix(data.Post) });
  await prisma.funder.createMany({ data: fix(data.Funder) });
  await prisma.message.createMany({ data: fix(data.Message) });
  await prisma.reply.createMany({ data: fix(data.Reply) });
  await prisma.adminUser.createMany({ data: fix(data.AdminUser) });
  await prisma.mailConfig.createMany({ data: fix(data.MailConfig) });
  await prisma.event.createMany({ data: fix(data.Event) });
  await prisma.booking.createMany({ data: fix(data.Booking) });
  // MySQL moves the id counters on by itself, so new rows never get an id that is already used.

  for (const table of Object.keys(data)) console.log(`${table}: ${data[table].length} rows`);
  console.log("Import finished.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
