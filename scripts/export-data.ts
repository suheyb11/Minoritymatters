// BACKUP: saves every row of every table to backup/data.json.
// Run it with: npm run data:export
// Use it before moving to another database (for example Supabase), then run npm run data:import there.

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const data = {
    Setting: await prisma.setting.findMany({ orderBy: { id: "asc" } }),
    Service: await prisma.service.findMany({ orderBy: { id: "asc" } }),
    Value: await prisma.value.findMany({ orderBy: { id: "asc" } }),
    PressItem: await prisma.pressItem.findMany({ orderBy: { id: "asc" } }),
    Post: await prisma.post.findMany({ orderBy: { id: "asc" } }),
    Funder: await prisma.funder.findMany({ orderBy: { id: "asc" } }),
    Message: await prisma.message.findMany({ orderBy: { id: "asc" } }),
  };

  const folder = path.join(process.cwd(), "backup");
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  // JSON.stringify turns every Date into an ISO string, for example "2021-04-23T00:00:00.000Z"
  fs.writeFileSync(path.join(folder, "data.json"), JSON.stringify(data, null, 2));

  for (const [table, rows] of Object.entries(data)) console.log(`${table}: ${rows.length} rows`);
  console.log("Saved to backup/data.json");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
