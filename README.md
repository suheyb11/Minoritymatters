# Minority Matters — website redesign

A full redesign of minoritymatters.org.uk with an admin panel for managing all content.
It keeps the existing content (programmes, values, about text, press, blog, funders, contact details)
and the brand colours from the logo: pink `#e71d73` and grey `#b2b2b2`.

## Tech

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS 4
- Framer Motion (animations)
- Prisma 6 with Supabase (PostgreSQL) for the database
- Supabase Storage (public bucket `media`) for images uploaded in the admin
- Fonts: Bricolage Grotesque (headings) and Figtree (text), self-hosted through npm

## Supabase setup (once)

1. Create a project on [supabase.com](https://supabase.com).
2. **Project Settings → Database → Connection string**, copy two strings into `.env` (start from `.env.example`):
   - `DATABASE_URL` — **Transaction pooler** (port 6543), with `?pgbouncer=true&connection_limit=1&connect_timeout=30` added at the end.
     The website uses this one.
   - `DIRECT_URL` — **Session pooler** (port 5432), with `?connect_timeout=30` added at the end. `prisma migrate` uses this one.
     (The "Direct connection" only works over IPv6, which most home networks and Vercel do not have.)
   - If the password has symbols like `@`, write them encoded: `@` → `%40`, `#` → `%23`, `/` → `%2F`.
3. **Project Settings → API**, copy `SUPABASE_URL` (Project URL) and `SUPABASE_SERVICE_ROLE_KEY` (service_role key).
   The service role key is secret: it is only used on the server and must never get a `NEXT_PUBLIC_` name.
4. Run:

```bash
npm install
npx prisma migrate deploy   # creates the tables in Supabase (from prisma/migrations)
npm run db:seed             # fills the database with the content from the old website
npm run media:move          # creates the public "media" bucket for uploaded images
```

To bring content from a backup instead of the seed, run `npm run data:import` instead of `npm run db:seed`.

## Run it

```bash
npm run dev                 # http://localhost:3000
```

Admin panel: http://localhost:3000/admin (Administrator: password = `ADMIN_PASSWORD` in `.env`; Website managers are added under Admin > Users).

`npm run db:seed` deletes everything and puts the original content back (see `prisma/seed.ts`), so only run it
when you want to start over — on Supabase this also wipes everything changed in the admin.

### Database commands

| Command | What it does |
|---|---|
| `npm run db:migrate` | After changing `prisma/schema.prisma`: creates a new migration and updates the tables |
| `npm run db:seed` | Deletes everything and adds the original content again |
| `npm run db:studio` | Opens Prisma Studio in the browser to look at and edit the data |
| `npm run data:export` | Saves every row to `backup/data.json` (a good regular backup) |
| `npm run data:import` | Loads `backup/data.json` into an empty database (the one in `DATABASE_URL`) and resets the id counters |
| `npx tsx scripts/brochure-update.ts` | One-time: adds the brochure content (service areas, Who we are, referral text) to an existing database. Safe to run again. |
| `npx tsx scripts/founder-seed.ts` | One-time: fills the Our founder settings (placeholders) in an existing database. Only fills empty fields. |
| `npm run media:move` | Creates the `media` bucket, uploads any files from `uploads/` and fixes old `/media/...` addresses |

## Pages

| Page | Address | Content comes from |
|---|---|---|
| Home | `/` | Site settings, programmes, values, press, blog, funders |
| Our work | `/our-work` | Admin → Our work: 5 service areas (Type = Service area) and the programmes list (Type = Programme) |
| Press | `/press` | Admin → Press |
| Blog | `/blog`, `/blog/[slug]` | Admin → Blog |
| About | `/about` | Admin → Site settings (About section) |
| Values | `/values` | Admin → Values |
| Our funders | `/our-funders` | Admin → Funders |
| Our founder | `/our-founder` | Admin → Site settings (Founder video). Linked from the home page, About, Our work and the footer |
| Contact | `/contact` | Form saves to Admin → Messages |

## Admin panel

- **Dashboard** — counts and the latest messages
- **Messages** — contact form messages: reply by email, mark read/unread, delete
- **Our work / Blog / Press / Values / Funders** — add, edit, delete, reorder, upload images
- **Site settings** — home text, about text, vision, mission, address, phone, emails, donate link, social links

Uploaded images (max 4 MB) go to the public Supabase Storage bucket `media`; the database stores their full public address.

## Project structure

```
app/
  (site)/            public pages (one folder per page) + layout with header/footer
  admin/
    login/           login page
    (panel)/         admin pages (one file per section)
    actions.ts       all admin save/delete actions
components/
  Header.tsx, Footer.tsx, PageHeader.tsx
  Motion.tsx         all animations (ring, reveal, count-up, programme list)
  AdminUI.tsx        form fields and buttons for the admin
lib/
  db.ts              Prisma client + all read functions
  storage.ts         uploads images to Supabase Storage
  auth.ts            admin login (Administrator + Website managers)
  mail.ts            sending email (Google SMTP, set up in Admin > Site settings)
  conversations.ts   Admin > Messages: conversations, replies, email answers (IMAP)
prisma/
  schema.prisma      database tables
  seed.ts            starting content from the old website
  brochure.ts        text from the brochure (used by the seed and scripts/brochure-update.ts)
  migrations/        database changes (created by prisma migrate)
scripts/
  copy-old-sqlite.ts one-time copy from the old data/minoritymatters.db
  move-uploads.ts    creates the media bucket and moves uploads/ files into it
  brochure-update.ts one-time brochure content update for an existing database
  founder-seed.ts    one-time founder video placeholders for an existing database
  export-data.ts     backup to backup/data.json
  import-data.ts     restore from backup/data.json
```

## Content to check before going live

- **Blog posts**: only the opening paragraph of the two original posts is included. Paste the full text of each
  post in Admin → Blog → Edit.
- **Our work**: the first three programmes are copied word for word. The last four (Campaign, Parent Champions,
  Muslim Community Engagement, Claim Your Future) were rewritten from the original page — compare them with the
  live site and correct them in Admin → Our work.
- **Press images** still load from the old WordPress site. Before switching the domain, download each image
  and upload it again in Admin → Press.
- **Home page facts** (years active, 150+ teachers, 6–18, 3 boroughs) and the About timeline are in
  `app/(site)/page.tsx` and `app/(site)/about/page.tsx`.
- **Institute of Islamic Teachers** logo is shown in the funders strip — untick "Show logo" in Admin → Funders if
  it should not be there.

## Deploying to Vercel

1. Push the project to GitHub and import it in Vercel (framework: Next.js; the default build command is fine —
   `npm install` runs `prisma generate` automatically).
2. In **Vercel → Project → Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `DATABASE_URL` | Supabase Transaction pooler string (port 6543) + `?pgbouncer=true&connection_limit=1&connect_timeout=30` |
| `DIRECT_URL` | Supabase Session pooler string (port 5432) + `?connect_timeout=30` |
| `ADMIN_PASSWORD` | the Administrator password |
| `ADMIN_EMAIL` | optional: the email the Administrator logs in with (empty = any email) |
| `SESSION_SECRET` | a long random string |
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | the service_role key (secret — never `NEXT_PUBLIC_`) |

3. `vercel.json` runs the site in Dublin (`dub1`), next to the Supabase database in `eu-west-1`. This keeps
   pages fast: every database query is a round trip, so the site and the database should be in the same region.
4. When you change `prisma/schema.prisma`: run `npm run db:migrate` locally (it updates Supabase through
   `DIRECT_URL`), commit the new folder in `prisma/migrations`, then deploy.

Back up regularly with `npm run data:export`; Supabase also keeps daily backups on paid plans.
