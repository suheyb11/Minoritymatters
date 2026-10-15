// Uploads images to Supabase Storage (public bucket "media") and returns their public web address.
// Only server code uses this file: the service role key is secret and must never reach the browser.

import { createClient } from "@supabase/supabase-js";

export const BUCKET = "media";

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

export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");
  return createClient(url, key, { auth: { persistSession: false } });
}

// Example: uploadImage("1712345-ab12cd.jpg", bytes, ".jpg") -> "https://xyz.supabase.co/storage/v1/object/public/media/1712345-ab12cd.jpg"
export async function uploadImage(fileName: string, bytes: Buffer, ext: string) {
  const supabase = supabaseAdmin();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, bytes, { contentType: contentTypeFor(ext), cacheControl: "31536000", upsert: false });
  if (error) throw new Error("Image upload failed: " + error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
}
