# Website-ka WordPress (Hostinger Single)

Folder-kan wuxuu ka kooban yahay website-ka Minority Matters oo WordPress loo beddelay. Design-ku waa kii hore.

| Folder | Waa maxay |
|---|---|
| `mm-core/` | **Plugin**: xogta oo dhan (programmes, projects, events + bookings, values, press, funders, messages, site settings) iyo importer-ka |
| `minority-matters/` | **Theme**: design-ka (bogag, CSS, JavaScript, fonts, sawirrada `assets/images`) |
| `build-css.mjs` | Wuxuu dhisaa `minority-matters/assets/css/app.css` (Tailwind) |
| `dist/` | ZIP-yada la upload-gareeyo (lama keydiyo git-ka) |

Website-ka Vercel wuu sii shaqeynayaa inta aad tan dhisayso. Domain-ka waxaa la beddelayaa oo keliya marka WordPress-ku diyaar noqdo (tallaabada 6).

## 1. Samee ZIP-yada (kumbuyuutarkaaga)

```bash
node wordpress/build-css.mjs
cd wordpress
tar -a -c -f dist/mm-core.zip mm-core
tar -a -c -f dist/minority-matters.zip --exclude=src.css minority-matters
```

## 2. Ku rakib WordPress Hostinger

1. hPanel → **Websites** → domain-ka `minoritymatters.org.uk` → **WordPress** ku rakib (Auto Installer).
   Samee user admin ah oo password adag leh.
2. Inta DNS-ku weli Vercel tilmaamayo, website-ka WordPress-ka waxaad ka arkaysaa hPanel → **Preview website**
   (ama cinwaanka ku meel gaarka ah ee Hostinger, tusaale `….hostingersite.com`).

## 3. Plugin-ka iyo theme-ka

1. WordPress admin → **Plugins → Add New → Upload Plugin** → `dist/mm-core.zip` → **Activate**.
   Wuxuu sameeyaa bogagga (Home, Blog, Our work, Impact, Events, About, Values, Press, Our funders, Our founder, Contact),
   table-ka bookings-ka, iyo web addresses-ka (`/blog/<post>/`, `/impact/<project>/`, `/events/<event>/`).
2. **Appearance → Themes → Add New → Upload Theme** → `dist/minority-matters.zip` → **Activate**.
3. Haddii Hostinger uu ku rakibay plugins aadan u baahnayn (tusaale page builders), waad dami kartaa.
   **LiteSpeed Cache** waa la hayn karaa, waayo wuxuu website-ka ka dhigaa mid dhaqso badan.

## 4. Ku shub xogta website-ka hore

Kumbuyuutarkaaga (folder-ka project-ka, `.env` wuxuu weli tilmaamaa Supabase):

```bash
npm run data:for-wordpress
```

Wuxuu sameeyaa `backup/data.json` (dhammaan xogta) iyo `backup/media/` (sawirrada admin-ka laga upload-gareeyay).

1. hPanel → **File Manager** → `public_html/wp-content/uploads/` → samee folder `mm-media` → ku upload-garee dhammaan
   faylasha `backup/media/`.
2. WordPress admin → **Tools → Import website data** → dooro `backup/data.json` → **Import**.
3. Hubi: **Projects**, **Events → Bookings**, **Messages**, **Site settings** iyo bogagga website-ka.

Haddii aad mar kale import-gareyso (tusaale xog cusub), sax sanduuqa "Delete the website content that is here now first".

## 5. Tijaabi

Fur website-ka (Preview) oo hubi:
- Bog kasta: home, our work (programmes way furmaan), impact (year/category filter), events, about, values, press, funders, founder (video), contact, blog
- **Contact form** → fariinta waxay ka muuqanaysaa **Messages**
- **Booking**: event leh "Booking form on this website" → buuxi → **Events → Bookings** → CSV download
- Telefoonka: menu-ga mobile-ka
- **Site settings → Booking notification email**: geli email-ka charity-ga si loogu soo diro booking kasta

## 6. U beddel domain-ka WordPress-ka

1. Ka hor beddelka: ku celi tallaabada 4 (`npm run data:for-wordpress` + import, adigoo saxaya "Delete … first")
   si bookings-ka iyo fariimaha cusub ee website-ka hore loo keeno.
2. hPanel → **Domains → DNS / Nameservers**: tirtir A record-ka `216.198.79.1` iyo CNAME-ka `www` ee Vercel,
   kadib u jihee Hostinger (hPanel wuxuu leeyahay badhanka "Point domain to Hostinger"). DNS-ku wuxuu qaadan karaa ilaa 24 saacadood.
3. hPanel → **Security → SSL** → daar SSL (bilaash).
4. WordPress → **Settings → General**: hubi in labada address ay yihiin `https://minoritymatters.org.uk`.
5. Marka wax walba shaqeeyaan: Vercel-ka ka saar domain-ka. Supabase-ka ha tirtirin ilaa aad hubiso.

## Admin panel-ka website-ka: `/admin`

Website-ka waxaa lagu maamulaa **`https://minoritymatters.org.uk/admin`**, ee ma aha WordPress admin-ka.

| Qof | Wuxuu galaa | Wuxuu samayn karaa |
|---|---|---|
| **Website manager** | `/admin/login` (email + password) | Content-ka oo dhan, messages, bookings, site settings. WordPress admin-ka ma arko |
| **Administrator** (adiga) | `/admin/login` ama `/wp-admin` | Wax walba, iyo **/admin/users**: ku dar ama ka saar Website managers |

Ku darista qof: `/admin/users` → **Add a Website manager** → magaca, email-ka, password-ka (ugu yaraan 12 xaraf,
"Make a strong password" ayaa mid kuu samaynaya) → **Add person**. Password-ka adigu u dir qofka (ha ku dirin email).
Wuxuu ka beddeli karaa `/admin/account`.

### Messages (`/admin/messages`)

- Fariimaha contact form-ka waxaa loo kala saaraa **qof-qof** (email kasta hal wadahadal). Fur qof, kadib
  ku qor jawaabta sanduuqa hoose → **Send reply** (ama Ctrl+Enter). Email-ku toos ayuu qofka ugu dirmayaa.
- Jawaab kasta waa la kaydiyaa: wadahadalka oo dhan (fariimihiisa + jawaabahaaga) halkaas ayuu ku jiraa.
- Marka qofku email-kaaga ka jawaabo, jawaabtiisu waxay timaadaa **mailbox-kaaga caadiga ah**
  (Site settings → **Contact form email**, ama **Email** haddii kaas banaan yahay), ma aha panel-ka.
- **Contact form email**: email-ka loo diro nuqul fariin kasta oo cusub. Banaan = email ma jiro.

### Email sending (`/admin/settings` → hoose, Administrator oo keliya)

Email-ka website-ku diro (jawaabaha, nuqullada contact form-ka, ogeysiisyada booking-ka) wuxuu ku baxaa
**Google Workspace** (`info@minoritymatters.org.uk`), si uusan Spam u gelin.

1. Account-ka `info@` ee Google: **myaccount.google.com → Security → 2-Step Verification** → daar.
2. Kadib **myaccount.google.com/apppasswords** → magac "Website" → **Create** → koobiyee 16-ka xaraf.
3. `/admin/settings` → **Email sending** → Google account: `info@minoritymatters.org.uk`, App password: 16-ka xaraf → **Save**.
4. **Send test email** → hubi inuu inbox (ma aha Spam) yimid.

Jawaabaha email-ka: marka uu qof email ku jawaabo, website-ku wuxuu ka akhriyaa mailbox-ka info@ (IMAP,
read-only) oo ku daraa wadahadalkiisa `/admin/messages` (calaamad "Email reply"). Wuxuu eegaa oo keliya dadka
website-ka wax kaaga soo qoray oo aad panel-ka uga jawaabtay. Waxay dhacdaa marka `/admin/messages` la furo,
10-kii daqiiqo kasta, ama badhanka **Check for email replies**. Gmail-ka info@: IMAP waa inuu daaran yahay
(Gmail → Settings → Forwarding and POP/IMAP → Enable IMAP).

DNS (Crazy Domains), si email-ku u noqdo mid la aamini karo:
- **TXT** `@` → `v=spf1 include:_spf.google.com ~all` (SPF)
- **DKIM**: admin.google.com → Apps → Google Workspace → Gmail → **Authenticate email** → Generate new record →
  ku dar TXT-ga `google._domainkey` ee Crazy Domains → kadib **Start authentication**.
- **TXT** `_dmarc` → `v=DMARC1; p=none; rua=mailto:info@minoritymatters.org.uk` (ikhtiyaari, laakiin waa la doorbidaa)

## Cusbooneysiinta (update) plugin-ka ama theme-ka

1. Samee ZIP-yada (tallaabada 1).
2. **Plugins → Add New Plugin → Upload Plugin** → `mm-core.zip` → **Install Now** → **Replace current with uploaded**.
3. **Appearance → Themes → Add New Theme → Upload Theme** → `minority-matters.zip` → **Replace current with uploaded**.

Xogta waxba kama dhacaan. Web addresses-ka iyo doorarka si otomaatig ah ayaa loo cusbooneysiiyaa
(beddel `MM_CORE_VERSION` ee `mm-core/mm-core.php` mar kasta oo plugin-ka la beddelo).

## Maamulka maalinlaha ah (WordPress admin, Administrators oo keliya)

| Waxa aad rabto | Halkee |
|---|---|
| Qoraalka home/about/contact/founder video | **Site settings** |
| Programmes iyo 5-ta service area | **Our work** (Type = Service area / Programme, Order = kala horreynta) |
| Projects (Impact) | **Projects** ("Feature on the home page" = story-ga home-ka) |
| Events iyo bookings | **Events** (Copy = nuqul cusub; **Bookings** = liiska, status, CSV) |
| Blog | **Posts** (Blog post details = "By" iyo cover photo) |
| Fariimaha contact form-ka | **Messages** |
| Backup | hPanel → **Backups** (toddobaadle) |

## Marka design-ka wax laga beddelo

Theme-ka waxaa ku jira Tailwind classes. Kadib marka aad class cusub ku darto fayl `.php` ama `.js`:

```bash
node wordpress/build-css.mjs
```

Kadib ZIP-ka theme-ka dib u samee oo upload-garee (Appearance → Themes → Add New → Upload → "Replace current").
