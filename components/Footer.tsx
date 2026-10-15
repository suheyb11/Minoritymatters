import Link from "next/link";
import type { Setting } from "@prisma/client";

// Simple social icons (drawn with SVG so we don't need an icon library)
function SocialIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    tiktok:
      "M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6Z",
    x: "M17.8 3h3l-6.6 7.6L22 21h-6.1l-4.8-6.3L5.6 21h-3l7.1-8.1L2.2 3h6.2l4.3 5.7L17.8 3Zm-1 16.2h1.7L7.3 4.7H5.5l11.3 14.5Z",
    facebook:
      "M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v1.9H8v3.2h2.6V21H14v-9.3h2.6l.4-3.2h-3Z",
    youtube:
      "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z",
  };
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

export default function Footer({ settings }: { settings: Setting }) {
  const socials = [
    { name: "tiktok", label: "TikTok", url: settings.tiktokUrl },
    { name: "x", label: "X", url: settings.xUrl },
    { name: "facebook", label: "Facebook", url: settings.facebookUrl },
    { name: "youtube", label: "YouTube", url: settings.youtubeUrl },
  ].filter((s) => s.url);

  return (
    <footer className="bg-plum text-white/80">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-3xl font-semibold leading-none text-white">
            <span className="text-grey">minority</span>
            <br />
            <span className="text-pink">matters</span>
          </p>
          <p className="mt-5 max-w-sm text-white/70">
            {settings.communityLine ||
              "Working with minority communities in London since 2010 to support children's education, empower parents and keep young people safe."}
          </p>
          <ul className="mt-6 flex gap-3">
            {socials.map((s) => (
              <li key={s.name}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-pink"
                >
                  <SocialIcon name={s.name} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-sans text-sm font-semibold text-white">Visit or call us</h2>
          <address className="mt-4 space-y-2 not-italic">
            <p>{settings.address}</p>
            <p>
              <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-pink">
                {settings.phone}
              </a>
            </p>
            <p>
              <a href={`mailto:${settings.email}`} className="hover:text-pink">
                {settings.email}
              </a>
            </p>
          </address>
        </div>

        <div>
          <h2 className="font-sans text-sm font-semibold text-white">Explore</h2>
          <ul className="mt-4 grid grid-cols-2 gap-2">
            {[
              ["/our-work", "Our work"],
              ["/press", "Press"],
              ["/blog", "Blog"],
              ["/about", "About"],
              ["/our-founder", "Our founder"],
              ["/values", "Values"],
              ["/our-funders", "Our funders"],
              ["/contact", "Contact"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="hover:text-pink">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-white/60 sm:flex-row sm:justify-between sm:px-6">
          <p>© Minority Matters {new Date().getFullYear()}</p>
          <p>Registered charity number {settings.charityNumber}</p>
        </div>
      </div>
    </footer>
  );
}
