// Files uploaded in the admin, kept on the server's disk in STORAGE_DIR:
//   STORAGE_DIR/media/<file>                 images (public, served at /media/<file> by app/media/[file]/route.ts)
//   STORAGE_DIR/attachments/<folder>/<file>  files sent with replies (private: only a logged-in admin can download them)
//
// On Hostinger set STORAGE_DIR to a folder OUTSIDE the app folder (e.g. /home/u123456789/mm-storage),
// so a new deploy does not delete the files. On your computer it is the "storage" folder of the project.
// Only server code uses this file.

import fs from "fs/promises";
import path from "path";

export const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || path.join(process.cwd(), "storage"));
export const MEDIA_DIR = path.join(STORAGE_DIR, "media");
export const ATTACH_DIR = path.join(STORAGE_DIR, "attachments");

const types: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export function contentTypeFor(ext: string) {
  return types[ext.toLowerCase()];
}

// Media file names are made by the admin code: "1712345678901-ab12cd34.jpg"
export const MEDIA_NAME = /^[A-Za-z0-9._-]+$/;

// Example: uploadImage("1712345-ab12cd.jpg", bytes, ".jpg") -> "/media/1712345-ab12cd.jpg"
export async function uploadImage(fileName: string, bytes: Buffer, ext: string) {
  if (!MEDIA_NAME.test(fileName) || !contentTypeFor(ext)) throw new Error("Image upload failed: bad file name");
  await fs.mkdir(MEDIA_DIR, { recursive: true });
  await fs.writeFile(path.join(MEDIA_DIR, fileName), bytes, { flag: "wx" }); // never overwrite
  return `/media/${fileName}`;
}

// ---------- Private attachments. A path is "<24 hex characters>/<safe file name>" ----------

export const ATTACH_PATH = /^[a-f0-9]{24}\/[A-Za-z0-9_.-]+$/;

function attachmentFile(filePath: string) {
  if (!ATTACH_PATH.test(filePath) || filePath.includes("..")) throw new Error("Bad attachment path");
  return path.join(ATTACH_DIR, filePath);
}

export async function saveAttachment(filePath: string, bytes: Buffer) {
  const file = attachmentFile(filePath);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, bytes);
}

// The file's bytes, or null when it is not there
export async function readAttachment(filePath: string) {
  try {
    return await fs.readFile(attachmentFile(filePath));
  } catch {
    return null;
  }
}

export async function removeAttachments(paths: string[]) {
  for (const p of paths) {
    try {
      const file = attachmentFile(p);
      await fs.rm(file, { force: true });
      await fs.rmdir(path.dirname(file)).catch(() => {}); // the folder, once it is empty
    } catch {
      // a bad path or a file that is already gone: nothing to delete
    }
  }
}
