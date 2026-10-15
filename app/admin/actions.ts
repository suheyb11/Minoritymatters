"use server";

// All admin "save" and "delete" actions live in this file.
// Every action first checks that the admin is logged in.

import path from "path";
import crypto from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma, makeSlug } from "@/lib/db";
import { uploadImage, contentTypeFor } from "@/lib/storage";
import { requireAdmin, checkPasswordAndLogIn, logOut } from "@/lib/auth";

// ---------- Small helpers ----------

function text(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function num(formData: FormData, name: string) {
  return Number(formData.get(name) || 0) || 0;
}

function checkbox(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

// If a file was chosen, upload it to Supabase Storage and return its public web address.
// Otherwise return the address typed in the text box.
async function imageFrom(formData: FormData, name: string) {
  const file = formData.get(name + "File");
  if (file instanceof File && file.size > 0) {
    const ext = path.extname(file.name).toLowerCase();
    if (!contentTypeFor(ext)) throw new Error("Please upload a PNG, JPG, GIF, WEBP or SVG image.");
    // Vercel refuses requests bigger than 4.5 MB, so images must stay under 4 MB
    if (file.size > 4 * 1024 * 1024) throw new Error("Images must be smaller than 4 MB.");

    const fileName = Date.now() + "-" + crypto.randomBytes(4).toString("hex") + ext;
    return uploadImage(fileName, Buffer.from(await file.arrayBuffer()), ext);
  }
  return text(formData, name);
}

// True when Prisma says a unique field (like the slug) is already used by another row
function isDuplicateError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

// Note: the delete actions use deleteMany so that clicking "Delete" twice
// (when the row is already gone) does not show an error.

// Refresh every page so visitors see the change
function refreshSite() {
  revalidatePath("/", "layout");
}

// ---------- Login / logout ----------

export async function loginAction(formData: FormData) {
  const ok = await checkPasswordAndLogIn(text(formData, "password"));
  if (!ok) redirect("/admin/login?error=1");
  redirect("/admin");
}

export async function logoutAction() {
  await logOut();
  redirect("/admin/login");
}

// ---------- Settings ----------

export async function saveSettings(formData: FormData) {
  await requireAdmin();
  await prisma.setting.update({
    where: { id: 1 },
    data: {
      heroTagline: text(formData, "heroTagline"),
      introHeading: text(formData, "introHeading"),
      introSubtitle: text(formData, "introSubtitle"),
      introText: text(formData, "introText"),
      address: text(formData, "address"),
      phone: text(formData, "phone"),
      email: text(formData, "email"),
      pressEmail: text(formData, "pressEmail"),
      charityNumber: text(formData, "charityNumber"),
      donateUrl: text(formData, "donateUrl"),
      tiktokUrl: text(formData, "tiktokUrl"),
      xUrl: text(formData, "xUrl"),
      facebookUrl: text(formData, "facebookUrl"),
      youtubeUrl: text(formData, "youtubeUrl"),
      aboutLead: text(formData, "aboutLead"),
      aboutStory: text(formData, "aboutStory"),
      vision: text(formData, "vision"),
      mission: text(formData, "mission"),
    },
  });
  refreshSite();
  redirect("/admin/settings?saved=1");
}

// ---------- Services (Our work) ----------

export async function saveService(formData: FormData) {
  await requireAdmin();
  const id = num(formData, "id");
  const title = text(formData, "title");
  const data = {
    title,
    slug: makeSlug(text(formData, "slug") || title),
    summary: text(formData, "summary"),
    intro: text(formData, "intro"),
    points: text(formData, "points"),
    outro: text(formData, "outro"),
    icon: await imageFrom(formData, "icon"),
    sortOrder: num(formData, "sortOrder"),
    published: checkbox(formData, "published"),
  };

  try {
    if (id) {
      await prisma.service.update({ where: { id }, data });
    } else {
      await prisma.service.create({ data });
    }
  } catch (error) {
    if (!isDuplicateError(error)) throw error;
    redirect(`/admin/services?${id ? "edit=" + id : "new=1"}&error=slug`);
  }
  refreshSite();
  redirect("/admin/services?saved=1");
}

export async function deleteService(formData: FormData) {
  await requireAdmin();
  await prisma.service.deleteMany({ where: { id: num(formData, "id") } });
  refreshSite();
  redirect("/admin/services?deleted=1");
}

// ---------- Values ----------

export async function saveValue(formData: FormData) {
  await requireAdmin();
  const id = num(formData, "id");
  const data = {
    title: text(formData, "title"),
    text: text(formData, "text"),
    icon: await imageFrom(formData, "icon"),
    sortOrder: num(formData, "sortOrder"),
  };
  if (id) {
    await prisma.value.update({ where: { id }, data });
  } else {
    await prisma.value.create({ data });
  }
  refreshSite();
  redirect("/admin/values?saved=1");
}

export async function deleteValue(formData: FormData) {
  await requireAdmin();
  await prisma.value.deleteMany({ where: { id: num(formData, "id") } });
  refreshSite();
  redirect("/admin/values?deleted=1");
}

// ---------- Press ----------

export async function savePress(formData: FormData) {
  await requireAdmin();
  const id = num(formData, "id");
  const data = {
    title: text(formData, "title"),
    source: text(formData, "source"),
    url: text(formData, "url"),
    image: await imageFrom(formData, "image"),
    sortOrder: num(formData, "sortOrder"),
  };
  if (id) {
    await prisma.pressItem.update({ where: { id }, data });
  } else {
    await prisma.pressItem.create({ data });
  }
  refreshSite();
  redirect("/admin/press?saved=1");
}

export async function deletePress(formData: FormData) {
  await requireAdmin();
  await prisma.pressItem.deleteMany({ where: { id: num(formData, "id") } });
  refreshSite();
  redirect("/admin/press?deleted=1");
}

// ---------- Blog posts ----------

export async function savePost(formData: FormData) {
  await requireAdmin();
  const id = num(formData, "id");
  const title = text(formData, "title");
  const date = text(formData, "publishedAt") || new Date().toISOString().slice(0, 10);
  const data = {
    title,
    slug: makeSlug(text(formData, "slug") || title),
    excerpt: text(formData, "excerpt"),
    body: text(formData, "body"),
    coverImage: await imageFrom(formData, "coverImage"),
    author: text(formData, "author") || "Minority Matters",
    published: checkbox(formData, "published"),
    publishedAt: new Date(date),
  };

  try {
    if (id) {
      await prisma.post.update({ where: { id }, data });
    } else {
      await prisma.post.create({ data });
    }
  } catch (error) {
    if (!isDuplicateError(error)) throw error;
    redirect(`/admin/blog?${id ? "edit=" + id : "new=1"}&error=slug`);
  }
  refreshSite();
  redirect("/admin/blog?saved=1");
}

export async function deletePost(formData: FormData) {
  await requireAdmin();
  await prisma.post.deleteMany({ where: { id: num(formData, "id") } });
  refreshSite();
  redirect("/admin/blog?deleted=1");
}

// ---------- Funders ----------

export async function saveFunder(formData: FormData) {
  await requireAdmin();
  const id = num(formData, "id");
  const data = {
    name: text(formData, "name"),
    logo: await imageFrom(formData, "logo"),
    url: text(formData, "url"),
    showLogo: checkbox(formData, "showLogo"),
    sortOrder: num(formData, "sortOrder"),
  };
  if (id) {
    await prisma.funder.update({ where: { id }, data });
  } else {
    await prisma.funder.create({ data });
  }
  refreshSite();
  redirect("/admin/funders?saved=1");
}

export async function deleteFunder(formData: FormData) {
  await requireAdmin();
  await prisma.funder.deleteMany({ where: { id: num(formData, "id") } });
  refreshSite();
  redirect("/admin/funders?deleted=1");
}

// ---------- Messages ----------

export async function toggleMessageRead(formData: FormData) {
  await requireAdmin();
  const id = num(formData, "id");
  const message = await prisma.message.findUnique({ where: { id } });
  if (message) {
    await prisma.message.update({ where: { id }, data: { isRead: !message.isRead } });
  }
  redirect("/admin/messages");
}

export async function deleteMessage(formData: FormData) {
  await requireAdmin();
  await prisma.message.deleteMany({ where: { id: num(formData, "id") } });
  redirect("/admin/messages?deleted=1");
}
