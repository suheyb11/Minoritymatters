# Website-ka Next.js ee Hostinger (Business), MySQL

Website-ku wuxuu ku shaqeeyaa Hostinger **Node.js Web App**. Database-ku waa **MySQL**-ka Hostinger, faylasha admin-ka
(sawirrada iyo faylasha jawaabaha) waxay ku jiraan disk-ga Hostinger (`STORAGE_DIR`). Supabase looma baahna mar dambe.

Branch-ka: `hostinger`. Vercel wuxuu sii daabacayaa `main` (Supabase) ilaa domain-ka la wareejiyo.

## 1. Samee database-ka MySQL
hPanel → **Databases → MySQL Databases** → samee database + user (password adag). Qor:
`u123456789_mm` (database), `u123456789_mm` (user), password.

## 2. Ka shaqee kumbuyuutarkaaga: samee table-yada, ku shub xogta
1. hPanel → **Databases → Remote MySQL** → ku dar IP-gaaga (ama "Any host" inta aad shaqeyneyso) → dooro database-ka.
   Qor magaca host-ka (tusaale `srv1234.hstgr.io`).
2. `.env`:
   ```
   SUPABASE_DATABASE_URL="<DATABASE_URL-kii hore ee Supabase>"
   SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...   (sidii hore)
   DATABASE_URL="mysql://USER:PASSWORD@srv1234.hstgr.io:3306/DATABASE"
   ```
3. ```bash
   npm run data:from-supabase   # xogta → backup/data.json, faylasha → backup/storage/
   npm run db:deploy            # table-yada MySQL
   npm run data:import          # xogta → MySQL
   ```

## 3. Faylasha (sawirrada iyo attachments)
hPanel → **File Manager** → home folder-ka (meel ka baxsan `public_html` iyo app-ka) → samee folder `mm-storage`
→ ku upload-garee waxa ku jira `backup/storage/` (folder-yada `media` iyo `attachments`).
Path-ka buuxa (tusaale `/home/u123456789/mm-storage`) waa `STORAGE_DIR`.

## 4. Node.js app-ka
hPanel → **Websites → Add website → Node.js Apps → Import Git repository** → `suheyb11/Minoritymatters`, branch `hostinger`.
- Node version: **20** ama **22**
- Build command: `npx prisma migrate deploy && npm run build`
- Start command: `npm start`

Environment variables:

| Magac | Qiimaha |
|---|---|
| `DATABASE_URL` | `mysql://USER:PASSWORD@localhost:3306/DATABASE` |
| `STORAGE_DIR` | `/home/u123456789/mm-storage` |
| `SITE_URL` | `https://minoritymatters.org.uk` |
| `ADMIN_PASSWORD`, `ADMIN_EMAIL`, `SESSION_SECRET` | sida `.env` (SESSION_SECRET isku mid ha ahaado: emailka password-ka la keydiyay wuu ku xiran yahay) |
| `RESEND_API_KEY`, `BOOKING_NOTIFY_EMAIL`, `BOOKING_FROM_EMAIL` | haddii la isticmaalo |

Build-ku wuxuu u baahan yahay database-ka (bogagga waa la diyaariyaa). Haddii build-ku dhaho
"Can't reach database server at localhost", `DATABASE_URL` ku beddel host-ka Remote MySQL (`srv1234.hstgr.io`).

## 5. Tijaabi, kadib domain-ka
Ka fur cinwaanka ku meel gaarka ah: bogag kasta, sawirrada, admin login, contact form → Messages, booking event,
jawaab email ah oo fayl leh, sawir cusub oo admin-ka laga upload-gareeyo.
Kadib: domain-ka ku xir app-ka, DNS-ka ka wareeji Vercel, `hostinger` ku merge-garee `main`, Vercel-ka dami.
Remote MySQL-ka IP-gaaga ka saar marka aadan u baahnayn.
