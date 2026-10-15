"use server";

// All admin "save" and "delete" actions live in this file.
// Every action first checks that the admin is logged in.

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, makeSlug } from "@/lib/db";
import { requireAdmin, checkPasswordAndLogIn, logOut } from "@/lib/auth";

// ---------- Small helpers ----------

function text(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function num(formData: FormData, name: string) {
  return Number(formData.get(name) || 0) || 0;
}

function checkbox(formData: FormData, name: string) {
  return formData.get(name) === "on" ? 1 : 0;
}

// If a file was chosen, save it to the /uploads folder and return its web address.
// Otherwise return the address typed in the text box.
async function imageFrom(formData: FormData, name: string) {
  const file = formData.get(name + "File");
  if (file instanceof File && file.size > 0) {
    const allowed = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
    const ext = path.extname(file.name).toLowerCase();
    if (!allowed.includes(ext)) throw new Error("Please upload a PNG, JPG, GIF, WEBP or SVG image.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Images must be smaller than 5 MB.");

    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const fileName = Date.now() + "-" + crypto.randomBytes(4).toString("hex") + ext;
    fs.writeFileSync(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));
    return "/media/" + fileName;
  }
  return text(formData, name);
}

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
  const fields = [
    "heroTagline", "introHeading", "introSubtitle", "introText",
    "address", "phone", "email", "pressEmail", "charityNumber", "donateUrl",
    "tiktokUrl", "xUrl", "facebookUrl", "youtubeUrl",
    "aboutLead", "aboutStory", "vision", "mission",
  ];
  const sql = `UPDATE Setting SET ${fields.map((f) => `${f} = ?`).join(", ")} WHERE id = 1`;
  db.prepare(sql).run(...fields.map((f) => text(formData, f)));
  refreshSite();
  redirect("/admin/settings?saved=1");
}

// ---------- Services (Our work) ----------

export async function saveService(formData: FormData) {
  await requireAdmin();
  const id = num(formData, "id");
  const title = text(formData, "title");
  const slug = makeSlug(text(formData, "slug") || title);
  const data = [
    title, slug, text(formData, "summary"), text(formData, "intro"), text(formData, "points"),
    text(formData, "outro"), await imageFrom(formData, "icon"), num(formData, "sortOrder"), checkbox(formData, "published"),
  ];

  try {
    if (id) {
      db.prepare(
        "UPDATE Service SET title=?, slug=?, summary=?, intro=?, points=?, outro=?, icon=?, sortOrder=?, published=? WHERE id=?"
      ).run(...data, id);
    } else {
      db.prepare(
        "INSERT INTO Service (title, slug, summary, intro, points, outro, icon, sortOrder, published) VALUES (?,?,?,?,?,?,?,?,?)"
      ).run(...data);
    }
  } catch {
    redirect(`/admin/services?${id ? "edit=" + id : "new=1"}&error=slug`);
  }
  refreshSite();
  redirect("/admin/services?saved=1");
}

export async function deleteService(formData: FormData) {
  await requireAdmin();
  db.prepare("DELETE FROM Service WHERE id = ?").run(num(formData, "id"));
  refreshSite();
  redirect("/admin/services?deleted=1");
}

// ---------- Values ----------

export async function saveValue(formData: FormData) {
  await requireAdmin();
  const id = num(formData, "id");
  const data = [text(formData, "title"), text(formData, "text"), await imageFrom(formData, "icon"), num(formData, "sortOrder")];
  if (id) {
    db.prepare("UPDATE Value SET title=?, text=?, icon=?, sortOrder=? WHERE id=?").run(...data, id);
  } else {
    db.prepare("INSERT INTO Value (title, text, icon, sortOrder) VALUES (?,?,?,?)").run(...data);
  }
  refreshSite();
  redirect("/admin/values?saved=1");
}

export async function deleteValue(formData: FormData) {
  await requireAdmin();
  db.prepare("DELETE FROM Value WHERE id = ?").run(num(formData, "id"));
  refreshSite();
  redirect("/admin/values?deleted=1");
}

// ---------- Press ----------

export async function savePress(formData: FormData) {
  await requireAdmin();
  const id = num(formData, "id");
  const data = [
    text(formData, "title"), text(formData, "source"), text(formData, "url"),
    await imageFrom(formData, "image"), num(formData, "sortOrder"),
  ];
  if (id) {
    db.prepare("UPDATE PressItem SET title=?, source=?, url=?, image=?, sortOrder=? WHERE id=?").run(...data, id);
  } else {
    db.prepare("INSERT INTO PressItem (title, source, url, image, sortOrder) VALUES (?,?,?,?,?)").run(...data);
  }
  refreshSite();
  redirect("/admin/press?saved=1");
}

export async function deletePress(formData: FormData) {
  await requireAdmin();
  db.prepare("DELETE FROM PressItem WHERE id = ?").run(num(formData, "id"));
  refreshSite();
  redirect("/admin/press?deleted=1");
}

// ---------- Blog posts ----------

export async function savePost(formData: FormData) {
  await requireAdmin();
  const id = num(formData, "id");
  const title = text(formData, "title");
  const slug = makeSlug(text(formData, "slug") || title);
  const date = text(formData, "publishedAt") || new Date().toISOString().slice(0, 10);
  const data = [
    title, slug, text(formData, "excerpt"), text(formData, "body"), await imageFrom(formData, "coverImage"),
    text(formData, "author") || "Minority Matters", checkbox(formData, "published"), new Date(date).toISOString(),
  ];

  try {
    if (id) {
      db.prepare(
        "UPDATE Post SET title=?, slug=?, excerpt=?, body=?, coverImage=?, author=?, published=?, publishedAt=? WHERE id=?"
      ).run(...data, id);
    } else {
      db.prepare(
        "INSERT INTO Post (title, slug, excerpt, body, coverImage, author, published, publishedAt) VALUES (?,?,?,?,?,?,?,?)"
      ).run(...data);
    }
  } catch {
    redirect(`/admin/blog?${id ? "edit=" + id : "new=1"}&error=slug`);
  }
  refreshSite();
  redirect("/admin/blog?saved=1");
}

export async function deletePost(formData: FormData) {
  await requireAdmin();
  db.prepare("DELETE FROM Post WHERE id = ?").run(num(formData, "id"));
  refreshSite();
  redirect("/admin/blog?deleted=1");
}

// ---------- Funders ----------

export async function saveFunder(formData: FormData) {
  await requireAdmin();
  const id = num(formData, "id");
  const data = [
    text(formData, "name"), await imageFrom(formData, "logo"), text(formData, "url"),
    checkbox(formData, "showLogo"), num(formData, "sortOrder"),
  ];
  if (id) {
    db.prepare("UPDATE Funder SET name=?, logo=?, url=?, showLogo=?, sortOrder=? WHERE id=?").run(...data, id);
  } else {
    db.prepare("INSERT INTO Funder (name, logo, url, showLogo, sortOrder) VALUES (?,?,?,?,?)").run(...data);
  }
  refreshSite();
  redirect("/admin/funders?saved=1");
}

export async function deleteFunder(formData: FormData) {
  await requireAdmin();
  db.prepare("DELETE FROM Funder WHERE id = ?").run(num(formData, "id"));
  refreshSite();
  redirect("/admin/funders?deleted=1");
}

// ---------- Messages ----------

export async function toggleMessageRead(formData: FormData) {
  await requireAdmin();
  db.prepare("UPDATE Message SET isRead = 1 - isRead WHERE id = ?").run(num(formData, "id"));
  redirect("/admin/messages");
}

export async function deleteMessage(formData: FormData) {
  await requireAdmin();
  db.prepare("DELETE FROM Message WHERE id = ?").run(num(formData, "id"));
  redirect("/admin/messages?deleted=1");
}
