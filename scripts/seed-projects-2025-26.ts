// Adds the 2025–26 projects recap to the EXISTING database (the one in DATABASE_URL):
//   npx tsx scripts/seed-projects-2025-26.ts
//
// - Projects: added or updated by slug (text from prisma/projects-2025-26.ts).
//   The gallery is every photo in public/images/projects/<slug>/ (1.jpg, 2.jpg …).
// - Funders from the recap: added if no funder with that name exists yet.
// - Instagram and LinkedIn links: filled in only if still empty.
// - Home page featured story: Tuition, only if no project is featured yet.
// Running it a second time changes nothing.

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PERIOD, PROJECTS_2025_26, NEW_FUNDERS, SOCIAL_SETTINGS, FEATURED } from "../prisma/projects-2025-26";

const prisma = new PrismaClient();

// "1.jpg", "2.jpg" … from the project's photo folder, in number order
function photosOf(slug: string) {
  const folder = path.join(process.cwd(), "public", "images", "projects", slug);
  if (!fs.existsSync(folder)) return [];
  return fs
    .readdirSync(folder)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => parseInt(a) - parseInt(b));
}

async function main() {
  let added = 0;
  let updated = 0;
  let unchanged = 0;

  for (let i = 0; i < PROJECTS_2025_26.length; i++) {
    const p = PROJECTS_2025_26[i];
    const files = photosOf(p.slug);
    // Each photo with its description: "/images/projects/tuition/1.jpg | Young people studying …"
    const gallery = files
      .map((file) => {
        const src = `/images/projects/${p.slug}/${file}`;
        const alt = p.photos[parseInt(file) - 1];
        return alt ? `${src} | ${alt}` : src;
      })
      .join("\n");

    const data = {
      title: p.title,
      slug: p.slug,
      period: PERIOD,
      category: p.category,
      summary: p.summary,
      body: p.body,
      stats: p.stats.join("\n"),
      peopleReached: p.peopleReached,
      coverImage: files.length > 0 ? `/images/projects/${p.slug}/${files[0]}` : "",
      gallery,
      relatedService: p.relatedService,
      sortOrder: i + 1,
      published: true,
    };

    const existing = await prisma.project.findUnique({ where: { slug: p.slug } });
    if (!existing) {
      await prisma.project.create({ data });
      added++;
    } else if (Object.entries(data).some(([key, value]) => existing[key as keyof typeof existing] !== value)) {
      await prisma.project.update({ where: { slug: p.slug }, data });
      updated++;
    } else {
      unchanged++;
    }
  }
  console.log(`Projects: ${added} added, ${updated} updated, ${unchanged} unchanged.`);

  // Home page "Featured story": Tuition, but only if no project is featured yet
  const featured = await prisma.project.findFirst({ where: { isFeatured: true } });
  if (featured) {
    console.log(`Featured story: already set (${featured.slug}).`);
  } else {
    await prisma.project.updateMany({
      where: { slug: FEATURED.slug },
      data: { isFeatured: true, featuredHeadline: FEATURED.headline },
    });
    console.log(`Featured story: set to ${FEATURED.slug}.`);
  }

  // Funders
  const funders = await prisma.funder.findMany();
  let order = Math.max(0, ...funders.map((f) => f.sortOrder));
  const newFunders = NEW_FUNDERS.filter((name) => !funders.some((f) => f.name.toLowerCase() === name.toLowerCase()));
  for (const name of newFunders) {
    await prisma.funder.create({ data: { name, sortOrder: ++order } });
  }
  console.log(`Funders: ${newFunders.length} added${newFunders.length ? " (" + newFunders.join(", ") + ")" : ""}.`);

  // Social links
  const settings = await prisma.setting.findUnique({ where: { id: 1 } });
  if (!settings) throw new Error("No site settings found. Run npm run db:seed first.");
  const fill: Record<string, string> = {};
  for (const [field, value] of Object.entries(SOCIAL_SETTINGS)) {
    if (!settings[field as keyof typeof SOCIAL_SETTINGS].trim()) fill[field] = value;
  }
  if (Object.keys(fill).length > 0) await prisma.setting.update({ where: { id: 1 }, data: fill });
  console.log(`Social links: ${Object.keys(fill).length ? "filled " + Object.keys(fill).join(", ") : "already filled"}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
