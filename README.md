# Minority Matters — website redesign

A full redesign of minoritymatters.org.uk with an admin panel for managing all content.
It keeps the existing content (programmes, values, about text, press, blog, funders, contact details)
and the brand colours from the logo: pink `#e71d73` and grey `#b2b2b2`.

## Tech

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS 4
- Framer Motion (animations)
- SQLite with plain SQL (`better-sqlite3`) — the database is one file: `data/minoritymatters.db`
- Fonts: Bricolage Grotesque (headings) and Figtree (text), self-hosted through npm

## Run it

```bash
npm install
cp .env.example .env     # then change ADMIN_PASSWORD and SESSION_SECRET
npm run dev              # http://localhost:3000
```

The first time the site starts it creates the database and fills it with the content from the old website
(see `lib/seed.ts`). To start again from the original content, stop the site and delete the `data` folder.

Admin panel: http://localhost:3000/admin (password = `ADMIN_PASSWORD` in `.env`).

## Pages

| Page | Address | Content comes from |
|---|---|---|
| Home | `/` | Site settings, programmes, values, press, blog, funders |
| Our work | `/our-work` | Admin → Our work (animated programme list that opens and closes) |
| Press | `/press` | Admin → Press |
| Blog | `/blog`, `/blog/[slug]` | Admin → Blog |
| About | `/about` | Admin → Site settings (About section) |
| Values | `/values` | Admin → Values |
| Our funders | `/our-funders` | Admin → Funders |
| Contact | `/contact` | Form saves to Admin → Messages |

## Admin panel

- **Dashboard** — counts and the latest messages
- **Messages** — contact form messages: reply by email, mark read/unread, delete
- **Our work / Blog / Press / Values / Funders** — add, edit, delete, reorder, upload images
- **Site settings** — home text, about text, vision, mission, address, phone, emails, donate link, social links

Uploaded images are saved in the `uploads/` folder and served from `/media/...`.

## Project structure

```
app/
  (site)/            public pages (one folder per page) + layout with header/footer
  admin/
    login/           login page
    (panel)/         admin pages (one file per section)
    actions.ts       all admin save/delete actions
  media/[file]/      serves uploaded images
components/
  Header.tsx, Footer.tsx, PageHeader.tsx
  Motion.tsx         all animations (ring, reveal, count-up, programme list)
  AdminUI.tsx        form fields and buttons for the admin
lib/
  db.ts              database tables + all read functions
  seed.ts            starting content from the old website
  auth.ts            admin password login
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

## Deploying

Because the database and uploads are files on disk, host the site on a server that keeps files between restarts:
a VPS (with PM2 + Nginx), Railway or Render with a persistent volume, or any Node.js hosting.

```bash
npm install
npm run build
npm start          # port 3000
```

Keep the `data/` and `uploads/` folders on the persistent disk and back them up.

Vercel and other serverless hosts cannot save files, so the admin panel would not be able to save changes there.
To use Vercel, move the database to a hosted Postgres (for example Supabase or Neon) and uploads to a storage
service — the SQL in `lib/db.ts` and `app/admin/actions.ts` is the only code that needs to change.
