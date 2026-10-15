// ONE-TIME: fills the "Our founder" settings in the EXISTING database (the one in DATABASE_URL).
// Run it once, after the "founder-video" migration:
//   npx tsx scripts/founder-seed.ts
//
// It only fills fields that are still EMPTY, so anything typed in the admin is never overwritten.
// Running it a second time changes nothing.

import { PrismaClient } from "@prisma/client";
import { FOUNDER_SETTINGS } from "../prisma/brochure";

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.setting.findUnique({ where: { id: 1 } });
  if (!settings) throw new Error("No site settings found. Run npm run db:seed or npm run data:import first.");

  const fill: Record<string, string> = {};
  for (const [field, value] of Object.entries(FOUNDER_SETTINGS)) {
    if (!settings[field as keyof typeof FOUNDER_SETTINGS].trim()) fill[field] = value;
  }

  if (Object.keys(fill).length === 0) {
    console.log("Nothing to change — the founder settings are already filled in.");
    return;
  }
  await prisma.setting.update({ where: { id: 1 }, data: fill });
  console.log("Filled empty founder settings: " + Object.keys(fill).join(", "));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
