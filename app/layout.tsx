import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import "./globals.css";

// Public pages are cached, so they open instantly. Every save in the admin refreshes the
// cache straight away (revalidatePath in app/admin/actions.ts); as a backup, pages also refresh
// once an hour (for example after changing data in Prisma Studio). Admin pages are never cached.
export const revalidate = 3600;

export const metadata: Metadata = {
  // The site's full address, so share images (Open Graph) get a complete link.
  // On Vercel this is the production domain; on your computer it is localhost.
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"
  ),
  title: {
    default: "Minority Matters — community, education and child safeguarding in London",
    template: "%s | Minority Matters",
  },
  description:
    "Minority Matters is a London charity working with minority communities to support children's education, empower parents and protect young people from criminal exploitation.",
  icons: { icon: "/images/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
