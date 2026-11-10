// MOVE FROM SUPABASE TO HOSTINGER, step 1: copies everything out of Supabase. Run it with: npm run data:from-supabase
// Needs in .env: SUPABASE_DATABASE_URL (the old Supabase DATABASE_URL), SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
// Only reads from Supabase: nothing there is changed.
//
// 1. Saves every row of every table to backup/data.json (the format npm run data:import reads).
// 2. Downloads every image uploaded in the admin (Storage bucket "media") into backup/storage/media/,
//    and changes their addresses in data.json to "/media/<file>" (served by app/media/[file]/route.ts).
// 3. Downloads the files sent with replies (private bucket "attachments") into backup/storage/attachments/.
// Then upload the CONTENT of backup/storage/ to STORAGE_DIR on Hostinger, and run npm run data:import (see HOSTINGER.md).

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../node_modules/.prisma/supabase-client";

const prisma = new PrismaClient();

// "https://abc.supabase.co/storage/v1/object/public/media/1712345-ab12cd.jpg"
const STORAGE_URL = /https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/media\/([A-Za-z0-9._-]+)/g;

async function main() {
  if (!process.env.SUPABASE_DATABASE_URL) throw new Error("Set SUPABASE_DATABASE_URL in .env (the old Supabase DATABASE_URL).");

  const data = {
    Setting: await prisma.setting.findMany({ orderBy: { id: "asc" } }),
    Service: await prisma.service.findMany({ orderBy: { id: "asc" } }),
    Project: await prisma.project.findMany({ orderBy: { id: "asc" } }),
    Value: await prisma.value.findMany({ orderBy: { id: "asc" } }),
    PressItem: await prisma.pressItem.findMany({ orderBy: { id: "asc" } }),
    Post: await prisma.post.findMany({ orderBy: { id: "asc" } }),
    Funder: await prisma.funder.findMany({ orderBy: { id: "asc" } }),
    Message: await prisma.message.findMany({ orderBy: { id: "asc" } }),
    Reply: await prisma.reply.findMany({ orderBy: { id: "asc" } }),
    AdminUser: await prisma.adminUser.findMany({ orderBy: { id: "asc" } }),
    MailConfig: await prisma.mailConfig.findMany({ orderBy: { id: "asc" } }),
    Event: await prisma.event.findMany({ orderBy: { id: "asc" } }),
    Booking: await prisma.booking.findMany({ orderBy: { id: "asc" } }),
  };

  const backup = path.join(process.cwd(), "backup");
  const mediaFolder = path.join(backup, "storage", "media");
  const attachFolder = path.join(backup, "storage", "attachments");
  fs.mkdirSync(mediaFolder, { recursive: true });
  fs.mkdirSync(attachFolder, { recursive: true });

  // ---------- Images ----------
  // JSON.stringify turns every Date into an ISO string, for example "2021-04-23T00:00:00.000Z"
  let json = JSON.stringify(data, null, 2);
  const images = new Map([...json.matchAll(STORAGE_URL)].map((m) => [m[1], m[0]])); // file name -> full address
  let missing = 0;
  for (const [file, address] of images) {
    const target = path.join(mediaFolder, file);
    if (fs.existsSync(target)) continue; // already downloaded in an earlier run
    const response = await fetch(address);
    if (!response.ok) {
      console.warn(`Could not download ${file} (${response.status}); its address is changed anyway.`);
      missing++;
      continue;
    }
    fs.writeFileSync(target, Buffer.from(await response.arrayBuffer()));
  }
  json = json.replace(STORAGE_URL, "/media/$1");

  // ---------- Reply attachments ----------
  const paths = data.Reply.flatMap((r) => (Array.isArray(r.files) ? (r.files as { path: string }[]).map((f) => f.path) : []));
  if (paths.length) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env to copy the reply attachments.");
    const bucket = createClient(url, key, { auth: { persistSession: false } }).storage.from("attachments");
    for (const p of paths) {
      if (!/^[a-f0-9]{24}\/[A-Za-z0-9_.-]+$/.test(p)) continue;
      const target = path.join(attachFolder, p);
      if (fs.existsSync(target)) continue;
      const { data: blob, error } = await bucket.download(p);
      if (error || !blob) {
        console.warn(`Could not download attachment ${p}: ${error?.message}`);
        missing++;
        continue;
      }
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, Buffer.from(await blob.arrayBuffer()));
    }
  }

  fs.writeFileSync(path.join(backup, "data.json"), json);
  for (const [table, rows] of Object.entries(data)) console.log(`${table}: ${rows.length} rows`);
  console.log(`${images.size} images in backup/storage/media/, ${paths.length} attachments in backup/storage/attachments/`);
  if (missing) console.log(`${missing} files could not be downloaded (see above).`);
  console.log("Saved to backup/data.json");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
