// RESTORE: puts every row from backup/data.json into the database that DATABASE_URL (in .env) points to.
// The ids stay the same. Run it with: npm run data:import
//
// Moving to Supabase:
//   1. npm run data:export                      (while .env still points to the old database)
//   2. in prisma/schema.prisma set provider = "postgresql", and in .env set DATABASE_URL to Supabase
//   3. delete the prisma/migrations folder, then: npx prisma migrate dev --name init
//   4. npm run data:import
//
// The database must be empty, so nothing is overwritten by accident.

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const file = path.join(process.cwd(), "backup", "data.json");
  if (!fs.existsSync(file)) throw new Error("backup/data.json not found. Run npm run data:export first.");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));

  const existing = (await prisma.setting.count()) + (await prisma.service.count()) + (await prisma.post.count());
  if (existing > 0) {
    throw new Error("This database already has content. Empty it first (npx prisma migrate reset), then try again.");
  }

  // Dates were saved as ISO text; turn them back into Date objects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts = data.Post.map((p: any) => ({ ...p, publishedAt: new Date(p.publishedAt) }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages = data.Message.map((m: any) => ({ ...m, createdAt: new Date(m.createdAt) }));

  await prisma.setting.createMany({ data: data.Setting });
  await prisma.service.createMany({ data: data.Service });
  await prisma.value.createMany({ data: data.Value });
  await prisma.pressItem.createMany({ data: data.PressItem });
  await prisma.post.createMany({ data: posts });
  await prisma.funder.createMany({ data: data.Funder });
  await prisma.message.createMany({ data: messages });

  // PostgreSQL only: the id counters do not move when rows are inserted with their own ids.
  // Set each counter to the highest id, so the next new row does not get an id that is already used.
  const url = process.env.DATABASE_URL || "";
  if (url.startsWith("postgres")) {
    for (const table of ["Service", "Value", "PressItem", "Post", "Funder", "Message"]) {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE(MAX(id), 1)) FROM "${table}"`
      );
    }
    console.log("Reset the PostgreSQL id counters.");
  }

  for (const table of Object.keys(data)) console.log(`${table}: ${data[table].length} rows`);
  console.log("Import finished.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
