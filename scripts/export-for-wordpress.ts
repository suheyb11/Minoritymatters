// MOVE TO WORDPRESS: copies everything from the database (Supabase) for the WordPress importer.
// Run it with: npm run data:for-wordpress   (see wordpress/WORDPRESS.md)
//
// 1. Saves every row of every table to backup/data.json.
// 2. Downloads every image uploaded in the admin (Supabase Storage) into backup/media/,
//    and changes their addresses in data.json to "/media/<file>".
// Then: upload backup/media/* to wp-content/uploads/mm-media/ and import data.json under Tools > Import website data.

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// "https://abc.supabase.co/storage/v1/object/public/media/1712345-ab12cd.jpg"
const STORAGE_URL = /https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/media\/([A-Za-z0-9._-]+)/g;

async function main() {
  const data = {
    Setting: await prisma.setting.findMany({ orderBy: { id: "asc" } }),
    Service: await prisma.service.findMany({ orderBy: { id: "asc" } }),
    Project: await prisma.project.findMany({ orderBy: { id: "asc" } }),
    Value: await prisma.value.findMany({ orderBy: { id: "asc" } }),
    PressItem: await prisma.pressItem.findMany({ orderBy: { id: "asc" } }),
    Post: await prisma.post.findMany({ orderBy: { id: "asc" } }),
    Funder: await prisma.funder.findMany({ orderBy: { id: "asc" } }),
    Message: await prisma.message.findMany({ orderBy: { id: "asc" } }),
    Event: await prisma.event.findMany({ orderBy: { id: "asc" } }),
    Booking: await prisma.booking.findMany({ orderBy: { id: "asc" } }),
  };

  // JSON.stringify turns every Date into an ISO string, for example "2021-04-23T00:00:00.000Z"
  let json = JSON.stringify(data, null, 2);

  const folder = path.join(process.cwd(), "backup");
  const mediaFolder = path.join(folder, "media");
  fs.mkdirSync(mediaFolder, { recursive: true });

  const files = new Map([...json.matchAll(STORAGE_URL)].map((m) => [m[1], m[0]])); // file name -> full address
  for (const [file, address] of files) {
    const target = path.join(mediaFolder, file);
    if (fs.existsSync(target)) continue; // already downloaded in an earlier run
    const response = await fetch(address);
    if (!response.ok) {
      console.warn(`Could not download ${file} (${response.status}); its address is changed anyway.`);
      continue;
    }
    fs.writeFileSync(target, Buffer.from(await response.arrayBuffer()));
  }
  json = json.replace(STORAGE_URL, "/media/$1");

  fs.writeFileSync(path.join(folder, "data.json"), json);
  for (const [table, rows] of Object.entries(data)) console.log(`${table}: ${rows.length} rows`);
  console.log(`${files.size} uploaded images in backup/media/`);
  console.log("Saved to backup/data.json");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
