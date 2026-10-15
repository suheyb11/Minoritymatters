// ONE-TIME UPDATE: adds the brochure content to the EXISTING database (the one in DATABASE_URL).
// Run it once, after the "brochure-update" migration:
//   npx tsx scripts/brochure-update.ts
//
// What it does:
//   1. Renames the old "Educational support…" programme to "Positive Alternative" (keeps its text).
//   2. Merges the old "Campaign against…" programme into the new Campaign area, then deletes the old row.
//   3. Adds the 5 service areas (only if they are missing — existing areas are never overwritten).
//   4. Sets the type (area / programme) on every row.
//   5. Fills the 4 new brochure settings, but ONLY if they are still empty (admin edits are kept).
// It prints every change. Running it a second time changes nothing.

import { PrismaClient } from "@prisma/client";
import { BROCHURE_SETTINGS, SERVICE_AREAS, SAME_AS_BROCHURE, POSITIVE_ALTERNATIVE } from "../prisma/brochure";

const prisma = new PrismaClient();
const changes: string[] = [];

function lines(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

// Compare texts without caring about capitals or extra spaces
function same(a: string, b: string) {
  const clean = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  return clean(a) === clean(b);
}

async function main() {
  const areaSlugs = SERVICE_AREAS.map((a) => a.slug);

  // ---------- 1. Old "Educational support…" programme → "Positive Alternative" ----------
  const oldEducation = await prisma.service.findUnique({ where: { slug: "educational-support" } });
  if (oldEducation && oldEducation.kind !== "area") {
    await prisma.service.update({
      where: { id: oldEducation.id },
      data: { ...POSITIVE_ALTERNATIVE, kind: "programme" },
    });
    changes.push(`Renamed "${oldEducation.title}" to "${POSITIVE_ALTERNATIVE.title}" (slug ${POSITIVE_ALTERNATIVE.slug})`);
  }

  // ---------- 2. Old "Campaign against…" programme: remember its points, then delete it ----------
  let oldCampaignPoints: string[] = [];
  const oldCampaign = await prisma.service.findUnique({ where: { slug: "campaign-against-cce" } });
  if (oldCampaign && oldCampaign.kind !== "area") {
    oldCampaignPoints = lines(oldCampaign.points);
    await prisma.service.delete({ where: { id: oldCampaign.id } });
    changes.push(`Deleted the old programme "${oldCampaign.title}" (its points are merged into the Campaign area)`);
  }

  // ---------- 3. Add the 5 service areas if they are missing ----------
  for (let i = 0; i < SERVICE_AREAS.length; i++) {
    const area = SERVICE_AREAS[i];
    const existing = await prisma.service.findUnique({ where: { slug: area.slug } });

    const points = [...area.points];
    if (area.slug === "campaign-against-cce") {
      for (const p of oldCampaignPoints) {
        const duplicate = points.some((q) => same(p, q)) || SAME_AS_BROCHURE.some((q) => same(p, q));
        if (!duplicate) points.push(p);
      }
    }

    if (!existing) {
      await prisma.service.create({
        data: { ...area, points: points.join("\n"), kind: "area", intro: "", outro: "", sortOrder: i + 1 },
      });
      changes.push(`Added service area "${area.title}"`);
    } else if (area.slug === "campaign-against-cce" && oldCampaignPoints.length > 0) {
      // The area already exists (e.g. added by hand) — just add the old points it is missing
      const current = lines(existing.points);
      const missing = points.filter((p) => !current.some((q) => same(p, q)));
      if (missing.length > 0) {
        await prisma.service.update({ where: { id: existing.id }, data: { points: [...current, ...missing].join("\n") } });
        changes.push(`Added ${missing.length} point(s) to "${existing.title}"`);
      }
    }
  }

  // ---------- 4. Set the type on every row ----------
  for (const row of await prisma.service.findMany()) {
    const kind = areaSlugs.includes(row.slug) ? "area" : "programme";
    if (row.kind !== kind) {
      await prisma.service.update({ where: { id: row.id }, data: { kind } });
      changes.push(`Set type of "${row.title}" to ${kind}`);
    }
  }

  // ---------- 5. Brochure settings (only fill empty fields) ----------
  const settings = await prisma.setting.findUnique({ where: { id: 1 } });
  if (!settings) throw new Error("No site settings found. Run npm run db:seed or npm run data:import first.");
  const fill: Record<string, string> = {};
  for (const [field, value] of Object.entries(BROCHURE_SETTINGS)) {
    if (!settings[field as keyof typeof BROCHURE_SETTINGS].trim()) fill[field] = value;
  }
  if (Object.keys(fill).length > 0) {
    await prisma.setting.update({ where: { id: 1 }, data: fill });
    changes.push(`Filled empty settings: ${Object.keys(fill).join(", ")}`);
  }

  // ---------- Report ----------
  if (changes.length === 0) {
    console.log("Nothing to change — the database already has the brochure content.");
  } else {
    console.log("Changes:");
    for (const c of changes) console.log("  - " + c);
  }
  const rows = await prisma.service.findMany({ orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { id: "asc" }] });
  console.log("\nOur work now:");
  for (const r of rows) console.log(`  [${r.kind}] ${r.title} (/our-work#${r.slug})`);
  console.log("\nTip: the website refreshes its pages within an hour, or straight away after any save in the admin.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
