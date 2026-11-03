"use server";

// All admin "save" and "delete" actions live in this file.
// Every action first checks that the admin is logged in (Users and Email sending: the Administrator).

import path from "path";
import crypto from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma, makeSlug, fromLondonInput, EVENT_AUDIENCES, SITE_URL } from "@/lib/db";
import { uploadImage, contentTypeFor } from "@/lib/storage";
import {
  requireAdmin,
  requireAdministrator,
  checkLogin,
  setSession,
  logOut,
  normalEmail,
  hashPassword,
  checkPassword,
} from "@/lib/auth";
import { tooMany } from "@/lib/rate-limit";
import { getMailConfig, sendMail, encrypt, replyToAddress, EMAIL_PATTERN } from "@/lib/mail";
import {
  emailKey,
  getConversation,
  syncReplies,
  attachmentStorage,
  deleteReplyFiles,
  safeFileName,
  attachmentExtension,
  ATTACH_MAX,
  ATTACH_SIZE,
  ATTACH_TOTAL,
  ATTACH_TYPES,
  type ReplyFile,
} from "@/lib/conversations";

// ---------- Small helpers ----------

// Browsers send line breaks as "\r\n"; store them as plain "\n"
function text(formData: FormData, name: string) {
  return String(formData.get(name) || "").replace(/\r\n/g, "\n").trim();
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
  // At most 10 tries per visitor in 10 minutes, so passwords can't be guessed
  if (await tooMany("login", 10)) redirect("/admin/login?error=busy");
  const id = await checkLogin(text(formData, "email"), String(formData.get("password") || ""));
  if (id === null) redirect("/admin/login?error=wrong");
  await setSession(id, checkbox(formData, "remember"));
  redirect("/admin");
}

export async function logoutAction() {
  await logOut();
  redirect("/admin/login?out=1");
}

// ---------- Users (Website managers; Administrator only) ----------

export async function addManager(formData: FormData) {
  await requireAdministrator();
  const name = plain(formData, "name", 200);
  const email = normalEmail(text(formData, "email"));
  const password = String(formData.get("password") || "");
  if (!name || !EMAIL_PATTERN.test(email)) redirect("/admin/users?error=missing");
  if (password.length < 12) redirect("/admin/users?error=short");
  if (email === normalEmail(process.env.ADMIN_EMAIL || "")) redirect("/admin/users?error=exists");
  try {
    await prisma.adminUser.create({ data: { name, email, passwordHash: hashPassword(password) } });
  } catch (error) {
    if (!isDuplicateError(error)) throw error;
    redirect("/admin/users?error=exists");
  }
  redirect("/admin/users?saved=1");
}

export async function removeManager(formData: FormData) {
  await requireAdministrator();
  await prisma.adminUser.deleteMany({ where: { id: num(formData, "id") } });
  redirect("/admin/users?deleted=1");
}

// My account: change your own password (Website managers; the Administrator's password is ADMIN_PASSWORD)
export async function changePassword(formData: FormData) {
  const admin = await requireAdmin();
  if (admin.isAdministrator) redirect("/admin/account");
  const user = await prisma.adminUser.findUnique({ where: { id: admin.id } });
  if (!user || !checkPassword(String(formData.get("current") || ""), user.passwordHash)) redirect("/admin/account?error=wrong");
  const password = String(formData.get("new") || "");
  if (password.length < 12) redirect("/admin/account?error=short");
  await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash: hashPassword(password) } });
  // The new password changes the cookie's signature: log this person straight back in
  await setSession(user.id, false);
  redirect("/admin/account?saved=1");
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
      instagramUrl: text(formData, "instagramUrl"),
      linkedinUrl: text(formData, "linkedinUrl"),
      aboutLead: text(formData, "aboutLead"),
      aboutStory: text(formData, "aboutStory"),
      vision: text(formData, "vision"),
      mission: text(formData, "mission"),
      whoWeAre: text(formData, "whoWeAre"),
      referralText: text(formData, "referralText"),
      tagline: text(formData, "tagline"),
      communityLine: text(formData, "communityLine"),
      founderName: text(formData, "founderName"),
      founderRole: text(formData, "founderRole"),
      founderPhoto: await imageFrom(formData, "founderPhoto"),
      founderVideoUrl: text(formData, "founderVideoUrl"),
      founderIntro: text(formData, "founderIntro"),
      founderTranscript: text(formData, "founderTranscript"),
      contactNotifyEmail: text(formData, "contactNotifyEmail"),
      bookingNotifyEmail: text(formData, "bookingNotifyEmail"),
      donateGiveyUrl: text(formData, "donateGiveyUrl"),
    },
  });
  refreshSite();
  redirect("/admin/settings?saved=1");
}

// ---------- Email sending (Administrator only, see lib/mail.ts) ----------

export async function saveMailSettings(formData: FormData) {
  await requireAdministrator();
  const old = await getMailConfig();
  const port = num(formData, "port");
  const pass = String(formData.get("pass") || "").replace(/\s+/g, "");
  const user = normalEmail(text(formData, "user"));
  const fromAddress = normalEmail(text(formData, "fromAddress"));
  await prisma.mailConfig.update({
    where: { id: 1 },
    data: {
      user: EMAIL_PATTERN.test(user) ? user : "",
      fromAddress: EMAIL_PATTERN.test(fromAddress) ? fromAddress : "",
      // An empty password box keeps the saved password (it is never shown again)
      pass: checkbox(formData, "forget") ? "" : pass ? encrypt(pass) : old.pass,
      host: text(formData, "host").replace(/[^a-z0-9.-]/gi, "") || "smtp.gmail.com",
      port: [25, 465, 587, 2525].includes(port) ? port : 587,
      lastError: "",
      imapError: "",
    },
  });
  redirect("/admin/settings?mail=saved#mail");
}

export async function sendTestEmail(formData: FormData) {
  await requireAdministrator();
  const to = normalEmail(text(formData, "to"));
  if (!EMAIL_PATTERN.test(to)) redirect("/admin/settings?mail=bad-to#mail");
  await prisma.mailConfig.update({ where: { id: 1 }, data: { lastError: "" } });
  const ok = await sendMail({
    to,
    subject: "Test email from the Minority Matters website",
    text: `This is a test email from the website.\n\nIf it arrived in your inbox (not Spam), email sending works.\n\n${SITE_URL}/`,
  });
  redirect(`/admin/settings?mail=${ok ? "sent" : "failed"}&to=${encodeURIComponent(to)}#mail`);
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
    kind: text(formData, "kind") === "area" ? "area" : "programme",
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

// ---------- Projects (Impact) ----------

export async function saveProject(formData: FormData) {
  await requireAdmin();
  const id = num(formData, "id");
  const title = text(formData, "title");

  // Photos chosen in "Add photos to the gallery" are uploaded and added to the end of the gallery list
  const gallery = text(formData, "gallery").split("\n").filter((line) => line.trim());
  for (const file of formData.getAll("galleryFiles")) {
    if (!(file instanceof File) || file.size === 0) continue;
    const ext = path.extname(file.name).toLowerCase();
    if (!contentTypeFor(ext)) throw new Error("Please upload PNG, JPG, GIF, WEBP or SVG images.");
    if (file.size > 4 * 1024 * 1024) throw new Error("Images must be smaller than 4 MB.");
    const fileName = Date.now() + "-" + crypto.randomBytes(4).toString("hex") + ext;
    gallery.push(await uploadImage(fileName, Buffer.from(await file.arrayBuffer()), ext));
  }

  const data = {
    title,
    slug: makeSlug(text(formData, "slug") || title),
    period: text(formData, "period"),
    category: text(formData, "category"),
    summary: text(formData, "summary"),
    body: text(formData, "body"),
    stats: text(formData, "stats"),
    peopleReached: num(formData, "peopleReached"),
    coverImage: await imageFrom(formData, "coverImage"),
    gallery: gallery.join("\n"),
    relatedService: text(formData, "relatedService"),
    sortOrder: num(formData, "sortOrder"),
    published: checkbox(formData, "published"),
    isFeatured: checkbox(formData, "isFeatured"),
    featuredHeadline: text(formData, "featuredHeadline"),
  };

  try {
    // Only one project can be on the home page: saving a featured project un-features all the others.
    // Both steps run together (a transaction), so they always happen at the same time.
    await prisma.$transaction(async (tx) => {
      const saved = id ? await tx.project.update({ where: { id }, data }) : await tx.project.create({ data });
      if (saved.isFeatured) {
        await tx.project.updateMany({ where: { id: { not: saved.id }, isFeatured: true }, data: { isFeatured: false } });
      }
    });
  } catch (error) {
    if (!isDuplicateError(error)) throw error;
    redirect(`/admin/projects?${id ? "edit=" + id : "new=1"}&error=slug`);
  }
  refreshSite();
  redirect("/admin/projects?saved=1");
}

export async function deleteProject(formData: FormData) {
  await requireAdmin();
  await prisma.project.deleteMany({ where: { id: num(formData, "id") } });
  refreshSite();
  redirect("/admin/projects?deleted=1");
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

// ---------- Messages (conversations, see lib/conversations.ts) ----------

function messagesUrl(email: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams({ ...(email ? { with: email } : {}), ...params }).toString();
  return "/admin/messages" + (query ? "?" + query : "");
}

// "Mark as unread" goes back to the list (opening the conversation would mark it read again)
export async function markConversationUnread(formData: FormData) {
  await requireAdmin();
  const email = emailKey(text(formData, "with"));
  const last = await prisma.message.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  if (last) await prisma.message.update({ where: { id: last.id }, data: { isRead: false } });
  redirect("/admin/messages");
}

// Delete a whole conversation: the messages, the replies and the files sent with them
export async function deleteConversation(formData: FormData) {
  await requireAdmin();
  const email = emailKey(text(formData, "with"));
  if (email) {
    const replies = await prisma.reply.findMany({ where: { email } });
    await deleteReplyFiles(replies);
    await prisma.reply.deleteMany({ where: { email } });
    await prisma.message.deleteMany({ where: { email: { equals: email, mode: "insensitive" } } });
  }
  redirect("/admin/messages?deleted=1");
}

// "Check for email replies"
export async function checkEmailReplies(formData: FormData) {
  await requireAdmin();
  const email = emailKey(text(formData, "with"));
  let params: Record<string, string>;
  try {
    params = { checked: String(await syncReplies(true)) };
  } catch {
    params = { error: "imap" };
  }
  redirect(messagesUrl(email, params));
}

// Step 1 of attaching files: the browser asks where to upload them (straight to Storage, see ReplyForm),
// because Vercel refuses requests bigger than 4.5 MB. Returns one upload address per file, or a problem.
export async function prepareAttachments(files: { name: string; size: number }[]) {
  await requireAdmin();
  if (files.length > ATTACH_MAX) return { error: "files" as const };
  if (files.some((f) => f.size > ATTACH_SIZE) || files.reduce((sum, f) => sum + f.size, 0) > ATTACH_TOTAL) return { error: "file-size" as const };
  if (files.some((f) => !ATTACH_TYPES.includes(attachmentExtension(f.name)))) return { error: "file-type" as const };

  const storage = await attachmentStorage();
  const folder = crypto.randomBytes(12).toString("hex");
  const uploads = [];
  for (const f of files) {
    const filePath = `${folder}/${safeFileName(f.name)}`;
    const { data, error } = await storage.createSignedUploadUrl(filePath);
    if (error || !data) return { error: "file-failed" as const };
    uploads.push({ name: f.name, path: filePath, size: f.size, url: data.signedUrl });
  }
  return { uploads };
}

// Step 2: send the reply (with the files uploaded in step 1)
export async function sendReply(formData: FormData) {
  const admin = await requireAdmin();
  const email = emailKey(text(formData, "with"));
  const back = (params: Record<string, string>) => redirect(messagesUrl(email, params) + "#reply");

  // Only people who wrote to us through the website can be answered here (the admin is not an open mail server)
  const incoming = (await getConversation(email)).flatMap((i) => (i.type === "in" ? [i.message] : []));
  if (!incoming.length || !EMAIL_PATTERN.test(email)) redirect("/admin/messages");

  const subject = plain(formData, "subject", 200).replace(/[\r\n]+/g, " ") || "Re: your message to Minority Matters";
  const body = plain(formData, "body", 20000);
  if (!body) back({ error: "empty" });
  if (body.length > 10000) back({ error: "long" });

  // The uploaded files: only from the attachments folder, and checked again on the server
  let files: ReplyFile[] = [];
  try {
    const list = JSON.parse(String(formData.get("files") || "[]"));
    files = (Array.isArray(list) ? list : []).map((f) => ({ name: safeFileName(String(f.name)), path: String(f.path), size: 0 }));
  } catch {
    files = [];
  }
  if (files.some((f) => !/^[a-f0-9]{24}\/[A-Za-z0-9_.-]+$/.test(f.path))) back({ error: "file-failed" });
  if (files.length > ATTACH_MAX) back({ error: "files" });
  const attachments = [];
  if (files.length) {
    const storage = await attachmentStorage();
    for (const f of files) {
      const { data, error } = await storage.download(f.path);
      if (error || !data) back({ error: "file-failed" });
      const content = Buffer.from(await data!.arrayBuffer());
      f.size = content.length;
      attachments.push({ filename: f.name, content });
    }
    if (files.some((f) => f.size > ATTACH_SIZE) || files.reduce((sum, f) => sum + f.size, 0) > ATTACH_TOTAL) {
      await storage.remove(files.map((f) => f.path));
      back({ error: "file-size" });
    }
  }

  // The email: the reply, a signature, and the person's last message underneath
  const last = incoming[incoming.length - 1];
  const signature = admin.isAdministrator ? "Minority Matters" : `${admin.name}\nMinority Matters`;
  const mailText =
    `${body}\n\n--\n${signature}\n${SITE_URL}/\n\n` +
    `----- Your message of ${last.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" })} -----\n` +
    last.message;
  const replyTo = await replyToAddress();
  const sent = await sendMail({
    to: email,
    subject,
    text: mailText,
    replyTo: replyTo ? `Minority Matters <${replyTo}>` : undefined,
    attachments,
  });

  // Saved either way, so the conversation shows what was written
  await prisma.reply.create({ data: { email, subject, body, files, sent, authorName: admin.name } });
  await prisma.message.updateMany({ where: { id: { in: incoming.map((m) => m.id) } }, data: { isRead: true } });
  back(sent ? { sent: "1" } : { error: "mail" });
}

// ---------- Events ----------

// Text without HTML tags, cut to a maximum length
function plain(formData: FormData, name: string, max = 10000) {
  return text(formData, name).replace(/<[^>]*>/g, "").replace(/[<>]/g, "").slice(0, max);
}

// A whole number, or null when the box is empty ("no limit")
function optionalNumber(formData: FormData, name: string) {
  const value = text(formData, name);
  if (!value) return null;
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const BOOKING_TYPES = ["form", "external", "none"];
const BOOKING_STATUSES = ["confirmed", "waitlist", "cancelled", "attended"];

export async function saveEvent(formData: FormData) {
  await requireAdmin();
  const id = num(formData, "id");
  const back = `/admin/events?${id ? "edit=" + id : "new=1"}`;
  const title = plain(formData, "title", 200);

  // The date boxes are London time; fromLondonInput turns them into the right UTC moment
  const startsAt = fromLondonInput(text(formData, "startsAt"));
  const endsAt = fromLondonInput(text(formData, "endsAt"));
  if (!title || !startsAt || (endsAt && endsAt < startsAt)) redirect(back + "&error=date");

  const bookingType = BOOKING_TYPES.includes(text(formData, "bookingType")) ? text(formData, "bookingType") : "form";
  const bookingUrl = text(formData, "bookingUrl").slice(0, 500);
  if (bookingType === "external" && !/^https?:\/\//.test(bookingUrl)) redirect(back + "&error=url");

  const data = {
    title,
    slug: makeSlug(text(formData, "slug") || title),
    summary: plain(formData, "summary", 500),
    body: plain(formData, "body"),
    startsAt,
    endsAt,
    location: plain(formData, "location", 200),
    address: plain(formData, "address", 300),
    audience: EVENT_AUDIENCES.includes(text(formData, "audience")) ? text(formData, "audience") : "Everyone",
    ageMin: optionalNumber(formData, "ageMin"),
    ageMax: optionalNumber(formData, "ageMax"),
    price: plain(formData, "price", 100) || "Free",
    capacity: optionalNumber(formData, "capacity"),
    bookingType,
    bookingUrl: bookingType === "external" ? bookingUrl : "",
    bookingClosesAt: fromLondonInput(text(formData, "bookingClosesAt")),
    coverImage: await imageFrom(formData, "coverImage"),
    projectSlug: text(formData, "projectSlug"),
    published: checkbox(formData, "published"),
  };

  try {
    if (id) {
      await prisma.event.update({ where: { id }, data });
    } else {
      await prisma.event.create({ data });
    }
  } catch (error) {
    if (!isDuplicateError(error)) throw error;
    redirect(back + "&error=slug");
  }
  refreshSite();
  redirect("/admin/events?saved=1");
}

export async function deleteEvent(formData: FormData) {
  await requireAdmin();
  // Its bookings are deleted with it (onDelete: Cascade in prisma/schema.prisma)
  await prisma.event.deleteMany({ where: { id: num(formData, "id") } });
  refreshSite();
  redirect("/admin/events?deleted=1");
}

// Copies an event as a hidden draft, without its bookings. Handy for sessions that repeat.
export async function duplicateEvent(formData: FormData) {
  await requireAdmin();
  const event = await prisma.event.findUnique({ where: { id: num(formData, "id") } });
  if (!event) redirect("/admin/events");

  // Find a free web address: "baking-copy", then "baking-copy-2", ...
  let slug = `${event.slug}-copy`;
  for (let i = 2; await prisma.event.findUnique({ where: { slug } }); i++) slug = `${event.slug}-copy-${i}`;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, ...fields } = event;
  const copy = await prisma.event.create({ data: { ...fields, title: `${event.title} (copy)`, slug, published: false } });
  redirect(`/admin/events?edit=${copy.id}&saved=1`);
}

export async function setBookingStatus(formData: FormData) {
  await requireAdmin();
  const status = text(formData, "status");
  const booking = await prisma.booking.findUnique({ where: { id: num(formData, "id") } });
  if (!booking) redirect("/admin/events");
  if (BOOKING_STATUSES.includes(status)) {
    await prisma.booking.update({ where: { id: booking.id }, data: { status } });
    refreshSite(); // the places left on the event page change
  }
  redirect(`/admin/events?bookings=${booking.eventId}&saved=1`);
}

export async function deleteBooking(formData: FormData) {
  await requireAdmin();
  const booking = await prisma.booking.findUnique({ where: { id: num(formData, "id") } });
  if (!booking) redirect("/admin/events");
  await prisma.booking.delete({ where: { id: booking.id } });
  refreshSite(); // the places left on the event page change
  redirect(`/admin/events?bookings=${booking.eventId}&deleted=1`);
}

export async function markAllAttended(formData: FormData) {
  await requireAdmin();
  const eventId = num(formData, "eventId");
  await prisma.booking.updateMany({ where: { eventId, status: "confirmed" }, data: { status: "attended" } });
  refreshSite();
  redirect(`/admin/events?bookings=${eventId}&saved=1`);
}

// Data protection: we don't keep people's details longer than needed.
// Deletes the bookings of every event that ended more than 12 months ago (the events themselves stay).
export async function deleteOldBookings() {
  await requireAdmin();
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const result = await prisma.booking.deleteMany({
    where: { event: { OR: [{ endsAt: { lt: cutoff } }, { endsAt: null, startsAt: { lt: cutoff } }] } },
  });
  redirect(`/admin/events?cleaned=${result.count}`);
}
