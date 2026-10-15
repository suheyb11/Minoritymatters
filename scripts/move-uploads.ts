// ONE-TIME SETUP for Supabase Storage. Run it with: npm run media:move
//
// 1. Creates the public bucket "media" (if it does not exist yet).
// 2. Uploads every image in the local uploads/ folder to the bucket.
// 3. Changes every "/media/<file>" address in the database to the file's new public Supabase address.
//
// Safe to run again: files already in the bucket are skipped, and addresses already changed stay the same.

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { BUCKET, supabaseAdmin, uploadImage, contentTypeFor } from "../lib/storage";

const prisma = new PrismaClient();

async function main() {
  const supabase = supabaseAdmin();

  // ---------- 1. The bucket ----------
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw new Error("Could not list buckets: " + error.message);
  if (!buckets.some((b) => b.name === BUCKET)) {
    const created = await supabase.storage.createBucket(BUCKET, { public: true });
    if (created.error) throw new Error("Could not create the bucket: " + created.error.message);
    console.log(`Created public bucket "${BUCKET}".`);
  } else {
    console.log(`Bucket "${BUCKET}" already exists.`);
  }

  // ---------- 2. Upload the files ----------
  const folder = path.join(process.cwd(), "uploads");
  const files = fs.existsSync(folder) ? fs.readdirSync(folder).filter((f) => contentTypeFor(path.extname(f))) : [];
  const newAddress: Record<string, string> = {}; // "/media/a.jpg" -> "https://...supabase.co/.../media/a.jpg"

  for (const file of files) {
    const existing = await supabase.storage.from(BUCKET).list("", { search: file });
    if (existing.data?.some((f) => f.name === file)) {
      newAddress["/media/" + file] = supabase.storage.from(BUCKET).getPublicUrl(file).data.publicUrl;
      console.log("Already in the bucket: " + file);
      continue;
    }
    newAddress["/media/" + file] = await uploadImage(file, fs.readFileSync(path.join(folder, file)), path.extname(file));
    console.log("Uploaded: " + file);
  }

  // ---------- 3. Update the addresses in the database ----------
  let changed = 0;
  const fix = (value: string) => newAddress[value] ?? value;

  for (const row of await prisma.service.findMany()) {
    if (fix(row.icon) !== row.icon) { await prisma.service.update({ where: { id: row.id }, data: { icon: fix(row.icon) } }); changed++; }
  }
  for (const row of await prisma.value.findMany()) {
    if (fix(row.icon) !== row.icon) { await prisma.value.update({ where: { id: row.id }, data: { icon: fix(row.icon) } }); changed++; }
  }
  for (const row of await prisma.pressItem.findMany()) {
    if (fix(row.image) !== row.image) { await prisma.pressItem.update({ where: { id: row.id }, data: { image: fix(row.image) } }); changed++; }
  }
  for (const row of await prisma.post.findMany()) {
    if (fix(row.coverImage) !== row.coverImage) { await prisma.post.update({ where: { id: row.id }, data: { coverImage: fix(row.coverImage) } }); changed++; }
  }
  for (const row of await prisma.funder.findMany()) {
    if (fix(row.logo) !== row.logo) { await prisma.funder.update({ where: { id: row.id }, data: { logo: fix(row.logo) } }); changed++; }
  }

  // Anything still pointing to /media/ has no file in uploads/ — list it so it can be fixed in the admin
  const left = [
    ...(await prisma.service.findMany({ where: { icon: { startsWith: "/media/" } } })).map((r) => "Our work: " + r.title),
    ...(await prisma.value.findMany({ where: { icon: { startsWith: "/media/" } } })).map((r) => "Values: " + r.title),
    ...(await prisma.pressItem.findMany({ where: { image: { startsWith: "/media/" } } })).map((r) => "Press: " + r.title),
    ...(await prisma.post.findMany({ where: { coverImage: { startsWith: "/media/" } } })).map((r) => "Blog: " + r.title),
    ...(await prisma.funder.findMany({ where: { logo: { startsWith: "/media/" } } })).map((r) => "Funders: " + r.name),
  ];

  console.log(`${files.length} files in uploads/, ${changed} database addresses updated.`);
  if (left.length) console.log("These still point to a missing /media/ file — upload the image again in the admin:\n  " + left.join("\n  "));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
